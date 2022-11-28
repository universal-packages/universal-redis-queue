# Redis Queue

[![npm version](https://badge.fury.io/js/@universal-packages%2Fredis-queue.svg)](https://www.npmjs.com/package/@universal-packages/redis-queue)
[![Testing](https://github.com/universal-packages/universal-redis-queue/actions/workflows/testing.yml/badge.svg)](https://github.com/universal-packages/redis-queue/actions/workflows/testing.yml)
[![codecov](https://codecov.io/gh/universal-packages/universal-redis-queue/branch/main/graph/badge.svg?token=CXPJSN8IGL)](https://codecov.io/gh/universal-packages/universal-redis-queue)

Redis queue system for [redis](https://github.com/redis/node-redis).

## Install

```shell
npm install @universal-packages/redis-queue
npm install redis
```

# RedisQueue

An instance of `RedisQueue` allows you to start enqueuing items to be retrieved later from anywhere and at the right time.

```js
import { RedisQueue } from '@universal-packages/redis-queue'

const redisQueue = new RedisQueue({ identifier: 'my-app' })

await redisQueue.connect()

await redisQueue.enqueue({ job: 'update-users', which: 'all' }, 'normal')


/// Later

const item = await redisQueue.dequeue('normal)

console.log(item.payload)

// > { job: 'update-users', which: 'all' }

```

## Options

`RedisQueue` takes the same [options](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md) as the redis client.

Additionally takes the following ones:

- `client` `RedisClient`
  If you already have a client working in your app you can pass the instance here to not connect another client inside the `RedisQueue` instance.
- `identifier` `String`
  This will be prepended to all redis keys used internally to handle the queue, so one can debug easier.

## .connect()

If you are not passing your own client in options you will need to tell the `RedisQueue` to connect its internal client.

```js
await redisQueue.connect()
```

## .disconnect()

If you are not passing your own client in options you will need to tell the `RedisQueue` to disconnect its internal client when you no loger need it.

```js
await redisQueue.disconnect()
```

## .enqueue()

Enqueues a `payload` with the given `queue`. Return the metadata related to the enqueued tiem.

```js
await redisQueue.enqueue({ data: '❨╯°□°❩╯︵┻━┻' }, 'low')
await redisQueue.enqueue({ data: '❨╯°□°❩╯︵┻━┻' }, 'normal')
await redisQueue.enqueue({ data: '❨╯°□°❩╯︵┻━┻' }, 'high')
await redisQueue.enqueue({ data: '❨╯°□°❩╯︵┻━┻' }, 'whatever')

const item = await redisQueue.enqueue({ data: '❨╯°□°❩╯︵┻━┻' }, 'normal')

console.log(item)

// >  { dequeueAfter: 56462165
// >    enqueuedAt: 56462165
// >    id: 'complex-id'
// >    payload: { data: '❨╯°□°❩╯︵┻━┻' },
// >    queue: 'normal' }
```

### options

You can also pass options related to where an item should be available to dequeue. `At` takes priority over `wait`.

- **`at`** `Date`
  The item will not be available before this date.
- **`wait`** `String`
  expresed with human languaje like `2 hours` or `1 day` and the enqueue item will not be available before current time plus wait time.

```js
await redisQueue.enqueue({ data: '❨╯°□°❩╯︵┻━┻' }, 'normal', {})
```

## .dequeue()

Dequeues an item from the given queue if it is ready to be dequeued.

```js
await redisQueue.dequeue('low')
await redisQueue.dequeue('normal')
await redisQueue.dequeue('high')
await redisQueue.dequeue('whatever')

const item = await redisQueue.dequeue('normal')

console.log(item)

// >  { dequeueAfter: 56462165
// >    enqueuedAt: 56462165
// >    id: 'complex-id'
// >    payload: { data: '❨╯°□°❩╯︵┻━┻' },
// >    queue: 'normal' }
```

## Typescript

This library is developed in TypeScript and shipped fully typed.

## Contributing

The development of this library happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving this library.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### License

[MIT licensed](./LICENSE).
