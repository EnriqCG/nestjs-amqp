import { Options } from 'amqplib'
import { EVENT_METADATA } from '../amqp.constants'
import { EventMetadata } from '../amqp.interface'

export const Consume = (queueName: string, consumerOptions?: Options.Consume): MethodDecorator => {
  return (target: object, key: string | symbol, descriptor: PropertyDescriptor) => {
    if (!Reflect.hasMetadata(EVENT_METADATA, target.constructor)) {
      Reflect.defineMetadata(EVENT_METADATA, [], target.constructor)
    }

    const listeners: EventMetadata[] = Reflect.getMetadata(EVENT_METADATA, target.constructor)

    listeners.push({
      queueName,
      consumerOptions,
      callback: descriptor.value,
    })

    Reflect.defineMetadata(EVENT_METADATA, listeners, target.constructor)
    return descriptor
  }
}
