import { createClient } from 'redis'

export const connectRedis = async () => {
  const client = createClient({ url: process.env.REDIS_URL })
  await client.connect()
  return client
}