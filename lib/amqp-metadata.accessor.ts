import { Injectable, Type } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CONSUMER, EVENT_METADATA } from "./amqp.constants";

@Injectable()
export class AMQPMetadataAccessor {
    constructor(
        private readonly reflector: Reflector
    ) {}

    isConsumerComponent(target: Type<any> | Function): boolean {
        if(!target) return false

        return !!this.reflector.get(CONSUMER, target)
    }
}
