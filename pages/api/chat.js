import { z } from 'zod'
import * as dotenv from 'dotenv'
import requestIp from 'request-ip'
import { runMiddleware } from '@/lib/cors'
import { PromptTemplate } from 'langchain/prompts'
import { RetrievalQAChain } from 'langchain/chains'
import { loadVectorStore } from '@/lib/vectorStore'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { qstashClient, ratelimit, redis } from '@/lib/redis'
import { UpstashRedisCache } from 'langchain/cache/upstash_redis'
import { OutputFixingParser, StructuredOutputParser } from 'langchain/output_parsers'

// Load environment variables
dotenv.config()

export default async function (req, res) {
  try {
    // Run the middleware
    await runMiddleware(req, res)
    // If method is not POST, return with `Forbidden Access`
    if (req.method !== 'POST') return res.status(403).send('No other methods allowed.')
    // If the headers contain an `admin-key` header
    if (req.headers['admin-key'] === process.env.ADMIN_KEY) {
      // If `urls` is not in body, return with `Bad Request`
      if (!req.body.urls) return res.status(400).send('No urls to train on.')
      // Hit QStash API to train on this set of URLs after 10 seconds from now
      await qstashClient.publishJSON({ delay: 10, body: { urls: req.body.urls }, url: 'https://custom-content-ai-chatbot.fly.dev/api/train' })
      return res.status(200).end()
    }
    // If `input` is not in body, return with `Bad Request`
    if (!req.body.input) return res.status(400).send('No input detected.')
    // Get the client IP
    const detectedIp = requestIp.getClientIp(req)
    // If no IP detected, return with a `Bad Request`
    if (!detectedIp) return res.status(400).send('Bad request.')
    // Check the Rate Limit
    const result = await ratelimit.chat.limit(detectedIp)
    // If rate limited, return with the same
    if (!result.success) return res.status(400).send('Rate limit exceeded.')
    // Load the trained model
    const vectorStore = await loadVectorStore()
    // Create a prompt specifying for Open AI what to write
    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        answer: z.string().describe('answer to question in HTML friendly format, use all of the tags wherever possible and including reference links'),
      }),
    )
    // Create Upstash caching
    const upstashRedisCache = new UpstashRedisCache({ client: redis })
    let doesToken = false
    const model = new ChatOpenAI({
      streaming: true,
      // Cache responses using Upstash Redis cache client
      cache: upstashRedisCache,
      callbacks: [
        {
          handleLLMNewToken(token) {
            doesToken = true
            res.write(token)
          },
        },
      ],
    })
    const outputFixingParser = OutputFixingParser.fromLLM(model, outputParser)
    // Create a prompt specifying for Open AI how to process on the input
    const prompt = new PromptTemplate({
      template: `Answer the user's question as best and be as detailed as possible:\n{format_instructions}\n{query}`,
      inputVariables: ['query'],
      partialVariables: {
        format_instructions: outputFixingParser.getFormatInstructions(),
      },
    })
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), prompt)
    const chainOutput = await chain.call({ query: req.body.input })
    // If no tokens received implies that the content is cached
    if (!doesToken) return res.status(200).send(chainOutput.text)
  } catch (e) {
    console.log(e.message || e.toString())
  }
  return res.end()
}
