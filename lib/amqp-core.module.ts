import {
  DynamicModule,
  Global,
  Module,
  Inject,
  OnApplicationShutdown,
  Logger,
  Provider,
} from '@nestjs/common'
import { DiscoveryModule, ModuleRef } from '@nestjs/core'
import { Channel, Options } from 'amqplib'
import amqpConnectionManager, { AmqpConnectionManager } from 'amqp-connection-manager'

import { AMQPExplorer } from './amqp.explorer'
import { AMQPMetadataAccessor } from './amqp-metadata.accessor'
import { getAMQPChannelToken, getAMQPConnectionToken } from './amqp.utils'
import { AMQPModuleOptions } from './amqp.interface'
import { AMQP_CONNECTION_NAME, AMQP_MODULE_OPTIONS } from './amqp.constants'

@Global()
@Module({})
export class AMQPCoreModule implements OnApplicationShutdown {
  constructor(
    @Inject(AMQP_CONNECTION_NAME)
    private readonly connectionName: string,
    private readonly moduleRef: ModuleRef,
  ) {}

  static forRoot(connection: string | Options.Connect, options: AMQPModuleOptions): DynamicModule {
    const logger = new Logger('AMQPModule')

    const amqpConnectionName = getAMQPConnectionToken(options.name)

    const AMQPConnectionProvider: Provider = {
      provide: amqpConnectionName,
      useFactory: (): AmqpConnectionManager => {
        const amqpConnection = amqpConnectionManager.connect(connection)

        amqpConnection.on('connect', () => {
          logger.log(`Connected to RabbitMQ broker.`)
        })

        amqpConnection.on('disconnect', ({ err }) => {
          logger.error(`Lost connection to RabbitMQ broker.\n${err.stack}`)
        })

        return amqpConnection
      },
    }

    const AMQPChannelProvider: Provider = {
      provide: getAMQPChannelToken(options.name),
      useFactory: async (connection: AmqpConnectionManager) => {
        const channel = connection.createChannel()

        channel.addSetup((channel: Channel) => {
          if (options.exchange && options.exchange.assert && options.exchange.type) {
            channel.assertExchange(options.exchange.name, options.exchange.type)
          } else if (options.exchange && options.exchange.assert && !options.exchange.type) {
            throw new Error("Can't assert an exchange without specifying the type")
          }
        })

        await channel.waitForConnect()
        return channel
      },
      inject: [amqpConnectionName],
    }

    const AMQPConfigProvider: Provider = {
      provide: AMQP_MODULE_OPTIONS,
      useValue: options,
    }

    const AMQPConnectionNameProvider: Provider = {
      provide: AMQP_CONNECTION_NAME,
      useValue: amqpConnectionName,
    }

    return {
      module: AMQPCoreModule,
      providers: [
        AMQPConnectionProvider,
        AMQPChannelProvider,
        AMQPConfigProvider,
        AMQPConnectionNameProvider,
        AMQPExplorer,
        AMQPMetadataAccessor,
      ],
      exports: [AMQPConnectionProvider, AMQPChannelProvider],
      imports: [DiscoveryModule],
    }
  }

  onApplicationShutdown(): void {
    const connection = this.moduleRef.get<AmqpConnectionManager>(this.connectionName)

    connection.close()
  }
}
