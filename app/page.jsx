'use client'

import { useState } from 'react'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { MemoizedReactMarkdown } from '@/components/mark'

export default function InputWithButton() {
  const [response, setResponse] = useState()
  const [messages, setMessages] = useState([])
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-start w-full max-w-lg px-5">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setResponse()
            const mes = document.getElementById('message').value
            if (mes) {
              setMessages((messages) => [...messages, { type: 'user', message: mes }])
              const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: mes }),
              })
              if (!response.ok) {
                throw new Error('Error fetching data')
              }
              let chunks = ''
              const reader = response.body.getReader()
              const decoder = new TextDecoder()
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                setResponse((prevChunk) => {
                  if (prevChunk) return prevChunk + decoder.decode(value)
                  return decoder.decode(value)
                })
                chunks += decoder.decode(value)
              }
              setResponse()
              setMessages((messages) => [...messages, { type: 'ai', message: chunks }])
            }
          }}
          className="flex flex-row min-w-[500px] items-center space-x-2 fixed bottom-4"
        >
          <Input id="message" type="message" placeholder="What's your next question?" />
          <Button type="submit">Submit</Button>
        </form>
        {messages &&
          messages.map((i, _) => (
            <MemoizedReactMarkdown
              key={_}
              className={`w-full mt-4 pt-4 prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 ${_ !== 0 && 'border-t'}`}
              remarkPlugins={[remarkGfm, remarkMath]}
              components={{
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
                },
                code({ node, inline, className, children, ...props }) {
                  if (children.length) {
                    if (children[0] == '▍') {
                      return <span className="mt-1 cursor-default animate-pulse">▍</span>
                    }
                    children[0] = children[0].replace('`▍`', '▍')
                  }
                  const match = /language-(\w+)/.exec(className || '')
                  if (inline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                  return <CodeBlock key={Math.random()} language={(match && match[1]) || ''} value={String(children).replace(/\n$/, '')} {...props} />
                },
              }}
            >
              {i.message}
            </MemoizedReactMarkdown>
          ))}
        {response && (
          <MemoizedReactMarkdown
            className={`w-full mt-4 pt-4 prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 border-t`}
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>
              },
              code({ node, inline, className, children, ...props }) {
                if (children.length) {
                  if (children[0] == '▍') {
                    return <span className="mt-1 cursor-default animate-pulse">▍</span>
                  }
                  children[0] = children[0].replace('`▍`', '▍')
                }
                const match = /language-(\w+)/.exec(className || '')
                if (inline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
                return <CodeBlock key={Math.random()} language={(match && match[1]) || ''} value={String(children).replace(/\n$/, '')} {...props} />
              },
            }}
          >
            {response}
          </MemoizedReactMarkdown>
        )}
      </div>
    </div>
  )
}
