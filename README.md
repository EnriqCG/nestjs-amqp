# NestJS-AMQP

<p align="center">

  <a href="https://github.com/EnriqCG/nestjs-amqplib/LICENSE.md">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg">
  </a>
  <a href="https://www.npmjs.com/package/@enriqcg/nestjs-amqp">
    <img alt="NPM Pulls" src="https://img.shields.io/npm/dm/@enriqcg/nestjs-amqp?label=NPM%20Pulls">
  </a>
  <a href="https://github.com/EnriqCG/nestjs-amqp/releases">
    <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/enriqcg/nestjs-amqp">
  </a>

  <a href="https://github.com/EnriqCG/nestjs-amqp/tags">
    <img alt="GitHub tag (latest by date)" src="https://img.shields.io/github/v/tag/enriqcg/nestjs-amqp">
  </a>
</p>

AMQP module for NestJS with decorator support.

## Note

This project is still a work-in-progress and is being **actively developed**. Issues and PRs are welcome!

**Please check the [v1.0 milestone]((https://github.com/EnriqCG/nestjs-amqp/milestone/1))** for features targeted for the first stable release.

***

This module injects a channel from [amqplib](https://github.com/squaremo/amqp.node). Please check the [Channel](https://www.squaremobius.net/amqp.node/channel_api.html) documentation for extra insight on how to publish messages.

## Installation

```bash
npm install @enriqcg/nestjs-amqp amqplib --save
```

### Getting Started

Register the AMQPModule in `app.module.ts`

```typescript
import { Module } from '@nestjs/common'
import { AMQPModule } from '@enriqcg/nestjs-amqp'

@Module({
  imports: [
    AMQPModule.forRoot({
      hostname: 'localhost',
      // queues we use with @Consume will be created if-need-be
      assertQueues: true,
      exchange: {
        name: 'my_exchange',
        // exchange will not be asserted (if-need-be)
        assert: false
      }
    }),
  ],
})
export class AppModule {}
```

### [AMQPModule options reference](#connection-options)
Also check documentation [here]() on amqplib's Exchange and Queue **assertion**.

## Publisher

You can now inject the AMQPService in your services and use it to push messages into an exchange.

```typescript
import { Injectable } from '@nestjs/common'
import { AMQPService } from '@enriqcg/nestjs-amqp'

@Injectable()
export class ExampleService {
  constructor(
    private readonly amqpService: AMQPService,
  ) {}

  async sendEvent() {
    const amqp = this.amqpService.getChannel()

    amqp.publish('exchange_name', 'queue_name', Buffer.from(JSON.stringify({ test: true })))
  }
}
```

Check amqplib's reference on [channel.publish()](https://www.squaremobius.net/amqp.node/channel_api.html#channel_publish).

## Consumer

[@enriqcg/nestjs-amqp](https://github.com/EnriqCG/nestjs-amqp) allows you to define consumer functions using decorators in your controllers.

```typescript
import { Consume } from '@enriqcg/nestjs-amqp'

export class ExampleController {

  @Consume('queue_name', {
    noAck: false, // manual consumer acknowledgments
  })
  handleEvent(content: string) {
    console.log(JSON.parse(content))
    return false // message will not be acked
    return true //message will be acked
    // no return? -> message will be acked
  }
}
```

The message content is **decoded** to a string and provided to decorated methods. Depending on what content you published, further deserialization might be needed.

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
}
```

## License

[MIT License](http://www.opensource.org/licenses/MIT)

Copyright (c) 2021-present, Enrique Carpintero
