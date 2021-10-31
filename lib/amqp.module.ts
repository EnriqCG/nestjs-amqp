import { DynamicModule, Module, OnModuleInit } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { Logger } from '@nestjs/common/services/logger.service'

import { AMQPCoreModule } from './amqp-core.module'
import { AMQPModuleOptions } from './amqp.interface'
import { AMQPService } from './amqp.service'
import { AMQPExplorer } from './amqp.explorer'
import { AMQPMetadataAccessor } from './amqp-metadata.accessor'
import { isFunction } from '@nestjs/common/utils/shared.utils'
import { Channel } from 'amqplib'

@Module({
  imports: [DiscoveryModule],
  providers: [AMQPExplorer, AMQPMetadataAccessor],
})
export class AMQPModule implements OnModuleInit {
  private readonly logger = new Logger('AMQPModule', true)

  constructor(private readonly amqpService: AMQPService, private readonly explorer: AMQPExplorer) {}

  static forRoot(options: AMQPModuleOptions | AMQPModuleOptions[]): DynamicModule {
    return {
      module: AMQPModule,
      imports: [AMQPCoreModule.register(options)],
    }
  }

  onModuleInit() {
    const { consumers, amqp, options } = {
      consumers: this.explorer.explore(),
      amqp: this.amqpService.getChannel(),
      options: this.amqpService.getConnectionOptions(),
    }

    amqp.addSetup((channel: Channel) => {
      if (options.exchange && options.exchange.assert && options.exchange.type) {
        amqp.assertExchange(options.exchange.name, options.exchange.type)
      } else if (options.exchange && options.exchange.assert && !options.exchange.type) {
        throw new Error("Can't assert an exchange without specifying the type")
      }

      for (const consumer of consumers) {
        this.logger.log(
          `Mapped function ${consumer.methodName.toString()} with queue ${consumer.queueName}`,
        )

        let serviceName = ''
        if (options.serviceName) {
          serviceName = `-${options.serviceName}`
        }

        if (options.assertQueues === true) {
          amqp.assertQueue(`${consumer.queueName}${serviceName}`)
        }

        /**
         * bind queue to defined exchange in options, else bind to default exchange ('')
         *
         * The default exchange is a direct exchange with no name (empty string) pre-declared by the broker
         * https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchange-default
         */
        amqp.bindQueue(
          `${consumer.queueName}${serviceName}`,
          options?.exchange?.name || '',
          `${consumer.queueName}`,
        )

        amqp.consume(
          `${consumer.queueName}${serviceName}`,
          async (msg) => {
            const f = this.transformToResult(
              await consumer.callback(
                Buffer.isBuffer(msg?.content) ? msg?.content.toString() : msg?.content,
              ),
            )

            // if noAck, the broker won’t expect an acknowledgement of messages delivered to this consumer
            if (!consumer?.noAck && (await f) !== false && msg) {
              amqp.ack(msg)
            }
          },
          consumer,
        )
      }
    })
  }

  private async transformToResult(resultOrDeferred: any) {
    if (resultOrDeferred && isFunction(resultOrDeferred.subscribe)) {
      return resultOrDeferred.toPromise()
    }
    return resultOrDeferred
  }
}
