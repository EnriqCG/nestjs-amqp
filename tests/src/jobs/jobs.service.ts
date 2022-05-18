import { Injectable } from '@nestjs/common'
import { Channel, ChannelWrapper } from 'amqp-connection-manager'
import { InjectAMQPChannel } from '../../../lib'

@Injectable()
export class JobsService {
  constructor(@InjectAMQPChannel() private amqpChannel: Channel) { }

  async publishMessage(exchange: string, routingKey: string, message: string): Promise<boolean> {
    return this.amqpChannel.publish(exchange, routingKey, Buffer.from(message))
  }
}
