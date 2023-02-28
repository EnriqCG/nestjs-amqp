import { AMQP_CLIENT, AMQP_MODULE_OPTIONS } from './amqp.constants'
import { AMQPModuleOptions, ClientTuple } from './amqp.interface'
import { Logger, Provider } from '@nestjs/common'
import amqpConnectionManager from 'amqp-connection-manager'
import { Channel } from 'amqplib'

export interface AMQPClient {
  defaultKey: string
  clients: Map<string, ClientTuple>
  clientOptions: Map<string, AMQPModuleOptions>
  size: number
}

export const createClient = (): Provider => ({
  provide: AMQP_CLIENT,
  useFactory: async (options: AMQPModuleOptions): Promise<AMQPClient> => {
    const logger = new Logger('AMQPModule')

    const clients = new Map<string, ClientTuple>()
    const clientOptions = new Map<string, AMQPModuleOptions>()

    let defaultKey = 'default'

    if (options.name && options.name.length !== 0) {
      defaultKey = options.name
    }

    const connection = amqpConnectionManager.connect(options)

    connection.on('connect', () => {
      logger.log(`Connected to RabbitMQ broker.`)
    })

    connection.on('disconnect', ({ err }) => {
      logger.error(`Lost connection to RabbitMQ broker.\n${err.stack}`)
    })

    const channel = connection.createChannel({
      setup: async (channel: Channel) => {
        if (options.prefetchCount !== undefined) {
          await channel.prefetch(options.prefetchCount)
        }
      },
    })

    clients.set(defaultKey, {
      channel,
      connection,
    })
    clientOptions.set(defaultKey, options)

    return {
      defaultKey,
      clients,
      clientOptions,
      size: clients.size,
    }
  },
  inject: [AMQP_MODULE_OPTIONS],
})
