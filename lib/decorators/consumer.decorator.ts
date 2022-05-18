import { SetMetadata } from '@nestjs/common'

import { AMQP_CONTROLLER } from '../amqp.constants'

export const Consumer = (patternPrefix?: string): ClassDecorator => {
  return (target: Function) => {
    if (!patternPrefix) {
      patternPrefix = ''
    }

    const consumerMetadata = {
      patternPrefix,
    }

    SetMetadata(AMQP_CONTROLLER, consumerMetadata)(target)
  }
}
