import { Options } from 'amqplib'

export interface AMQPModuleOptions extends Partial<Options.Connect> {
  name?: string
  exchange?: {
    name: string
    type: string
  }
  assertQueues?: boolean
}

export interface EventMetadata {
  eventName: string
  callback: any
}
