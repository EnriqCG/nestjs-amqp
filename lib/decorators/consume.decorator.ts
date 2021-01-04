import { SetMetadata } from '@nestjs/common'
import { Options } from 'amqplib'
import { AMQP_QUEUE_CONSUMER } from '../amqp.constants'

interface ConsumerOptions extends Partial<Options.Consume> {
  queueName: string
}

export const Consume = (queueNameOrOptions: string | ConsumerOptions): MethodDecorator => {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const options =
      typeof queueNameOrOptions === 'string'
        ? { queueName: queueNameOrOptions }
        : queueNameOrOptions

    SetMetadata(AMQP_QUEUE_CONSUMER, { ...options, methodName: propertyKey })(
      target,
      propertyKey,
      descriptor,
    )
  }
}
