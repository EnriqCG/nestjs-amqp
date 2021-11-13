import { DynamicModule, Module } from '@nestjs/common'
import { isFunction } from '@nestjs/common/utils/shared.utils'
import { Options } from 'amqplib'

import { AMQPCoreModule } from './amqp-core.module'
import { AMQPModuleOptions } from './amqp.interface'

@Module({})
export class AMQPModule {
  static forRoot(connection: string | Options.Connect, options: AMQPModuleOptions): DynamicModule {
    return {
      module: AMQPModule,
      imports: [AMQPCoreModule.forRoot(connection, options)],
    }
  }

  // TODO: Put this in the right place. I think its on the explorer now.
  private async transformToResult(resultOrDeferred: any) {
    if (resultOrDeferred && isFunction(resultOrDeferred.subscribe)) {
      return resultOrDeferred.toPromise()
    }
    return resultOrDeferred
  }
}
