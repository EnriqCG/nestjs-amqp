# AMQP (RabbitMQ) Client for NestJS

<p align="center">

  <a href="https://github.com/EnriqCG/nestjs-amqp/milestones">
    <img alt="Project Status: Active" src="https://img.shields.io/badge/Project%20Status-active-brightgreen">
  </a>
  <a href="https://github.com/EnriqCG/nestjs-amqplib/LICENSE.md">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg">
  </a>
  <a href="https://www.npmjs.com/package/@enriqcg/nestjs-amqp">
    <img alt="NPM Pulls" src="https://img.shields.io/npm/dm/@enriqcg/nestjs-amqp?label=NPM%20Pulls">
  </a>
  <a href="https://github.com/EnriqCG/nestjs-amqp/releases">
    <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/enriqcg/nestjs-amqp">
  </a>
  <a href="https://github.com/EnriqCG/nestjs-amqp/milestone/1">
    <img alt="Milestone Progress" src="https://img.shields.io/github/milestones/progress/EnriqCG/nestjs-amqp/1">
  </a>

</p>

AMQP module for NestJS with decorator support.

## Note

This project is still a work-in-progress and is being **actively developed**. Issues and PRs are welcome!

---

This module injects a channel from [amqp-connection-manager](https://github.com/jwalton/node-amqp-connection-manager). Please check the [Channel](https://www.squaremobius.net/amqp.node/channel_api.html) documentation for extra insight on how to publish messages.

Connections are recovered when the connection with the RabbitMQ broker is lost.

## Installation

```bash
$ npm i --save @enriqcg/nestjs-amqp
$ npm i --save-dev @types/amqplib
```

## The concept of a Service in @enriqcg/nestjs-amqp

This library was built to solve for the use case of wanting to load balance messages published to a 'topic' across multiple replicas of a same service. The way we make that possible is using a **service** definition. We consider a service a collection of replicas that run copies of the same codebase.

Using a service defiition in @enriqcg/nestjs-amqp is totally optional if you don't need to balance messages across replicas.

This library leverages RabbitMQ's exchanges, routing keys and queue bindigs to achieve this goal. Start by defining a service when importing `AMQPModule` by providing a name and an exchange name.

```typescript
@Module({
  imports: [
    AMQPModule.forRoot({
      hostname: 'rabbitmq',
      assertQueuesByDefault: true,
      assertExchanges: [
        // we are making sure our exchange is ready
        // this is optional
        {
          name: 'example_exchange',
          type: 'topic',
        },
      ],
      service: {
        name: 'example_service',
        exchange: 'example_exchange',
      },
    }),
  ],
})
export class AppModule {}
```

The service name is used to register and identify replicas of a same service. You can run multiple services using this library on the same exchange (in fact, that is really powerful as one message can end up in multiple services).

Then we can set up our consumer:

```typescript
@Consumer()
@Controller()
export class AppController {
  @Consume('test.event')
  async testHandler(body: unknown) {
    console.log(this.appService.getHello())
    return true
  }
}
```

The resulting effect of defining the service and using the @Consume decorator in this setup will be the creation of a queue with name `test.event-example_service`. If other replicas of this same code were to be created, they would join as consumers of the same queue, thus balancing the load of `test.event` messages across multiple instances.

## Getting Started

Register the AMQPModule in `app.module.ts` and pass a configuration object:

```typescript
import { Module } from '@nestjs/common'
import { AMQPModule } from '@enriqcg/nestjs-amqp'

@Module({
  imports: [
    AMQPModule.forRoot({
      hostname: 'rabbitmq',
      username: 'guest',
      password: 'guest',
      assertQueuesByDefault: true,
      assertExchanges: [
        // these exchanges will be asserted on startup
        {
          name: 'example_exchange',
          type: 'topic',
        },
        {
          name: 'fanout_exchange',
          type: 'fanout',
        },
      ],
    }),
  ],
})
export class AppModule {}
```

### [AMQPModule options reference](#connection-options)

You can also check documentation on amqplib's [Exchange](https://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange) and [Queue](https://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) **assertion**.

## Publisher

You can now inject an AMQP Channel in your services and use it to push messages into an exchange or a queue.

```typescript
import { Injectable } from '@nestjs/common'
import { InjectAMQPChannel } from '@enriqcg/nestjs-amqp'
import { Channel } from 'amqplib'

@Injectable()
export class ExampleService {
  constructor(
    @InjectAMQPChannel()
    private readonly amqpChannel: Channel,
  ) {}

  async sendToExchange() {
    this.amqpChannel.publish(
      'exchange_name',
      'routing_key',
      Buffer.from(JSON.stringify({ test: true })),
    )
  }
}
```

Check amqplib's reference on [channel.publish()](https://www.squaremobius.net/amqp.node/channel_api.html#channel_publish).

## Consumer

[@enriqcg/nestjs-amqp](https://github.com/EnriqCG/nestjs-amqp) allows you to define consumer functions using decorators in your controllers.

```typescript
import { Consume } from '@enriqcg/nestjs-amqp'

@Consumer('user') // event prefix
@Controller()
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Consume('created') // handler for user.created
  handleCreatedEvent(content: string) {
    console.log(JSON.parse(content))
    return false // message will not be acked
    return true //message will be acked
    // no return? -> message will be acked
  }

  // handler for user.updated.address
  @Consume({
    queueName: 'updated.address',
    noAck: false,
    // queue will be deleted after all consumers are dropped
    assertQueue: true,
    autoDelete: true,
  })
  handleUpdatedAddressEvent(content: string) {
    const payload = JSON.parse(content)

    try {
      // pass data to your services
      this.exampleService.update(payload)
    } catch (e) {
      console.error(e)
      return false // message will not be acked
    }

    // message will be automatically acked
  }
}
```

The message content is **decoded** to a string and provided to decorated methods. Depending on what content you published, further deserialization might be needed. (Building decorators to help decode JSON payloads is on the TODO).

### Message Acknowledgment

If automatic acknowledgment is disabled for a queue (`noAck = true`), to ack a message, the decorated method should return **a non-false value**. Anything else than a **false** value will acknowledge a message (even void).

## Connection options

```typescript
interface AMQPModuleOptions {
  /**
   * The host URL for the connection
   *
   * Default value: 'localhost'
   */
  hostname?: string
  /**
   * The port of the AMQP host
   *
   * Default value: 5672
   */
  port?: number
  /**
   * The name of the connection. Only really relevant in multiple
   * connection contexts
   *
   * Default value: 'default'
   */
  name?: string
  /**
   * Service definition. Please see README.md to learn about how services
   * work in @enriqcg/nestjs-amqp
   *
   * Default value: {}
   */
  service?: {
    name: string
    exchange: string
  }
  /**
   * Makes sure that the exchanges are created and are of the same
   * type on application startup.
   *
   * Default value: []
   */
  assertExchanges?: [
    {
      /**
       * Name of the exchange to bind queues to
       *
       * A value is required
       */
      name: string
      /**
       * Name of the exchange to bind queues to
       *
       * A value is only required if the exchange is asserted
       */
      type?: 'direct' | 'topic' | 'headers' | 'fanout' | 'match'
    },
  ]
  /**
   * Assert queues by default using the @Consume decorator
   * Consumer options defined in @Consume decorator take priority
   *
   * Default value: 'default'
   */
  assertQueuesByDefault?: boolean
  /**
   * Username used for authenticating against the server
   *
   * Default value: 'guest'
   */
  username?: string
  /**
   * Password used for authenticating against the server
   *
   * Default value: 'guest'
   */
  password?: string
  /**
   * The period of the connection heartbeat in seconds
   *
   * Default value: 0
   */
  heartbeat?: number
  /**
   * What VHost shall be used
   *
   * Default value: '/'
   */
  vhost?: string
  /**
   * Wait for a full connection to the AMQP server before continuing
   * with the rest of the NestJS app initialization.
   *
   * This prevents HTTP requests and other entry-points from reaching
   * the server until there is a valid AMQP connection.
   *
   * Default value: false
   */
  wait?: boolean
}
```

## License

[MIT License](http://www.opensource.org/licenses/MIT)

Copyright (c) 2021-present, Enrique Carpintero
