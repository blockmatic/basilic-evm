# Skill: solana-dev

## Scope

- Solana dApp UI development (React/Next.js) with framework-kit
- Wallet connection and signing flows
- Transaction building, sending, and confirmation UX
- On-chain program development with Anchor 0.32.1
- Client SDK generation from IDLs
- Local testing with Anchor test framework
- Address validation and transaction patterns

Does NOT cover:
- EVM frontend development (see `web3-frontend` skill)
- General blockchain concepts (see `blockchain-basics` skill)

## Principles

- Use Solana Foundation framework-kit (`@solana/client` + `@solana/react-hooks`) for React/Next.js UI
- Use `@solana/kit` for client/RPC/transaction code
- Use Anchor 0.32.1 for program development (see `contracts/solana/Anchor.toml`)
- Validate addresses with `PublicKey` from `@solana/web3.js` (see `@.cursor/rules/web3/solana.mdc`)
- Use Wallet Standard for wallet discovery and connection
- Isolate `@solana/web3.js` to adapter boundaries when legacy dependencies require it
- Reference `@repo/contracts-solana` package for contract structure and deployment patterns

## Default stack decisions (opinionated)
1) **UI: framework-kit first**
- Use `@solana/client` + `@solana/react-hooks`.
- Prefer Wallet Standard discovery/connect via the framework-kit client.

2) **SDK: @solana/kit first**
- Prefer Kit types (`Address`, `Signer`, transaction message APIs, codecs).
- Prefer `@solana-program/*` instruction builders over hand-rolled instruction data.

3) **Legacy compatibility: web3.js only at boundaries**
- If you must integrate a library that expects web3.js objects (`PublicKey`, `Transaction`, `Connection`),
  use `@solana/web3-compat` as the boundary adapter.
- Do not let web3.js types leak across the entire app; contain them to adapter modules.

4) **Programs**
- Default: Anchor (fast iteration, IDL generation, mature tooling).
- Performance/footprint: Pinocchio when you need CU optimization, minimal binary size,
  zero dependencies, or fine-grained control over parsing/allocations.

5) **Testing**
- Default: LiteSVM or Mollusk for unit tests (fast feedback, runs in-process).
- Use Surfpool for integration tests against realistic cluster state (mainnet/devnet) locally.
- Use solana-test-validator only when you need specific RPC behaviors not emulated by LiteSVM.

## Patterns

### Address Validation Pattern

Always validate Solana addresses before use:

```tsx
import { PublicKey } from '@solana/web3.js'

function validateSolanaAddress(address: string): boolean {
  try {
    const publicKey = new PublicKey(address)
    return PublicKey.isOnCurve(publicKey)
  } catch {
    return false
  }
}
```

### Anchor Program Development

Use Anchor 0.32.1 for program development:

- Programs in `contracts/solana/programs/`
- Tests in `contracts/solana/tests/`
- Deployment scripts in `contracts/solana/scripts/`
- Configuration in `contracts/solana/Anchor.toml`

See `contracts/solana/README.md` for test token program example with PDA mint authority.

### Testing Pattern

Use Anchor test framework (includes local validator):

```bash
# Run tests with local validator
pnpm --filter @repo/contracts-solana test

# Run tests without starting validator (requires running separately)
pnpm --filter @repo/contracts-solana test:local
```

## Interactions

- Complements `web3-frontend` for EVM frontend work
- Uses `blockchain-basics` for general blockchain concepts
- References `@repo/contracts-solana` for contract structure
- References `@.cursor/rules/web3/solana.mdc` for address validation patterns
- References `@.cursor/rules/web3/multichain.mdc` for chain-aware validation

## Related Documentation

- `@.cursor/rules/web3/solana.mdc` - Solana address validation and transaction patterns
- `@.cursor/rules/web3/multichain.mdc` - Chain-aware address validation
- `apps/docs/content/docs/blockchain/solana-contracts.mdx` - Anchor setup and monorepo integration
- `contracts/solana/README.md` - Contract development, testing, and deployment examples
- `contracts/solana/Anchor.toml` - Anchor configuration (version 0.32.1)
