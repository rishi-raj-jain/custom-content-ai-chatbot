import * as dotenv from 'dotenv'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { Client, Receiver } from '@upstash/qstash'

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

// Initialize Upstash QStash (Receiver)
export const qtashReceiver = new Receiver({
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
})
