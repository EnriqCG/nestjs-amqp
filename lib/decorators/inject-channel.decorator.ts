import { Inject } from '@nestjs/common'

import { getAMQPChannelToken } from '../amqp.utils'

export const InjectAMQPChannel = (connectionName?: string): ParameterDecorator =>
  Inject(getAMQPChannelToken(connectionName))
