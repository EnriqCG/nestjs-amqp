import { Module } from '@nestjs/common'
import { AMQPModule } from '../../lib'
import { JobsModule } from './jobs/jobs.module'

@Module({
  imports: [
    AMQPModule.forRoot({
      hostname: 'localhost',
      port: 5672,
      assertQueuesByDefault: true,
      assertExchanges: [{
        type: 'topic',
        name: 'test_exchange',
      }],
      service: {
        exchange: 'test_exchange',
        name: 'test'
      },
      wait: true
    }),
    JobsModule,
  ],
})
export class AppModule { }
