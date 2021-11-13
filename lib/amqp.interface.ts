import { ChannelWrapper, AmqpConnectionManager } from 'amqp-connection-manager'
import { Options } from 'amqplib'

export interface AMQPModuleOptions {
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

export interface AMQPHandlerMetadata extends Partial<Options.Consume> {
  connectionName?: string
  queueName: string
  methodName: string | symbol
  callback: Function
}

interface AMQPExchange {
  name: string
  type?: 'direct' | 'topic' | 'headers' | 'fanout' | 'match'
  assert?: boolean
}

export interface ControllerMetadata {
  patternPrefix: string
}

export interface ConsumerOptions extends Partial<Options.Consume> {
  connectionName?: string
}
