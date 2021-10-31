import { Injectable, Inject } from '@nestjs/common'
import { AMQP_CLIENT } from './amqp.constants'
import { ChannelWrapper } from 'amqp-connection-manager'
import { AMQPClient } from './amqp-client.provider'
import { AMQPModuleOptions } from './amqp.interface'
import { Connection } from 'amqplib'

@Injectable()
export class AMQPService {
  constructor(
    @Inject(AMQP_CLIENT)
    private readonly amqpClient: AMQPClient,
  ) {}

  // TODO: Get tuple in other function and getChannel and getConnection
  // are just getters from the tuple.

  getChannel(connectionName?: string): ChannelWrapper {
    if (!connectionName) {
      connectionName = this.amqpClient.defaultKey
    }

    if (!this.amqpClient.clients.has(connectionName)) {
      throw new Error(`client ${connectionName} does not exist`)
    }

    const connectionTuple = this.amqpClient.clients.get(connectionName)

    if (!connectionTuple) {
      throw new Error(`Connection ${connectionName} does not exist`)
    }

    return connectionTuple.channel
  }

  getConnection(connectionName?: string): Connection {
    if (!connectionName) {
      connectionName = this.amqpClient.defaultKey
    }

    if (!this.amqpClient.clients.has(connectionName)) {
      throw new Error(`client ${connectionName} does not exist`)
    }

    const connectionTuple = this.amqpClient.clients.get(connectionName)

    if (!connectionTuple || !connectionTuple.connection || !connectionTuple.connection.connection) {
      throw new Error(`Connection ${connectionName} does not exist`)
    }

    return connectionTuple.connection.connection
  }

  getConnectionOptions(connectionName?: string): AMQPModuleOptions {
    if (!connectionName) {
      connectionName = this.amqpClient.defaultKey
    }

    if (!this.amqpClient.clients.has(connectionName)) {
      throw new Error(`client ${connectionName} does not exist`)
    }

    const channel = this.amqpClient.clientOptions.get(connectionName)

    if (!channel) {
      throw new Error(`channel ${connectionName} does not exist`)
    }

    return channel
  }
}
