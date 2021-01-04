import { Options } from 'amqplib'

export interface AMQPModuleOptions extends Partial<Options.Connect> {
  name?: string
  assertQueues?: boolean
  exchange?: AMQPExchange
}

export interface EventMetadata {
  queueName: string
  consumerOptions?: Options.Consume
  callback: any
}

export interface AMQPMetadataConfiguration {
  queueName: string,
  target: any,
  methodName: string | symbol,
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
