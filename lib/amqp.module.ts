import { DynamicModule, Module, Provider } from '@nestjs/common'
import { isFunction } from '@nestjs/common/utils/shared.utils'
import { DiscoveryModule } from '@nestjs/core'
import { Options } from 'amqplib'

import { AMQPCoreModule } from './amqp-core.module'
import { AMQPMetadataAccessor } from './amqp-metadata.accessor'
import { AMQPExplorer } from './amqp.explorer'
import { AMQPModuleOptions } from './amqp.interface'
import { createChannelProvider } from './amqp.providers'
import { getAMQPConnectionToken } from './amqp.utils'

@Module({})
export class AMQPModule {
  static forRoot(connection: string | Options.Connect, options: AMQPModuleOptions): DynamicModule {
    const AMQPConfigProvider: Provider = {
      provide: getAMQPConnectionToken,
      useValue: options,
    }

    return {
      global: true,
      module: AMQPModule,
      providers: [AMQPConfigProvider],
      exports: [AMQPConfigProvider],
    }
  }

  static registerHandlers(): DynamicModule {
    return {
      module: AMQPModule,
      imports: [AMQPModule.registerCore()],
      providers: [],
    }
  }

  private static registerCore() {
    return {
      global: true,
      module: AMQPModule,
      imports: [DiscoveryModule],
      providers: [AMQPExplorer, AMQPMetadataAccessor],
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
