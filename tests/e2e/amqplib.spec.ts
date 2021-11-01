import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import axios from 'axios'

import { AppModule } from '../src/app.module'
import { JobsController } from '../src/jobs/jobs.controller'
import { JobsService } from '../src/jobs/jobs.service'

describe('RabbitMQ', () => {
  test('vhost / is up', () => {
    return axios
      .get('http://127.0.0.1:8082/api/vhosts', {
        headers: {
          Authorization: 'Basic Z3Vlc3Q6Z3Vlc3Q=',
        },
      })
      .then((data) => {
        expect(data.data[0].name).toBe('/')
      })
  })
})

describe('@enriqcg/nestjs-amqp', () => {
  let app: INestApplication

  let jobsService: JobsService
  let jobsController: JobsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()

    jobsService = app.get<JobsService>(JobsService)
    jobsController = app.get<JobsController>(JobsController)

    await app.init()
  })

  it('should publish and consume a message', async () => {
    //expect.assertions(2)
    expect(await jobsService.publishMessage('test-payload!!')).toBe(true)

    await new Promise((r) => setTimeout(r, 1000))

    expect(JobsController.IS_NOTIFIED).toBe('test-payload!!')
  })

  // fix onModuleDestroy on the lib before uncommenting this
  afterEach(async () => {
    await app.close()
  })
})
