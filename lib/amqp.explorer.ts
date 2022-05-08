import { Inject, Injectable, Logger, OnModuleInit, Options } from '@nestjs/common'
import { MetadataScanner } from '@nestjs/core/metadata-scanner'
import { DiscoveryService, ModuleRef } from '@nestjs/core'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import { ChannelWrapper } from 'amqp-connection-manager'

import { AMQPMetadataAccessor } from './amqp-metadata.accessor'
import { getAMQPChannelToken } from './amqp.utils'
import { AMQPHandlerMetadata, AMQPModuleOptions } from './amqp.interface'
import { AMQP_MODULE_OPTIONS } from './amqp.constants'

@Injectable()
export class AMQPExplorer implements OnModuleInit {
  private readonly logger = new Logger('AMQPModule')

  constructor(
    /* @Inject(AMQP_MODULE_OPTIONS)
    private readonly amqpModuleOptions: AMQPModuleOptions, */
    private readonly moduleRef: ModuleRef,
    private readonly metadataScanner: MetadataScanner,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: AMQPMetadataAccessor,
  ) {}

  onModuleInit() {
    this.explore()
  }

  explore(): void {
    const controllers: InstanceWrapper[] = this.discoveryService
      .getControllers()
      .filter((wrapper: InstanceWrapper) =>
        this.metadataAccessor.isConsumerComponent(wrapper.metatype),
      )

    if (!controllers) {
      return
    }

    const handlers = controllers
      .map((wrapper: InstanceWrapper) => {
        const { instance, metatype } = wrapper

        const { instancePrototype, controllerMetadata } = {
          instancePrototype: Object.getPrototypeOf(instance),
          controllerMetadata: this.metadataAccessor.getConsumerComponentMetadata(metatype),
        }

        return this.metadataScanner.scanFromPrototype(instance, instancePrototype, (method) =>
          this.metadataAccessor.getMethodMetadata(
            instance,
            instancePrototype,
            method,
            controllerMetadata,
          ),
        )
      })
      .reduce((prev, curr) => {
        return prev.concat(curr)
      }, [])
      .filter((handler) => handler.queueName)

    /* handlers.forEach((handler: AMQPHandlerMetadata) => {
      const channelToken = getAMQPChannelToken(handler.connectionName)
      const channel = this.getChannel(channelToken)

      let serviceName = ''
      if (this.amqpModuleOptions.serviceName) {
        serviceName = `-${this.amqpModuleOptions.serviceName}`
      }

      // This is something we want to do on every (re)connection
      channel.addSetup(() => {
        if (this.amqpModuleOptions.assertQueues === true) {
          // TODO: Assert with options like durable
          channel.assertQueue(`${handler.queueName}${serviceName}`)
          this.logger.log(`Asserted queue: ${handler.queueName}`)
        }

        channel.bindQueue(
          `${handler.queueName}${serviceName}`,
          this.amqpModuleOptions?.exchange?.name || '',
          `${handler.queueName}`,
        )
      })

      channel.consume(`${handler.queueName}${serviceName}`, async (msg) => {
        const f = await handler.callback(
          Buffer.isBuffer(msg?.content) ? msg?.content.toString() : msg?.content,
        )

        // if noAck, the broker won’t expect an acknowledgement of messages delivered to this consumer
        if (!handler?.noAck && (await f) !== false && msg) {
          channel.ack(msg)
        }
      })
      this.logger.log(
        `Registered function handler ${handler.methodName.toString()} for queue ${
          handler.queueName
        }`,
      )
    }) */
  }

  getChannel(connectionToken: string) {
    try {
      return this.moduleRef.get<ChannelWrapper>(connectionToken, { strict: false })
    } catch (err) {
      this.logger.error(`No Channel found for connection "${connectionToken}"`)
      throw err
    }
  }
}
