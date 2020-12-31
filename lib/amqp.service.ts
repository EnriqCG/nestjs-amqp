import { Injectable, Inject } from '@nestjs/common'
import { AMQP_CLIENT } from './amqp.constants'
import { Channel } from 'amqplib'
import { AMQPClient } from './amqp-client.provider'
import { AMQPModuleOptions } from './amqp.interface'

@Injectable()
export class AMQPService {
  constructor(
    @Inject(AMQP_CLIENT)
    private readonly amqpClient: AMQPClient,
  ) {}

  getChannel(connectionName?: string): Channel {
    if (!connectionName) {
      connectionName = this.amqpClient.defaultKey
    }

    if (!this.amqpClient.clients.has(connectionName)) {
      throw new Error(`client ${connectionName} does not exist`)
    }

    const channel = this.amqpClient.clients.get(connectionName)

    if(!channel) {
      throw new Error(`channel ${connectionName} does not exist`)
    }

    return channel
  }

  getConnectionOptions(connectionName?: string): AMQPModuleOptions {
    if (!connectionName) {
      connectionName = this.amqpClient.defaultKey
    }

    if (!this.amqpClient.clients.has(connectionName)) {
      throw new Error(`client ${connectionName} does not exist`)
    }

    const channel = this.amqpClient.clientOptions.get(connectionName)

    if(!channel) {
      throw new Error(`channel ${connectionName} does not exist`)
    }

    return channel
  }
}
