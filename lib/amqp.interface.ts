import { ChannelWrapper, AmqpConnectionManager } from 'amqp-connection-manager'
import { Options } from 'amqplib'

export interface ConsumerOptions extends Partial<Options.Consume>, Partial<Options.AssertQueue> {
  /**
   * If pattern is not defined, RabbitMQ will generate a random name for the queue.
   */
  pattern?: string
  queueName?: string
  exchange?: string
  /**
   * Assert this queue to existance. Takes precedence over assertQueuesByDefault
   * in module options.
   */
  assertQueue?: boolean
}

export interface AMQPModuleOptions extends Partial<Options.Connect> {
  name?: string
  uri?: string | string[]
  assertQueuesByDefault?: boolean
  assertExchanges?: AMQPExchange[]
  service?: {
    name: string
    exchange: string
  },
  /**
   * If wait is true, the module will await for a full connection
   * before proceeding with the rest of NestJS initialization.
   */
  wait?: boolean;
}

export interface AMQPMetadataConfiguration extends Partial<Options.Consume>, ConsumerOptions {
  target: any
  methodName: string | symbol
  callback: any
  prefix: string
}

interface AMQPExchange {
  name: string
  type: 'direct' | 'topic' | 'headers' | 'fanout' | 'match'
}

export interface ControllerMetadata {
  patternPrefix: string
}

export interface ClientTuple {
  connection: AmqpConnectionManager
  channel: ChannelWrapper
}
