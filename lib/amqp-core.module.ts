import {
  DynamicModule,
  Global,
  Module,
  Inject,
  OnApplicationShutdown,
  Logger,
  Provider,
  Type,
} from '@nestjs/common'
import { DiscoveryModule, ModuleRef } from '@nestjs/core'
import { Channel, Options } from 'amqplib'
import amqpConnectionManager, { AmqpConnectionManager } from 'amqp-connection-manager'

import { getAMQPChannelToken, getAMQPConnectionToken } from './amqp.utils'
import { AMQPModuleOptions, AMQPModuleAsyncOptions, AMQPOptionsFactory } from './amqp.interface'
import { AMQP_CONNECTION_NAME, AMQP_MODULE_OPTIONS } from './amqp.constants'
import { AMQPExplorer } from './amqp.explorer'
import { AMQPMetadataAccessor } from './amqp-metadata.accessor'

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [AMQPExplorer, AMQPMetadataAccessor],
})
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
          console.log('lost', options.name)
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
      ],
      exports: [AMQPChannelProvider],
      imports: [],
    }
  }

  static forRootAsync(options: AMQPModuleAsyncOptions): DynamicModule {
    const logger = new Logger('AMQPModule')

    const amqpConnectionName = getAMQPConnectionToken(options.name)

    const AMQPConnectionProvider: Provider = {
      provide: amqpConnectionName,
      useFactory: async (amqpModuleOptions: AMQPModuleOptions): Promise<any> => {
        const amqpConnection = amqpConnectionManager.connect(amqpModuleOptions.uri)

        amqpConnection.on('connect', () => {
          logger.log(`Connected to RabbitMQ broker.`)
        })

        amqpConnection.on('disconnect', ({ err }) => {
          logger.error(`Lost connection to RabbitMQ broker.\n${err.stack}`)
        })

        return amqpConnection
      },
      inject: [AMQP_MODULE_OPTIONS],
    }

    const AMQPChannelProvider: Provider = {
      provide: getAMQPChannelToken(options.name),
      useFactory: async (
        connection: AmqpConnectionManager,
        amqpModuleOptions: AMQPModuleOptions,
      ) => {
        const channel = connection.createChannel()

        channel.addSetup((channel: Channel) => {
          if (
            amqpModuleOptions.exchange &&
            amqpModuleOptions.exchange.assert &&
            amqpModuleOptions.exchange.type
          ) {
            channel.assertExchange(amqpModuleOptions.exchange.name, amqpModuleOptions.exchange.type)
          } else if (
            amqpModuleOptions.exchange &&
            amqpModuleOptions.exchange.assert &&
            !amqpModuleOptions.exchange.type
          ) {
            throw new Error("Can't assert an exchange without specifying the type")
          }
        })

        await channel.waitForConnect()
        return channel
      },
      inject: [amqpConnectionName, AMQP_MODULE_OPTIONS],
    }

    const AMQPConnectionNameProvider: Provider = {
      provide: AMQP_CONNECTION_NAME,
      useValue: amqpConnectionName,
    }

    const asyncProviders = this.createAsyncProviders(options)

    return {
      module: AMQPCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        AMQPConnectionProvider,
        AMQPChannelProvider,
        AMQPConnectionNameProvider,
      ],
      exports: [AMQPChannelProvider],
    }
  }

  async onApplicationShutdown() {
    const connection = this.moduleRef.get<AmqpConnectionManager>(this.connectionName)

    connection && (await connection.close())
  }

  private static createAsyncProviders(options: AMQPModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }
    const useClass = options.useClass as Type<AMQPOptionsFactory>
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ]
  }

  private static createAsyncOptionsProvider(options: AMQPModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: AMQP_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    const inject = [(options.useClass || options.useExisting) as Type<AMQPOptionsFactory>]

    return {
      provide: AMQP_MODULE_OPTIONS,
      useFactory: async (optionsFactory: AMQPOptionsFactory) =>
        await optionsFactory.createAMQPOptions(),
      inject,
    }
  }
}
