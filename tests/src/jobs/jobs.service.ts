import { Injectable } from '@nestjs/common'
import { AMQPService } from '../../../lib'

@Injectable()
export class JobsService {
  constructor(private amqpService: AMQPService) {}

  async publishMessage(exchange: string, routingKey: string, message: string): Promise<boolean> {
    const ch = this.amqpService.getChannel()

    return ch.publish(exchange, routingKey, Buffer.from(message))
  }
}
