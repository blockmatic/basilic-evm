import { createOpenAI } from '@ai-sdk/openai'
import { getErrorMessage } from '@repo/utils/error'
import { logger } from '@repo/utils/logger'
import { generateText, streamText } from 'ai'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod/v4'
import { env } from '../../lib/env.js'

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
})

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  model: z.string().optional().default('gpt-4o-mini'),
})

const ChatResponseSchema = z.object({
  text: z.string(),
})

const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
})

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
})

const aiRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.post(
    '/ai/chat',
    {
      schema: {
        operationId: 'chat',
        description: 'Chat with AI using OpenAI',
        summary: 'Generate AI chat response',
        tags: ['ai'],
        body: ChatRequestSchema,
        response: {
          200: ChatResponseSchema,
          400: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const requestLogger = logger.child({ requestId: request.id })
      try {
        const { messages, model } = request.body as z.infer<typeof ChatRequestSchema>

        requestLogger.debug({ messages: messages.length, model }, 'Processing chat request')

        const result = await generateText({
          model: openai(model) as unknown as Parameters<typeof generateText>[0]['model'],
          messages,
          providerOptions: {
            openai: {
              apiKey: env.OPENAI_API_KEY,
            },
          },
        })

        return reply.code(200).send({
          text: result.text,
        })
      } catch (error) {
        const errorMessage = getErrorMessage(error)
        requestLogger.error({ error, context: { requestId: request.id } }, 'Chat request failed')

        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            code: 'VALIDATION_ERROR',
            message: errorMessage ?? 'Invalid request',
          })
        }

        return reply.code(500).send({
          code: 'INTERNAL_ERROR',
          message: errorMessage ?? 'An error occurred processing your request',
        })
      }
    },
  )

  fastify.post(
    '/ai/chat/stream',
    {
      schema: {
        operationId: 'chatStream',
        description: 'Stream AI chat response using OpenAI',
        summary: 'Stream AI chat response',
        tags: ['ai'],
        body: ChatRequestSchema,
        response: {
          200: {
            type: 'string',
            description: 'Streaming text response',
          },
          400: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const requestLogger = logger.child({ requestId: request.id })
      try {
        const { messages, model } = request.body as z.infer<typeof ChatRequestSchema>

        requestLogger.debug(
          { messages: messages.length, model },
          'Processing streaming chat request',
        )

        const result = streamText({
          model: openai(model) as unknown as Parameters<typeof streamText>[0]['model'],
          messages,
        })

        const stream = result.toTextStreamResponse()

        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        })

        const reader = stream.body?.getReader()
        if (!reader) {
          throw new Error('Failed to get stream reader')
        }

        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          reply.raw.write(chunk)
        }

        reply.raw.end()
      } catch (error) {
        const errorMessage = getErrorMessage(error)
        requestLogger.error(
          { error, context: { requestId: request.id } },
          'Streaming chat request failed',
        )

        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            code: 'VALIDATION_ERROR',
            message: errorMessage ?? 'Invalid request',
          })
        }

        return reply.code(500).send({
          code: 'INTERNAL_ERROR',
          message: errorMessage ?? 'An error occurred processing your request',
        })
      }
    },
  )
}

export default aiRoutes
