import { DynamicModule, Module, OnModuleInit } from '@nestjs/common'
import { DiscoveryModule, DiscoveryService } from '@nestjs/core'
import { Logger } from '@nestjs/common/services/logger.service'

import { AMQPCoreModule } from './amqp-core.module'
import { EVENT_METADATA } from './amqp.constants'
import { AMQPModuleOptions, EventMetadata } from './amqp.interface'
import { AMQPService } from './amqp.service'

@Module({
  imports: [DiscoveryModule],
})
export class AMQPModule implements OnModuleInit {
  private readonly logger = new Logger('AMQPModule', true)

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly amqpService: AMQPService,
  ) {}

  static forRoot(options: AMQPModuleOptions | AMQPModuleOptions[]): DynamicModule {
    return {
      module: AMQPModule,
      imports: [AMQPCoreModule.register(options)],
    }
  }

  onModuleInit(): void {
    const { wrappers, amqp, options } = {
      wrappers: this.discovery.getControllers(),
      amqp: this.amqpService.getChannel(),
      options: this.amqpService.getConnectionOptions(),
    }

    if (options.exchange) {
      amqp.assertExchange(options.exchange.name, options.exchange.type)
    }

    wrappers
      .filter(
        (wrapper) =>
          wrapper &&
          !wrapper.isNotMetatype &&
          Reflect.hasMetadata(EVENT_METADATA, wrapper.metatype),
      )
      .map((controller) => {
        const handlers: EventMetadata[] = Reflect.getMetadata(EVENT_METADATA, controller.metatype)

        for (const handler of handlers) {
          this.logger.log(`Mapped ${handler.callback.name} with event ${handler.eventName}`)

          if (options.assertQueues === true) {
            amqp.assertQueue(handler.eventName)
          }

          /**
           * bind queue to defined exchange in options, else bind to default exchange ('')
           *
           * The default exchange is a direct exchange with no name (empty string) pre-declared by the broker
           * https://www.rabbitmq.com/tutorials/amqp-concepts.html#exchange-default
           */
          amqp.bindQueue(handler.eventName, options?.exchange?.name || '', handler.eventName)

          amqp.consume(handler.eventName, async (msg) => {
            const f = await handler.callback(
              Buffer.isBuffer(msg?.content) ? msg?.content.toString() : msg?.content,
            )

            if (f !== false && msg) {
              amqp.ack(msg)
            }
          })
        }
      })
  }
}
