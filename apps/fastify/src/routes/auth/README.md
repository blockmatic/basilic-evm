# Auth Routes

This directory contains authentication-related routes managed by Better Auth.

## Better Auth Endpoints

Better Auth provides a comprehensive set of authentication endpoints mounted at `/api/auth/*`. These are handled by the auth plugin in `src/plugins/auth.ts`.

### Session Management

- `GET /api/auth/get-session` - Get current session and user

### Email Authentication

- `POST /api/auth/sign-up/email` - Register new user with email/password
- `POST /api/auth/sign-in/email` - Sign in with email/password

### Magic Link

- `POST /api/auth/sign-in/magic-link` - Send magic link to email
- `GET /api/auth/magic-link/verify` - Verify magic link token

**JWT-only Authentication**: Magic link verification returns a JWT token for all clients.

- **JWT Format**: `GET /api/auth/magic-link/verify?token=xxx&format=jwt` - Returns JWT token in response body
- **No session cookies**: `format=jwt` never sets `better-auth.session_token` cookies
- **BFF storage**: Web clients should store JWTs in HttpOnly cookies via the Next.js BFF

Protected routes only accept:
- JWT tokens in `Authorization: Bearer <token>` header

### Web3 Authentication

- `GET /api/auth/sign-in/web3/:chain/nonce` - Get nonce for wallet signing
  - Supported chains: `eip155` (Ethereum), `solana`
- `POST /api/auth/sign-in/web3/:chain/verify` - Verify signature and create session

## Wallet Management Routes

Wallet management routes are in `src/routes/wallet.ts`:

- `GET /wallets` - List user's linked wallets (requires authentication)
- `DELETE /wallets/:chain/:address` - Unlink a wallet (requires authentication)

## Usage Examples

### Get Current Session

```typescript
const response = await fetch('/api/auth/get-session', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
const { user, session } = await response.json()
```

### Sign Up with Email

```typescript
const response = await fetch('/api/auth/sign-up/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123!',
    name: 'John Doe',
  }),
})
```

### Sign In with Magic Link

**JWT Token Flow**:
```typescript
// Step 1: Send magic link
const response = await fetch('/api/auth/sign-in/magic-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
  }),
})

// Step 2: Verify token with format=jwt (returns JWT token)
const verifyResponse = await fetch('/api/auth/magic-link/verify?token=xxx&format=jwt')
const { token } = await verifyResponse.json()

// Step 3: Access protected routes with JWT token
const protectedResponse = await fetch('/wallets', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
```

### Web3 Authentication Flow

1. Get nonce:
```typescript
const { nonce, domain } = await fetch('/api/auth/sign-in/web3/eip155/nonce', {
})
  .then(r => r.json())
```

2. Sign message with wallet (client-side)

3. Verify signature:
```typescript
const response = await fetch('/api/auth/sign-in/web3/eip155/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: signedMessage,
    signature: signature,
    address: walletAddress,
  }),
})
```

## Testing

See test files in `test/routes/`:
- `auth.spec.ts` - Basic auth integration tests
- `email-auth.spec.ts` - Email authentication tests
- `web3-auth.spec.ts` - Web3 authentication tests

### 404 on Auth Endpoints

Check that the auth plugin is registered in `src/app.ts` (handled automatically by AutoLoad).

### Schema Mapping Errors

Better Auth expects certain model names. Ensure schema mapping in `src/lib/auth.ts`:
- `user: schema.users`
- `session: schema.sessions`
