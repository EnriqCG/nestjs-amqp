import { Module } from '@nestjs/common'
import { AMQPModule } from '../../lib'
import { JobsModule } from './jobs/jobs.module'

@Module({
  imports: [
    AMQPModule.forRoot({
      hostname: 'localhost',
      port: 5672,
      assertQueues: true,
      exchange: {
        assert: true,
        type: 'topic',
        name: 'test_exchange',
      },
    }),
    JobsModule,
  ],
})
export class AppModule {}
