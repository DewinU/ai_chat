import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set',
      )
    }
    redis = new Redis({ url, token })
  }
  return redis
}

export function streamKey(conversationId: string, messageId: string) {
  return `stream:conversation:${conversationId}:message:${messageId}`
}

export async function appendStreamChunks(key: string, chunks: string[]) {
  if (chunks.length === 0) return
  const r = getRedis()
  await r.rpush(key, ...chunks)
}

export async function readAllStreamChunks(key: string): Promise<string[]> {
  const list = await getRedis().lrange<string>(key, 0, -1)
  return list ?? []
}

export async function readStreamChunksFrom(
  key: string,
  startIndex: number,
): Promise<string[]> {
  const start = Math.max(0, startIndex)
  const list = await getRedis().lrange<string>(key, start, -1)
  return list ?? []
}

export async function deleteStreamKey(key: string) {
  await getRedis().del(key)
}
