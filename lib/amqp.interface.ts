import { ChannelWrapper, AmqpConnectionManager } from 'amqp-connection-manager'
import { Options } from 'amqplib'

export interface AMQPModuleOptions extends Partial<Options.Connect> {
  name?: string
  assertQueues?: boolean
  exchange?: AMQPExchange
  serviceName?: string
}

export interface EventMetadata {
  queueName: string
  consumerOptions?: Options.Consume
  callback: any
}

export interface AMQPMetadataConfiguration extends Partial<Options.Consume> {
  queueName: string
  target: any
  methodName: string | symbol
  callback: any
  prefix: string
}

interface AMQPExchange {
  name: string
  type?: 'direct' | 'topic' | 'headers' | 'fanout' | 'match'
  assert?: boolean
}

export interface ControllerMetadata {
  patternPrefix: string
}

export interface ClientTuple {
  connection: AmqpConnectionManager
  channel: ChannelWrapper
}
