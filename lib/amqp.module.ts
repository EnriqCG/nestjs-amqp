import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  OnModuleDestroy,
  Provider,
} from '@nestjs/common'
import { DiscoveryModule, ModuleRef } from '@nestjs/core'
import { Logger } from '@nestjs/common/services/logger.service'

import { AMQPModuleOptions } from './amqp.interface'
import { AMQPExplorer } from './amqp.explorer'
import { AMQPMetadataAccessor } from './amqp-metadata.accessor'
import { isFunction } from '@nestjs/common/utils/shared.utils'
import { Channel } from 'amqplib'
import {
  getAMQPPubChannelToken,
  getAMQPConnectionToken,
  getAMQPSubChannelToken,
} from './amqp.utils'
import amqpConnectionManager, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager'
import { AMQP_MODULE_OPTIONS } from './amqp.constants'

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [AMQPExplorer, AMQPMetadataAccessor],
})
export class AMQPModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger('AMQPModule')

  constructor(
    private readonly explorer: AMQPExplorer,
    @Inject(AMQP_MODULE_OPTIONS) private readonly moduleOptions: AMQPModuleOptions,
    private readonly moduleRef: ModuleRef,
  ) {}

  static forRoot(connectionOptions: AMQPModuleOptions): DynamicModule {
    const logger = new Logger('AMQPModule')

    const amqpConnectionName = getAMQPConnectionToken(connectionOptions.name)
    const amqpPubChannelName = getAMQPPubChannelToken(connectionOptions.name)
    const amqpSubChannelName = getAMQPSubChannelToken(connectionOptions.name)

    const amqpModuleOptions = {
      provide: AMQP_MODULE_OPTIONS,
      useValue: connectionOptions,
    }

    // Better interface implementation to be one OR the other, but not both
    const amqpConnection = amqpConnectionManager.connect(connectionOptions.uri ?? connectionOptions)

    const amqpConnectionProvider: Provider = {
      provide: amqpConnectionName,
      useFactory: (): AmqpConnectionManager => {
        amqpConnection.on('connect', () => {
          logger.log(`Connected to RabbitMQ broker.`)
        })

        amqpConnection.on('disconnect', ({ err }) => {
          logger.warn(`Lost connection to RabbitMQ broker.\n${err.stack}`)
        })

        amqpConnection.on('error', ({ err }) => {
          logger.error(`Error on connection to RabbitMQ broker.\n${err.stack}`)
        })

        return amqpConnection
      },
    }

    const amqpPubChannelProvider: Provider = {
      provide: amqpPubChannelName,
      useFactory: async (): Promise<ChannelWrapper> => {
        const ch = amqpConnection.createChannel({
          setup: (ch: Channel) =>
            ch.on('error', (e) => {
              logger.error('Channel error:', e)
            }),
        })

        if (connectionOptions.wait === true) {
          await ch.waitForConnect()
        }

        return ch
      },
    }

    const amqpSubChannelProvider: Provider = {
      provide: amqpSubChannelName,
      useFactory: (): ChannelWrapper => {
        return amqpConnection.createChannel({
          setup: (ch: Channel) =>
            ch.on('error', (e) => {
              logger.error('Channels error:', e)
            }),
        })
      },
    }

    return {
      module: AMQPModule,
      providers: [
        amqpConnectionProvider,
        amqpModuleOptions,
        amqpPubChannelProvider,
        amqpSubChannelProvider,
      ],
      exports: [amqpConnectionName, amqpPubChannelName],
    }
  }

  async onApplicationBootstrap() {
    const { consumers, channel } = {
      consumers: this.explorer.explore(),
      channel: this.moduleRef.get<ChannelWrapper>(getAMQPSubChannelToken(this.moduleOptions.name)),
    }

    await channel.addSetup(async (channel: Channel) => {
      if (this.moduleOptions.assertExchanges) {
        for (const exchange of this.moduleOptions.assertExchanges) {
          if (!exchange.type) {
            throw new Error("Can't assert an exchange without specifying a type")
          }

          channel.assertExchange(exchange.name, exchange.type)
        }
      }

      for (const consumer of consumers) {
        let queueName = consumer.queueName ?? consumer.pattern ?? ''
        let exchange = consumer.exchange

        // If service definition exists on module config AND consumer exchange is null
        // or matches service exchange
        if (this.moduleOptions.service) {
          if (!exchange || (exchange && this.moduleOptions.service.exchange === exchange)) {
            queueName = `${queueName}-${this.moduleOptions.service.name}`
            exchange = this.moduleOptions.service.exchange
          }
        } else {
          if (!exchange) {
            this.logger.error(
              `Exchange on queue handler "${consumer.methodName.toString()}" is required since AMQPModule configuration is missing the service property.`,
            )
            throw new Error()
          }
        }

        // handler.assertQueue takes precedence over assertQueuesByDefault
        if (
          consumer.assertQueue === true ||
          (this.moduleOptions.assertQueuesByDefault === true && consumer.assertQueue !== false)
        ) {
          const queue = await channel.assertQueue(queueName, consumer)

          queueName = queue.queue

          channel.bindQueue(queueName, exchange, `${consumer.queueName ?? consumer.pattern}`)
        }

        // register queue handlers
        await channel.consume(`${queueName}`, async (msg) => {
          const f = this.transformToResult(
            consumer.callback(
              Buffer.isBuffer(msg?.content) ? msg?.content.toString() : msg?.content,
            ),
          )

          // if noAck, the broker won’t expect an acknowledgement of messages delivered to this consumer
          if (!consumer?.noAck && (await f) !== false && msg) {
            channel.ack(msg)
          }
        })

        this.logger.log(`Mapped function ${consumer.methodName.toString()} with queue ${queueName}`)
      }
    })
  }

  async onApplicationShutdown() {
    const connection = this.moduleRef.get<AmqpConnectionManager>(
      getAMQPConnectionToken(this.moduleOptions.name),
    )

    this.logger.log('Closing RabbitMQ connection.')

    await connection.close()
  }

  private async transformToResult(resultOrDeferred: any) {
    if (resultOrDeferred && isFunction(resultOrDeferred.subscribe)) {
      return resultOrDeferred.toPromise()
    }
    return resultOrDeferred
  }
}
