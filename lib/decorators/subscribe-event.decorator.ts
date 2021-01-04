import { SetMetadata } from '@nestjs/common'
import { Options } from 'amqplib'
import { EVENT_METADATA } from '../amqp.constants'
import { AMQPMetadataConfiguration } from '../amqp.interface'

// TODO: Consumer Options is not being passed here
export const Consume = (queueName: string, consumerOptions?: Options.Consume): MethodDecorator => {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata<string, AMQPMetadataConfiguration>(
      EVENT_METADATA,
      {
        queueName,
        target: target.constructor.name,
        methodName: propertyKey,
        callback: descriptor.value
      }
    )(target, propertyKey, descriptor)
  }
}
