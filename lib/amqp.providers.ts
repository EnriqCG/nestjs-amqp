import { Logger, Provider } from '@nestjs/common'
import { Options } from 'amqplib'
import * as amqpConnectionManager from 'amqp-connection-manager'
import { AMQPModuleOptions } from '../dist/amqp.interface'
import { getAMQPConnectionToken, getAMQPOptionsToken } from './amqp.utils'

const logger = new Logger('AMQPModule')

export function createChannelProvider(
  connection: string | Options.Connect,
  options: AMQPModuleOptions,
): Provider {
  return {
    provide: getAMQPConnectionToken(options.name),
    useFactory: (o: AMQPModuleOptions) => {
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
    inject: [getAMQPOptionsToken(options.name)],
  }
}
