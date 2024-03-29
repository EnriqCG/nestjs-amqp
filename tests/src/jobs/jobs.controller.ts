import { Controller } from '@nestjs/common'
import { Consume, Consumer } from '../../../lib'
import { JobsService } from './jobs.service'

@Controller()
@Consumer()
export class JobsController {
  /**
   * IS_NOTIFIED implementation based on the official RMQ e2e test
   * from NestJS
   *
   * https://github.com/nestjs/nest/blob/1394305bf394654a0e2c72142b06bd29277718d9/integration/microservices/src/rmq/rmq.controller.ts#L17
   */
  static IS_NOTIFIED = false

  @Consume('notify_queue')
  testServiceHandler(data: any) {
    JobsController.IS_NOTIFIED = data
  }

  @Consume({
    exchange: 'test_exchange',
    pattern: 'notify_queue_alt_syntax'
  })
  testAltSyntaxServiceHandler(data: any) {
    JobsController.IS_NOTIFIED = data
  }

  @Consume({
    exchange: 'test2_exchange',
    assertQueue: true,
    autoDelete: true,
  })
  testEventHandler(data: any) {
    JobsController.IS_NOTIFIED = data
  }
}
