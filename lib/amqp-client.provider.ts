import { Logger, Provider } from '@nestjs/common'
import * as amqp from 'amqp-connection-manager'

import { AMQP_CLIENT, AMQP_MODULE_OPTIONS } from './amqp.constants'
import { AMQPModuleOptions } from './amqp.interface'

export interface AMQPClient {
  defaultKey: string
  clients: Map<string, amqp.ChannelWrapper>
  clientOptions: Map<string, AMQPModuleOptions>
  size: number
}

export const createClient = (): Provider => ({
  provide: AMQP_CLIENT,
  useFactory: async (options: AMQPModuleOptions): Promise<AMQPClient> => {
    const logger = new Logger('AMQPModule', true)

    const clients = new Map<string, amqp.ChannelWrapper>()
    const clientOptions = new Map<string, AMQPModuleOptions>()

    let defaultKey = 'default'

    if (options.name && options.name.length !== 0) {
      defaultKey = options.name
    }

    const connection = amqp.connect(options)

    connection.on('connect', ({ connection, url }) => {
      logger.log(`Connected to RabbitMQ broker: ${url.hostname}`)
    })

    connection.on('disconnect', ({ err }) => {
      logger.error(`Lost connection to RabbitMQ broker.\n${err.stack}`)
    })

    clients.set(defaultKey, connection.createChannel())
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
