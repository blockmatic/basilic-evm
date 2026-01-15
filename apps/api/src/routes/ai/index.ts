import { createOpenAI } from '@ai-sdk/openai'
import { getErrorMessage } from '@repo/utils/error'
import { logger } from '@repo/utils/logger'
import { generateText, streamText } from 'ai'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod/v4'
import { zodToJsonSchema } from 'zod-to-json-schema'
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

const toJsonSchema = (schema: unknown) =>
  zodToJsonSchema(schema as Parameters<typeof zodToJsonSchema>[0])

const ChatRequestJsonSchema = toJsonSchema(ChatRequestSchema)
const ChatResponseJsonSchema = toJsonSchema(ChatResponseSchema)
const ErrorJsonSchema = toJsonSchema(ErrorSchema)

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
})

const aiRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.post(
    '/chat',
    {
      schema: {
        operationId: 'chat',
        description: 'Chat with AI using OpenAI',
        summary: 'Generate AI chat response',
        tags: ['ai'],
        body: ChatRequestJsonSchema,
        response: {
          200: ChatResponseJsonSchema,
          400: ErrorJsonSchema,
          500: ErrorJsonSchema,
        },
      },
    },
    async (request, reply) => {
      const requestLogger = logger.child({ requestId: request.id })
      try {
        // Validate request body with Zod
        const validatedBody = ChatRequestSchema.parse(request.body)
        const { messages, model } = validatedBody

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
    '/chat/stream',
    {
      schema: {
        operationId: 'chatStream',
        description: 'Stream AI chat response using OpenAI',
        summary: 'Stream AI chat response',
        tags: ['ai'],
        body: ChatRequestJsonSchema,
        response: {
          200: {
            type: 'string',
            description: 'Streaming text response',
          },
          400: ErrorJsonSchema,
          500: ErrorJsonSchema,
        },
      },
    },
    async (request, reply) => {
      const requestLogger = logger.child({ requestId: request.id })
      try {
        // Validate request body with Zod
        const validatedBody = ChatRequestSchema.parse(request.body)
        const { messages, model } = validatedBody

        requestLogger.debug(
          { messages: messages.length, model },
          'Processing streaming chat request',
        )

        const result = streamText({
          model: openai(model) as unknown as Parameters<typeof streamText>[0]['model'],
          messages,
        })

        reply.header('Content-Type', 'text/event-stream')
        reply.header('Cache-Control', 'no-cache')
        reply.header('Connection', 'keep-alive')

        const stream: ReadableStream<string> = result.textStream
        let fullResponse = ''

        for await (const chunk of stream) {
          fullResponse += chunk
          reply.raw.write(chunk)
        }

        reply.raw.end()

        // Return the full response for testing purposes (fastify.inject captures this)
        return fullResponse
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
