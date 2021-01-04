import { Injectable } from '@nestjs/common'
import { Controller } from '@nestjs/common/interfaces';
import { MetadataScanner, ModulesContainer } from '@nestjs/core'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { EVENT_METADATA } from './amqp.constants';
import { AMQPMetadataConfiguration } from './amqp.interface';

@Injectable()
export class AMQPMetadataExplorer {

    constructor(
        private readonly modulesContainer: ModulesContainer,
        private readonly metadataScanner: MetadataScanner
    ) {}

    explore() {

        // find all controllers 

        const modules = [...this.modulesContainer.values()]

        const controllers = modules
            .filter(({ controllers }) => controllers.size > 0)
            .map(({ controllers }) => controllers)

        const instanceWrappers: InstanceWrapper<Controller>[] = []

        for (const controller of controllers) {
            const mapKeys = [...controller.keys()]
            for(const key of mapKeys) {
                const controlelrInstance = controller.get(key)
                if(controlelrInstance) {
                    instanceWrappers.push(controlelrInstance)
                }
            }
        }

        return instanceWrappers.map(( { instance }) => {
            const instancePrototype = Object.getPrototypeOf(instance);

            return this.metadataScanner.scanFromPrototype(
                instance,
                instancePrototype,
                method => this.exploreMethodMetadata(instance, instancePrototype, method)
            )
        }).reduce((prev, curr) => {
            return prev.concat(curr);
        })

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
