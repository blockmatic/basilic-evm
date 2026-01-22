import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../db/index.js'
import { walletIdentities } from '../db/schema/index.js'
import { requireAuth } from '../lib/auth-helpers.js'

const walletRoutes: FastifyPluginAsync = async fastify => {
  // List user's wallets
  fastify.get('/wallets', async request => {
    const { user } = requireAuth(request)
    const db = await getDb()

    const wallets = await db
      .select()
      .from(walletIdentities)
      .where(eq(walletIdentities.userId, user.id))

    return { wallets }
  })

  // Unlink wallet
  fastify.delete('/wallets/:chain/:address', async request => {
    const { user } = requireAuth(request)
    const { chain, address } = request.params as { chain: 'eip155' | 'solana'; address: string }
    const db = await getDb()

    await db
      .delete(walletIdentities)
      .where(
        and(
          eq(walletIdentities.userId, user.id),
          eq(walletIdentities.chain, chain),
          eq(walletIdentities.address, address),
        ),
      )

    return { success: true }
  })
}

export default walletRoutes
