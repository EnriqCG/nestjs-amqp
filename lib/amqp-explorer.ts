import { Injectable } from '@nestjs/common'
import { Controller } from '@nestjs/common/interfaces';
import { DiscoveryService, MetadataScanner } from '@nestjs/core'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { EVENT_METADATA } from './amqp.constants';
import { AMQPMetadataConfiguration } from './amqp.interface';
import { AMQPMetadataAccessor } from './amqp-metadata.accessor'

@Injectable()
export class AMQPExplorer {

    constructor(
        private readonly metadataScanner: MetadataScanner,
        private readonly discoveryService: DiscoveryService,
        private readonly metadataAccessor: AMQPMetadataAccessor
    ) {}

    explore(): AMQPMetadataConfiguration[] {

        const controllers: InstanceWrapper[] = this.discoveryService
            .getControllers()
            .filter((wrapper: InstanceWrapper) =>
                this.metadataAccessor.isConsumerComponent(wrapper.metatype)
            )

        return controllers.map((wrapper: InstanceWrapper) => {

            const { instance } = wrapper

            const instancePrototype = Object.getPrototypeOf(instance)
            
            return this.metadataScanner.scanFromPrototype(
                instance,
                instancePrototype,
                method => this.exploreMethodMetadata(instance, instancePrototype, method)
            )
        }).reduce((prev, curr) => {
            return prev.concat(curr);
        }).filter(handler => handler.queueName)

    }

    exploreMethodMetadata(
        instance: object,
        instancePrototype: Controller,
        methodKey: string,
    ): AMQPMetadataConfiguration {
        const targetCallback = instancePrototype[methodKey]

        const metadata = Reflect.getMetadata(EVENT_METADATA, targetCallback)

        return {
            ...metadata,
            callback: targetCallback.bind(instance)
        }
    }

}
