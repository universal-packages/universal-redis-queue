import { RedisQueue } from '../src'

const redisQueue = new RedisQueue({ identifier: 'testing' })

beforeAll(async (): Promise<void> => {
  await redisQueue.connect()
  await redisQueue.clear()
})

afterAll(async (): Promise<void> => {
  await redisQueue.disconnect()
})

describe('RedisQueue', (): void => {
  it('enqueues a popable item and retrieve them by priority', async (): Promise<void> => {
    const enqueuedItem1 = await redisQueue.enqueue({ test: 1 }, 'normal')
    const enqueuedItem2 = await redisQueue.enqueue({ test: 2 }, 'high')
    const enqueuedItem3 = await redisQueue.enqueue({ test: 3 }, 'low')
    const enqueuedItem4 = await redisQueue.enqueue({ test: 4 }, 'emails')

    expect(await redisQueue.dequeue('normal')).toEqual(enqueuedItem1)
    expect(await redisQueue.dequeue('normal')).toBeUndefined()

    expect(await redisQueue.dequeue('high')).toEqual(enqueuedItem2)
    expect(await redisQueue.dequeue('high')).toBeUndefined()

    expect(await redisQueue.dequeue('low')).toEqual(enqueuedItem3)
    expect(await redisQueue.dequeue('low')).toBeUndefined()

    expect(await redisQueue.dequeue('emails')).toEqual(enqueuedItem4)
    expect(await redisQueue.dequeue('emails')).toBeUndefined()
  })

  it('enqueues a popable that can be retrieved after time', async (): Promise<void> => {
    const enqueuedItem = await redisQueue.enqueue({ test: true }, 'normal', { wait: '1 seconds' })
    let item = await redisQueue.dequeue('normal')

    expect(item).toBeUndefined()

    await new Promise((resolve) => setTimeout(resolve, 2000))

    item = await redisQueue.dequeue('normal')
    expect(item).toEqual(enqueuedItem)
  })

  it('enqueues a popable that can be retrieved at time', async (): Promise<void> => {
    const enqueuedItem = await redisQueue.enqueue({ test: true }, 'normal', { at: new Date(Date.now() + 1000) })
    let item = await redisQueue.dequeue('normal')

    expect(item).toBeUndefined()

    await new Promise((resolve) => setTimeout(resolve, 2000))

    item = await redisQueue.dequeue('normal')
    expect(item).toEqual(enqueuedItem)
  })
})
