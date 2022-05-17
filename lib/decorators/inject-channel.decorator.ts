import { Inject } from '@nestjs/common'

import { getAMQPPubChannelToken } from '../amqp.utils'

export const InjectAMQPChannel = (connectionName?: string): ParameterDecorator =>
  Inject(getAMQPPubChannelToken(connectionName))
