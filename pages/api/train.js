import { buffer } from 'micro'
import train from '@/lib/train'
import * as dotenv from 'dotenv'
import { runMiddleware } from '@/lib/cors'
import { qtashReceiver, redis } from '@/lib/redis'

dotenv.config()

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function (req, res) {
  try {
    // Run the middleware
    await runMiddleware(req, res)
    // If method is not POST, return with `Forbidden Access`
    if (req.method !== 'POST') return res.status(403).send('No other methods allowed.')
    // If the headers contain an `admin-key` header
    if (req.headers['admin-key'] === process.env.ADMIN_KEY) {
      const rawBody = (await buffer(req)).toString()
      const isValid = await qtashReceiver.verify({ signature: req.headers['Upstash-Signature'], body: rawBody })
      if (!isValid) return res.status(403).end()
      const parsedBody = JSON.parse(rawBody)
      await train(parsedBody.urls)
      // If `urls` is not in body, return with `Bad Request`
      if (!parsedBody.urls) return res.status(400).send('No urls to train on.')
      // Once saved, clear all the responses in Upstash
      let allKeys = await redis.keys('*')
      if (allKeys) {
        allKeys = allKeys.filter((i) => !i.includes('@upstash/ratelimit:'))
        const p = redis.pipeline()
        allKeys.forEach((i) => {
          p.del(i)
        })
        await p.exec()
        console.log('Cleaned cached responses in Upstash.')
      }
      return res.status(200).end()
    }
  } catch (e) {
    console.log(e.message || e.toString())
  }
  return res.end()
}
