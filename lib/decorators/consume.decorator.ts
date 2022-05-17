import { SetMetadata } from '@nestjs/common'
import { AMQP_QUEUE_CONSUMER } from '../amqp.constants'
import { ConsumerOptions } from '../amqp.interface'

export function Consume(pattern: string): MethodDecorator
export function Consume(options: ConsumerOptions): MethodDecorator
export function Consume(patternOrOptions: string | ConsumerOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const options: ConsumerOptions =
      typeof patternOrOptions === 'string' ? { pattern: patternOrOptions } : patternOrOptions

    SetMetadata(AMQP_QUEUE_CONSUMER, { ...options, methodName: propertyKey })(
      target,
      propertyKey,
      descriptor,
    )
  }
}
