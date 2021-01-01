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

interface AMQPExchange {
  name: string
  type: 'direct' | 'topic' | 'headers' | 'fanout' | 'match'
  assert?: boolean
}
