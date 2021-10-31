import { Injectable } from '@nestjs/common'
import { AMQPService } from '../../../lib'

@Injectable()
export class JobsService {
  constructor(private amqpService: AMQPService) {}

  async publishMessage(message): Promise<boolean> {
    try {
      const ch = this.amqpService.getChannel()

      return ch.publish('test_exchange', 'test_queue', Buffer.from(message))
    } catch (e) {
      // TODO: Catch exceptions and test them with Jest
      console.log('e', e)
      return false
    }
  }
}
