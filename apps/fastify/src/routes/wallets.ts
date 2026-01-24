import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsync } from 'fastify'

const WalletsResponseSchema = Type.Object({
  wallets: Type.Array(Type.Object({})),
})

const walletsRoute: FastifyPluginAsync = async fastify => {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/wallets',
    {
      schema: {
        operationId: 'getWallets',
        description: 'Get user wallets (protected route for testing)',
        summary: 'Get wallets',
        tags: ['wallets'],
        security: [{ bearerAuth: [] }],
        response: {
          200: WalletsResponseSchema,
          401: Type.Object({
            code: Type.String(),
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      if (!request.session) {
        return reply.code(401).send({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        })
      }

      return reply.code(200).send({
        wallets: [],
      })
    },
  )
}

export default walletsRoute
