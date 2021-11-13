import { DEFAULT_AMQP_CONNECTION, DEFAULT_AMQP_CHANNEL } from './amqp.constants'

export function getAMQPConnectionToken(connectionName?: string) {
  return connectionName ? `${connectionName}-AMQP_CONNECTION` : DEFAULT_AMQP_CONNECTION
}

export function getAMQPChannelToken(connectionName?: string) {
  return connectionName ? `${connectionName}-AMQP_CHANNEL` : DEFAULT_AMQP_CHANNEL
}
