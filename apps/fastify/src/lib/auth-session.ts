import { eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { sessions, users } from '../db/schema/index.js'

type AuthSession = {
  user: {
    id: string
    email: string | null
  }
  session: {
    id: string
    userId: string
    expiresAt: Date
  }
}

type GetSessionFromTokenInput = {
  token: string
}

export const getSessionFromToken = async ({ token }: GetSessionFromTokenInput) => {
  const db = await getDb()

  const [session] = await db.select().from(sessions).where(eq(sessions.token, token))
  if (!session) {
    return { session: null }
  }

  if (session.expiresAt < new Date()) {
    return { session: null }
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId))
  if (!user) {
    return { session: null }
  }

  const authSession: AuthSession = {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    session: {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
    },
  }

  return { session: authSession }
}
