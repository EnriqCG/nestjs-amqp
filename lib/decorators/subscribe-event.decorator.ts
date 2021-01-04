import { SetMetadata } from '@nestjs/common'
import { Options } from 'amqplib'
import { EVENT_METADATA } from '../amqp.constants'
import { AMQPMetadataConfiguration } from '../amqp.interface'

interface ConsumerOptions extends Partial<Options.Consume> {
  queueName: string
}

export const Consume = (queueNameOrOptions: string | ConsumerOptions): MethodDecorator => {
  const options = typeof queueNameOrOptions === 'string' ? { queueName: queueNameOrOptions } : queueNameOrOptions

  return SetMetadata(EVENT_METADATA, options)
}
