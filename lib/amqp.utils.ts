import {
  DEFAULT_AMQP_CONFIG,
  DEFAULT_AMQP_CONNECTION,
  DEFAULT_AMQP_PUB_CHANNEL,
  DEFAULT_AMQP_SUB_CHANNEL,
} from './amqp.constants'

export function getAMQPConnectionToken(connectionName?: string) {
  return connectionName ? `${connectionName}-AMQP_CONNECTION` : DEFAULT_AMQP_CONNECTION
}

export function getAMQPPubChannelToken(connectionName?: string) {
  return connectionName ? `${connectionName}-AMQP_PUB_CHANNEL` : DEFAULT_AMQP_PUB_CHANNEL
}

export function getAMQPSubChannelToken(connectionName?: string) {
  return connectionName ? `${connectionName}-AMQP_SUB_CHANNEL` : DEFAULT_AMQP_SUB_CHANNEL
}

export function getAMQPOptionsToken(connectionName?: string) {
  return connectionName ? `${connectionName}-AMQP_CONFIG` : DEFAULT_AMQP_CONFIG
}
