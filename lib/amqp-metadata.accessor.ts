import { Injectable, Type } from "@nestjs/common";
import { Controller } from "@nestjs/common/interfaces";
import { Reflector } from "@nestjs/core";
import { CONSUMER, EVENT_METADATA } from "./amqp.constants";
import { AMQPMetadataConfiguration, ControllerMetadata } from "./amqp.interface";

@Injectable()
export class AMQPMetadataAccessor {
    constructor(
        private readonly reflector: Reflector
    ) {}

    isConsumerComponent(target: Type<any> | Function): boolean {
        if(!target) return false

        return !!this.reflector.get(CONSUMER, target)
    }

    getConsumerComponentMetadata(target: Type<any> | Function): ControllerMetadata {
        return this.reflector.get(CONSUMER, target)
    }

    getMethodMetadata(
        instance: object,
        instancePrototype: Controller,
        methodKey: string,
        controllerMetadata: ControllerMetadata
    ): AMQPMetadataConfiguration {
        const targetCallback = instancePrototype[methodKey]

        const metadata = Reflect.getMetadata(EVENT_METADATA, targetCallback)

        return {
            ...metadata,
            callback: targetCallback.bind(instance),
            queueName: metadata && controllerMetadata.patternPrefix ? `${controllerMetadata.patternPrefix}.${metadata.queueName}` : metadata?.queueName
        }
    }
}
