import { Provider } from '@nestjs/common'
import * as amqp from 'amqplib'

import { AMQP_CLIENT, AMQP_MODULE_OPTIONS } from './amqp.constants'
import { AMQPModuleOptions } from './amqp.interface'

export interface AMQPClient {
  defaultKey: string
  clients: Map<string, amqp.Channel>
  clientOptions: Map<string, AMQPModuleOptions>
  size: number
}

export const createClient = (): Provider => ({
  provide: AMQP_CLIENT,
  useFactory: async (options: AMQPModuleOptions): Promise<AMQPClient> => {
    const clients = new Map<string, amqp.Channel>()
    const clientOptions = new Map<string, AMQPModuleOptions>()

    let defaultKey = 'default'

    if (options.name && options.name.length !== 0) {
      defaultKey = options.name
    }

    const connection = await amqp.connect(options)

    clients.set(defaultKey, await connection.createChannel())
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
