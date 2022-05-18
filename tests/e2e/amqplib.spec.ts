import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import axios from 'axios'

import { AppModule } from '../src/app.module'
import { JobsController } from '../src/jobs/jobs.controller'
import { JobsService } from '../src/jobs/jobs.service'

const RMQ_MGMT_API = 'http://127.0.0.1:8082/api'
const getRMQRequestConfig = () => {
  return {
    headers: {
      Authorization: 'Basic Z3Vlc3Q6Z3Vlc3Q=',
    },
  }
}

describe('RabbitMQ', () => {
  test('vhost / is up', () => {
    axios.get(`${RMQ_MGMT_API}/vhosts`, getRMQRequestConfig()).then((data) => {
      expect(data.data[0].name).toBe('/')
    })
  })
})

describe('@enriqcg/nestjs-amqp', () => {
  let app: INestApplication

  let jobsService: JobsService
  let jobsController: JobsController

  beforeAll(async () => {
    // TODO: test importing AMQPModule directly with importing the 'test' controller
    // figure out imports if needed
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()

    jobsService = app.get<JobsService>(JobsService)
    jobsController = app.get<JobsController>(JobsController)

    await app.init()
  })

  it('should have asserted an exchange', async () => {
    await new Promise((r) => setTimeout(r, 1000))

    axios.get(`${RMQ_MGMT_API}/exchanges/%2f`, getRMQRequestConfig()).then((data) => {
      const assertedExchange = data.data.find((exchange) => exchange.name === 'test_exchange')
      expect(assertedExchange.type).toBe('topic')
      expect(assertedExchange.vhost).toBe('/')
      expect(assertedExchange.durable).toBe(true)
    })
  })

  it('should publish and consume a message from a single service queue', async () => {
    //expect.assertions(2)
    expect(
      await jobsService.publishMessage('test_exchange', 'notify_queue', 'test-payload!!'),
    ).toBe(true)

    await new Promise((r) => setTimeout(r, 1000))

    expect(JobsController.IS_NOTIFIED).toBe('test-payload!!')
  })

  it('should publish and consume a message from a single service queue with an alternative syntax', async () => {
    //expect.assertions(2)
    expect(
      await jobsService.publishMessage('test_exchange', 'notify_queue_alt_syntax', 'payload_no_2_hehe'),
    ).toBe(true)

    await new Promise((r) => setTimeout(r, 1000))

    expect(JobsController.IS_NOTIFIED).toBe('payload_no_2_hehe')
  })

  it('should publish and consume a message from a fanout exchange', async () => {
    //expect.assertions(2)
    expect(
      await jobsService.publishMessage('test2_exchange', '', 'fanout worked!!'),
    ).toBe(true)

    await new Promise((r) => setTimeout(r, 1000))

    expect(JobsController.IS_NOTIFIED).toBe('fanout worked!!')
  })

  it('should publish and consume a message from a fanout exchange', async () => {
    //expect.assertions(2)
    expect(
      await jobsService.publishMessage('test2_exchange', '', 'fanout worked!!'),
    ).toBe(true)

    await new Promise((r) => setTimeout(r, 1000))

    expect(JobsController.IS_NOTIFIED).toBe('fanout worked!!')
  })

  it('should fail at publishing a message to an exchange that does not exist', async () => {
    expect.assertions(1)
    await expect(
      jobsService.publishMessage(
        'unexistent_exchange',
        'ssssssss',
        'testing non existent exchange',
      ),
    ).rejects.toThrow(Error)
  })

  // TODO: test configuration works correctly

  // TODO: test exchange is asserted

  // TODO: test queues are asserted

  // TODO: test queues are not asserted

  // TODO: ^ test before and after

  // TODO: test heartbeat value is correct

  // TODO: test ack works? probably with another queue
  // TODO: Test that returning false does not ack the message (with another queue)

  // TODO: Test reconnection? I don't know how to do that yet

  // TODO: Test direct queue?

  // TODO: Test multiple exchange types?

  afterAll(async () => {
    app.close()
  })
})
