import * as dotenv from 'dotenv'
import { Redis } from '@upstash/redis'
import { Client } from '@upstash/qstash'
import { Ratelimit } from '@upstash/ratelimit'

// Load environment variables
dotenv.config()

// Initialize Upstash Redis
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Initialize Upstash Rate Limiter
export const ratelimit = {
  chat: new Ratelimit({
    redis,
    // Limit requests to 30 questions per day per IP Address
    limiter: Ratelimit.slidingWindow(30, '86400s'),
  }),
}

// Initialize Upstash QStash (Client)
export const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN,
})
