# Skill: web3-frontend

## Scope

- React/Next.js wallet integration with Wagmi v2 for EVM chains
- Contract interactions using viem v2 for address validation and transaction building
- Transaction state management and error handling
- Custom hooks wrapping wagmi for contract-specific interactions

Does NOT cover:
- Solana frontend development (see `solana-dev` skill)
- Backend RPC interactions (see `ethereum-development` skill)
- Smart contract development (see `solidity-development` skill)

## Principles

- Use Wagmi v2.x hooks for wallet state (`useAccount`, `useWriteContract`, `useReadContract`, `useWaitForTransactionReceipt`)
- Use viem v2 for address validation (`getAddress`) and transaction utilities (`parseEther`, `parseGwei`)
- Create custom hooks wrapping wagmi for contract-specific interactions (see `@.cursor/rules/web3/wagmi.mdc`)
- Handle connection states explicitly: disconnected, connecting, connected, reconnecting
- Validate addresses with `getAddress()` from viem before use (never cast directly as `Address`)
- Reference `@repo/core` for generated contract ABIs and types
- Use TanStack Query (via wagmi) for caching and refetching contract data

## Constraints

- MUST use Wagmi v2.x (not v1) - v1 patterns are incompatible
- MUST validate addresses with `getAddress()` from viem (see `@.cursor/rules/web3/viem.mdc`) - never cast strings directly
- SHOULD create custom hooks for contract interactions (see `@.cursor/rules/web3/wagmi.mdc` for pattern)
- SHOULD handle SSR properly in Next.js (use `dynamic` with `ssr: false` for wallet components)
- AVOID wrapping generated hooks from `@repo/core` unless necessary for abstraction
- AVOID exposing private keys or sensitive wallet data in components

## Interactions

- Complements `solana-dev` for Solana frontend work
- Uses `ethereum-development` for EVM internals understanding
- References `@repo/core` for generated contract ABIs/types from OpenAPI
- References `@.cursor/rules/web3/wagmi.mdc` for hook patterns
- References `@.cursor/rules/web3/viem.mdc` for address validation and transaction patterns
- References `@.cursor/rules/web3/multichain.mdc` for chain-aware validation

## Patterns

### Custom Contract Hook Pattern

Create specialized hooks for contract interactions:

```tsx
import { useAccount, useWriteContract } from 'wagmi'
import { getAddress } from 'viem'
import type { Address } from 'viem'

export function useContractMint({ contractAddress }: { contractAddress: Address }) {
  const { address: account } = useAccount()
  const { writeContract, ...rest } = useWriteContract()

  const mint = async (amount: bigint) => {
    if (!account) throw new Error('Wallet not connected')
    
    return writeContract({
      address: getAddress(contractAddress), // Always validate
      abi: ContractAbi,
      functionName: 'mint',
      args: [amount],
    })
  }

  return { mint, ...rest }
}
```

### Address Validation Pattern

Always validate addresses before use:

```tsx
import { getAddress, type Address } from 'viem'

function validateAndUseAddress(rawAddress: string): Address {
  try {
    return getAddress(rawAddress) // Validates checksum and format
  } catch (error) {
    throw new Error('Invalid Ethereum address')
  }
}
```

### Connection State Handling

Handle all wallet connection states:

```tsx
import { useAccount } from 'wagmi'

function WalletStatus() {
  const { address, isConnected, isConnecting, isDisconnected, isReconnecting } = useAccount()

  if (isDisconnected) return <ConnectButton />
  if (isConnecting || isReconnecting) return <div>Connecting...</div>
  if (isConnected && address) return <div>Connected: {address}</div>
  
  return null
}
```

## Trade-offs

- **Custom hooks vs direct wagmi hooks**: Custom hooks provide abstraction and type safety but add indirection. Use custom hooks for contract-specific logic, direct hooks for simple wallet state.
- **Address validation**: Always validate with `getAddress()` even if address comes from wagmi - provides runtime safety and checksum correction.
- **SSR handling**: Client-side only rendering (`ssr: false`) prevents hydration errors but may cause layout shift. Consider skeleton loading states.

## Related Documentation

- `@.cursor/rules/web3/wagmi.mdc` - Wagmi v2 hook patterns and custom hook examples
- `@.cursor/rules/web3/viem.mdc` - Viem v2 address validation and transaction patterns
- `@.cursor/rules/web3/multichain.mdc` - Chain-aware address validation
- `apps/docs/content/docs/blockchain/evm-contracts.mdx` - EVM contract development setup
