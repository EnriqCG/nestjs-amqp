import { Injectable } from '@nestjs/common'
import { DiscoveryService } from '@nestjs/core'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import { MetadataScanner } from '@nestjs/core/metadata-scanner'

import { AMQPMetadataAccessor } from './amqp-metadata.accessor'
import { AMQPMetadataConfiguration } from './amqp.interface'

@Injectable()
export class AMQPExplorer {
  constructor(
    private readonly metadataScanner: MetadataScanner,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: AMQPMetadataAccessor,
  ) {}

  explore(): AMQPMetadataConfiguration[] {
    const controllers: InstanceWrapper[] = this.discoveryService
      .getControllers()
      .filter((wrapper: InstanceWrapper) =>
        this.metadataAccessor.isConsumerComponent(wrapper.metatype),
      )

    if (!controllers) {
      return []
    }

    return controllers
      .map((wrapper: InstanceWrapper) => {
        const { instance, metatype } = wrapper

        const { instancePrototype, controllerMetadata } = {
          instancePrototype: Object.getPrototypeOf(instance),
          controllerMetadata: this.metadataAccessor.getConsumerComponentMetadata(metatype),
        }

        return this.metadataScanner.scanFromPrototype(instance, instancePrototype, (method) =>
          this.metadataAccessor.getMethodMetadata(
            instance,
            instancePrototype,
            method,
            controllerMetadata,
          ),
        )
      })
      .reduce((prev, curr) => {
        return prev.concat(curr)
      }, [])
      .filter((handler) => handler.callback)
  }
}
