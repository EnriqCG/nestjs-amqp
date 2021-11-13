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
import { AMQP_CONNECTION_NAME, AMQP_MODULE_OPTIONS } from './amqp.constants'
import { AMQPModuleOptions } from './amqp.interface'
import amqpConnectionManager from 'amqp-connection-manager'
import { getAMQPChannelToken, getAMQPConnectionToken } from './amqp.utils'
import { AMQPExplorer } from '../dist/amqp.explorer'
import { AMQPMetadataAccessor } from '../dist/amqp-metadata.accessor'
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager'

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
      useFactory: (): IAmqpConnectionManager => {
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
      useFactory: (connection: IAmqpConnectionManager) => {
        const channel = connection.createChannel()

        channel.addSetup((channel: Channel) => {
          if (options.exchange && options.exchange.assert && options.exchange.type) {
            channel.assertExchange(options.exchange.name, options.exchange.type)
          } else if (options.exchange && options.exchange.assert && !options.exchange.type) {
            throw new Error("Can't assert an exchange without specifying the type")
          }
        })

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
    const connection = this.moduleRef.get<IAmqpConnectionManager>(this.connectionName)

    connection.close()
  }
}
