import { Type } from '@sinclair/typebox'
import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../db/index.js'
import { walletIdentities } from '../db/schema/index.js'
import { requireAuth } from '../lib/auth-helpers.js'

const walletRoutes: FastifyPluginAsync = async fastify => {
  // List user's wallets
  fastify.get(
    '/wallets',
    {
      schema: {
        operationId: 'listWallets',
        description: 'List wallets linked to the current user',
        summary: 'List wallet identities',
        tags: ['wallet'],
        security: [{ bearerAuth: [] }],
        response: {
          200: Type.Object({
            wallets: Type.Array(
              Type.Object({
                id: Type.String(),
                userId: Type.String(),
                chain: Type.Union([Type.Literal('eip155'), Type.Literal('solana')]),
                address: Type.String(),
                walletProvider: Type.Optional(Type.String()),
                createdAt: Type.String({ format: 'date-time' }),
                lastUsedAt: Type.Optional(Type.String({ format: 'date-time' })),
              }),
            ),
          }),
        },
      },
    },
    async request => {
      const { user } = requireAuth(request)
      const db = await getDb()

      const wallets = await db
        .select()
        .from(walletIdentities)
        .where(eq(walletIdentities.userId, user.id))

      return { wallets }
    },
  )

  // Unlink wallet
  fastify.delete(
    '/wallets/:chain/:address',
    {
      schema: {
        operationId: 'deleteWallet',
        description: 'Unlink a wallet from the current user',
        summary: 'Delete wallet identity',
        tags: ['wallet'],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          chain: Type.Union([Type.Literal('eip155'), Type.Literal('solana')]),
          address: Type.String(),
        }),
        response: {
          200: Type.Object({
            success: Type.Literal(true),
          }),
          404: Type.Object({
            code: Type.String(),
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { user } = requireAuth(request)
      const params = request.params as { chain: 'eip155' | 'solana'; address: string }
      const { chain, address } = params
      const db = await getDb()

      const deleted = await db
        .delete(walletIdentities)
        .where(
          and(
            eq(walletIdentities.userId, user.id),
            eq(walletIdentities.chain, chain),
            eq(walletIdentities.address, address),
          ),
        )
        .returning()

      if (deleted.length === 0) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'Wallet not found or already unlinked',
        })
      }

      return { success: true }
    },
  )
}

export default walletRoutes
