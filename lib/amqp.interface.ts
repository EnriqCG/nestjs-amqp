import { ModuleMetadata, Type } from '@nestjs/common'
import { Options } from 'amqplib'

export interface AMQPModuleOptions {
  uri?: string
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

export interface AMQPOptionsFactory {
  createAMQPOptions(): Promise<AMQPModuleOptions> | AMQPModuleOptions
}

export interface AMQPModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  name?: string
  useExisting?: Type<AMQPOptionsFactory>
  useClass?: Type<AMQPOptionsFactory>
  useFactory?: (...args: any[]) => Promise<AMQPModuleOptions> | AMQPModuleOptions
  inject?: any[]
}
