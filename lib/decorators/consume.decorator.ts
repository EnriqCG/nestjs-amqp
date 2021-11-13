import { SetMetadata } from '@nestjs/common'
import { AMQP_QUEUE_CONSUMER } from '../amqp.constants'
import { ConsumerOptions } from '../amqp.interface'

export const Consume = (queueName: string, options?: ConsumerOptions): MethodDecorator => {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(AMQP_QUEUE_CONSUMER, { ...options, queueName, methodName: propertyKey })(
      target,
      propertyKey,
      descriptor,
    )
  }
}
