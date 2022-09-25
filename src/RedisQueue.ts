import ms from 'ms'
import { v4 as uuidV4 } from 'uuid'
import { QueueItem, RedisQueueOptions } from './RedisQueue.types'
import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis'
import EventEmitter from 'events'

export default class RedisQueue extends EventEmitter {
  public readonly options: RedisQueueOptions
  public readonly client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>

  private isClientMine = false
  private readonly DEFAULT_IDENTIFIER = 'priority-queue'

  public constructor(options?: RedisQueueOptions) {
    super()
    this.options = { ...options }
    this.isClientMine = !this.options.client
    this.client = this.isClientMine ? createClient(this.options) : this.options.client
  }

  public async connect(): Promise<void> {
    if (this.isClientMine) await this.client.connect()
  }

  public async disconnect(): Promise<void> {
    if (this.isClientMine) await this.client.disconnect()
  }

  public async clear(): Promise<void> {
    const keysPrefix = `${this.options.identifier || this.DEFAULT_IDENTIFIER}*`
    const keys = await this.client.keys(keysPrefix)
    if (keys.length) await this.client.del(keys)
  }

  /** Enqueue a new item and set it ready to be dequeued at the right moment by its timestamp */
  public async enqueue(payload: Record<string, any>, queue: string, options?: { at?: Date; wait?: string }): Promise<QueueItem> {
    const id = uuidV4()
    const currentTime = new Date().getTime()
    const dequeueTimestamp = options?.wait ? currentTime + ms(options.wait) : options?.at?.getTime() || currentTime
    const queueItem: QueueItem = { id, payload, queue, enqueuedAt: currentTime, dequeueAfter: dequeueTimestamp }
    const serializedQueueItem = JSON.stringify(queueItem)
    const redisMulti = this.client.multi()

    // Here we keep a sorted list of all dequeue timestamps of this category
    // so the more earlier the timestamp is the most at the beginning of the queue will be
    redisMulti.zAdd(this.getQueueKey(queue), { score: dequeueTimestamp, value: String(dequeueTimestamp) })

    // Here we keep all items ids for its dequeue timestamp, this is because several items could have
    // the same dequeue time and all of them should be dequeue ideally not later than that dequeue time
    redisMulti.rPush(this.getTimestampKey(queue, dequeueTimestamp), id)

    // We keep the item by its id so we can reference the data later
    redisMulti.set(this.getItemKey(queueItem.id), serializedQueueItem)

    await redisMulti.exec()

    return queueItem
  }

  /** Removes the next item available by its timestamp to be removed and returns the items data */
  public async dequeue(queue: string): Promise<QueueItem> {
    // We remove the timestamp we are working on, at the end if the timestamp does have other related
    // items to be dequeued we re-insert this score to be processed in another dequeue.
    const nextTimestamp = await this.client.zPopMin(this.getQueueKey(queue))

    if (nextTimestamp) {
      const currentTime = new Date().getTime()

      // We only process items that are ready to be popped
      if (nextTimestamp.score < currentTime) {
        // We pop the first id contained in the timestamp list
        const queueItemId = await this.client.lPop(this.getTimestampKey(queue, nextTimestamp.value))

        if (queueItemId) {
          // We get the serialized item using the id
          const serializedQueueItem = await this.client.get(this.getItemKey(queueItemId))

          await this.client.del(this.getItemKey(queueItemId))

          // We add the timestamp again if there are items left related to it
          const timestampListCount = await this.client.lLen(this.getTimestampKey(queue, nextTimestamp.value))
          if (timestampListCount > 0) this.client.zAdd(this.getQueueKey(queue), nextTimestamp)

          return JSON.parse(serializedQueueItem)
        }
      } else {
        // This score is in the future we insert it again to be dequeued later
        this.client.zAdd(this.getQueueKey(queue), nextTimestamp)
      }
    }
  }

  private getQueueKey(queue: string): string {
    return `${this.options.identifier || this.DEFAULT_IDENTIFIER}:queue:${queue}`
  }

  private getTimestampKey(queue: string, timestamp: string | number): string {
    return `${this.options.identifier || this.DEFAULT_IDENTIFIER}:timestamp:${queue}:${timestamp}`
  }

  private getItemKey(id: string): string {
    return `${this.options.identifier || this.DEFAULT_IDENTIFIER}:item:${id}`
  }
}
