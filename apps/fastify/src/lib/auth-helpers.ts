import type { FastifyRequest } from 'fastify'

export const requireAuth = (request: FastifyRequest) => {
  if (!request.session) {
    throw new Error('Unauthorized')
  }
  return request.session
}

export const getOptionalAuth = (request: FastifyRequest) => request.session

export const getUserId = (request: FastifyRequest): string => {
  const session = requireAuth(request)
  return session.user.id
}
