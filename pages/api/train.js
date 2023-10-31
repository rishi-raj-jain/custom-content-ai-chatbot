import train from '@/lib/train'
import * as dotenv from 'dotenv'
import { redis } from '@/lib/redis'
import { runMiddleware } from '@/lib/cors'
import { verifySignature } from '@upstash/qstash/dist/nextjs'

dotenv.config()

export const config = {
  api: {
    bodyParser: false,
  },
}

async function handler(req, res) {
  try {
    // Run the middleware
    await runMiddleware(req, res)
    // If method is not POST, return with `Forbidden Access`
    if (req.method !== 'POST') return res.status(403).send('No other methods allowed.')
    // If `urls` is not in body, return with `Bad Request`
    if (!req.body.urls) return res.status(400).send('No urls to train on.')
    // Train on the particular URLs
    await train(req.body.urls)
    // Once saved, clear all the responses in Upstash
    let allKeys = await redis.keys('*')
    if (allKeys) {
      // Filter out the keys to not have the ratelimiter ones
      allKeys = allKeys.filter((i) => !i.includes('@upstash/ratelimit:'))
      const p = redis.pipeline()
      // Create a pipeline to clear out all the keys
      allKeys.forEach((i) => p.del(i))
      // Execute the pipeline commands in a transaction
      await p.exec()
      console.log('Cleaned cached responses in Upstash.')
    }
    return res.status(200).end()
  } catch (e) {
    console.log(e.message || e.toString())
  }
  return res.end()
}

export default verifySignature(handler)
