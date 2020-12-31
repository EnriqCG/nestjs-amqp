# NestJS-AMQP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/EnriqCG/nestjs-amqplib/LICENSE.md)

AMQP module for NestJS with decorator support

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
    AMQPModule.forRoot(options),
  ],
})
export class AppModule {}
```

[AMQPModule options reference](https://github.com/EnriqCG/nestjs-amqp#connection-options)

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

  @Consume('queue_name')
  handleEvent(content: string) {
    console.log(JSON.parse(content))
    return false // message will not be acked
    return true //message will be acked
    // no return? message will be acked
  }
}
```

The message content is **decoded** to a string and provided to decorated methods. Depending on what content you published, further deserialization might be needed.

### Message Acknowledgment

If automatic acknoledgment is disabled for a queue, to ack a message the decorated method should return **a non false value**. Anything else than a **false** value will acknowledge a message (even void).

## Connection options

Name | Explanation | Default
--- | --- | ---
hostname | The host URL for the connection | `localhost`
port | The port of the AMQP host | `5672`
name | The name of the connection | `default` or the array key index `[0]`
protocol | The protocol for the connection | `amqp`
username | The username for the connection | 
password | The password for the connection |
locale | The desired locale for error messages | `en_US`
frameMax | The size in bytes of the maximum frame allowed over the connection | 0
heartbeat | The period of the connection heartbeat in seconds | 0
vhost | What VHost shall be used | `/`
