import { Injectable, Type } from '@nestjs/common'
import { Controller } from '@nestjs/common/interfaces'
import { Reflector } from '@nestjs/core'
import { AMQP_QUEUE_CONSUMER, AMQP_CONTROLLER } from './amqp.constants'
import { AMQPMetadataConfiguration, ControllerMetadata } from './amqp.interface'

@Injectable()
export class AMQPMetadataAccessor {
  constructor(private readonly reflector: Reflector) { }

  isConsumerComponent(target: Type<any> | Function): boolean {
    if (!target) return false

    return !!this.reflector.get(AMQP_CONTROLLER, target)
  }

  getConsumerComponentMetadata(target: Type<any> | Function): ControllerMetadata {
    return this.reflector.get(AMQP_CONTROLLER, target)
  }

  getMethodMetadata(
    instance: object,
    instancePrototype: Controller,
    methodKey: string,
    controllerMetadata: ControllerMetadata,
  ): AMQPMetadataConfiguration {
    const targetCallback = instancePrototype[methodKey]

    const metadata = Reflect.getMetadata(AMQP_QUEUE_CONSUMER, targetCallback)

    return {
      ...metadata,
      callback: metadata ? targetCallback.bind(instance) : null,
      queueName:
        metadata && controllerMetadata.patternPrefix
          ? `${controllerMetadata.patternPrefix}.${metadata.queueName}`
          : metadata?.queueName,
    }
  }
}
