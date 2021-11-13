import { Injectable } from '@nestjs/common'
import { Channel } from 'amqplib'
import { InjectAMQPChannel } from '../../..'

@Injectable()
export class JobsService {
  constructor(
    @InjectAMQPChannel()
    private amqpChannel: Channel,
  ) {}

  async publishMessage(exchange: string, routingKey: string, message: string): Promise<boolean> {
    return this.amqpChannel.publish(exchange, routingKey, Buffer.from(message))
  }
}
