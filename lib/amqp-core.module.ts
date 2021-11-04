import {
  DynamicModule,
  Global,
  Module,
  Inject,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { AMQPClient } from './amqp-client.provider'
import { createClient } from './amqp-client.provider'
import { AMQP_CLIENT, AMQP_MODULE_OPTIONS } from './amqp.constants'
import { AMQPModuleOptions, ClientTuple } from './amqp.interface'
import { AMQPService } from './amqp.service'

@Global()
@Module({
  providers: [AMQPService],
  exports: [AMQPService],
})
export class AMQPCoreModule implements OnApplicationShutdown {
  constructor(
    @Inject(AMQP_MODULE_OPTIONS)
    private readonly options: AMQPModuleOptions,
    private readonly moduleRef: ModuleRef,
  ) {}

  static register(options: AMQPModuleOptions | AMQPModuleOptions[]): DynamicModule {
    return {
      module: AMQPCoreModule,
      providers: [createClient(), { provide: AMQP_MODULE_OPTIONS, useValue: options }],
      exports: [AMQPService],
    }
  }

  onApplicationShutdown(): void {
    const logger = new Logger('AMQPModule')

    const closeConnection =
      ({ clients, defaultKey }) =>
      (options) => {
        const connectionName = options.name || defaultKey
        const client: ClientTuple = clients.get(connectionName)

        if (client.connection) {
          logger.log('Disconnected from RabbitMQ broker')
          client.connection.close()
        }
      }

    const amqpClient = this.moduleRef.get<AMQPClient>(AMQP_CLIENT)
    const closeClientConnection = closeConnection(amqpClient)

    if (Array.isArray(this.options)) {
      this.options.forEach(closeClientConnection)
    } else {
      closeClientConnection(this.options)
    }
  }
}
