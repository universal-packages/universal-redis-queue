import { RedisClientOptions, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis'

export interface RedisQueueOptions extends RedisClientOptions {
  client?: RedisClientType<RedisModules, RedisFunctions, RedisScripts>
  identifier?: string
}

export interface QueueItem {
  id: string
  queue: string
  payload: Record<string, any>
  enqueuedAt: number
  dequeueAfter: number
}
