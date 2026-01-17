# Web3 Skills Update Plan

## Overview

This plan outlines the updates needed to align web3 skills in `.cursor/skills/` with:
1. **Skills Guidelines** (`@.cursor/rules/base/skills.mdc`)
2. **Actual Contracts Code** (`contracts/evm/` and `contracts/solana/`)
3. **Documentation** (`apps/docs/content/docs/blockchain/`)
4. **Cursor Rules** (`@.cursor/rules/web3/`)

## Current State Analysis

### Skills Requiring Updates

1. **web3-frontend** - Needs major refactor
2. **solana-dev** - Needs alignment with contracts/docs
3. **solidity-development** - Needs alignment with Foundry setup
4. **ethereum-development** - Needs alignment with viem/wagmi patterns
5. **smart-contract-security** - Needs alignment with Foundry testing
6. **blockchain-basics** - Needs simplification
7. **defi-protocols** - Needs simplification
8. **nft-development** - Needs simplification

### Common Issues Found

1. ❌ **Python invocation code** - Not needed for Cursor skills
2. ❌ **Bonded agent metadata** - Not standard (sasmp_version, bonded_agent, bond_type)
3. ❌ **Excessive examples** - Should be patterns, not tutorials
4. ❌ **Instructional tone** - Should be declarative ("Use X" not "First analyze...")
5. ❌ **Missing version context** - Need explicit versions (Foundry, Anchor, wagmi v2, viem v2)
6. ❌ **Not aligned with actual code** - References generic patterns instead of our setup
7. ❌ **Missing monorepo context** - No references to `@repo/contracts-evm` or `@repo/contracts-solana`
8. ❌ **Missing rule references** - Should reference `@.cursor/rules/web3/` patterns

## Alignment Targets

### Contracts Code Reality

**EVM Contracts (`contracts/evm/`):**
- Foundry with Solidity 0.8.24
- OpenZeppelin Contracts (via remappings)
- Optimizer: 200 runs
- Test tokens deployed on Arbitrum Sepolia (421614)
- Package: `@repo/contracts-evm`
- Scripts: `pnpm --filter @repo/contracts-evm <command>`

**Solana Contracts (`contracts/solana/`):**
- Anchor 0.32.1
- Rust 1.75.0
- Test token program with PDA mint authority
- Package: `@repo/contracts-solana`
- Scripts: `pnpm --filter @repo/contracts-solana <command>`

### Documentation Structure

- `apps/docs/content/docs/blockchain/evm-contracts.mdx` - Foundry setup guide
- `apps/docs/content/docs/blockchain/solana-contracts.mdx` - Anchor setup guide
- Both reference contract READMEs for detailed usage

### Cursor Rules

- `@.cursor/rules/web3/wagmi.mdc` - Wagmi v2 patterns, custom hooks
- `@.cursor/rules/web3/viem.mdc` - Viem v2 address validation, transactions
- `@.cursor/rules/web3/solana.mdc` - PublicKey validation, Anchor setup
- `@.cursor/rules/web3/multichain.mdc` - Chain-aware validation patterns

## Update Plan by Skill

### 1. web3-frontend

**Current Issues:**
- Python invocation code (lines 44-47)
- Bonded agent metadata (lines 4-8, 247-248)
- Excessive examples (80+ lines of code examples)
- Missing wagmi v2 context
- No reference to `@.cursor/rules/web3/wagmi.mdc`

**Updates Needed:**
- ✅ Remove Python invocation code
- ✅ Remove bonded agent metadata
- ✅ Convert to declarative patterns
- ✅ Reference wagmi v2 explicitly
- ✅ Reference `@.cursor/rules/web3/wagmi.mdc` and `@.cursor/rules/web3/viem.mdc`
- ✅ Add monorepo context (packages, scripts)
- ✅ Simplify to Scope/Principles/Constraints/Interactions structure
- ✅ Remove version history table (not needed)

**Target Structure:**
```markdown
# Skill: web3-frontend

## Scope
- React/Next.js wallet integration with Wagmi v2
- EVM contract interactions using viem
- Transaction state management
- Does NOT cover: Solana (see solana-dev), backend RPC (see ethereum-development)

## Principles
- Use Wagmi v2 hooks for wallet state (`useAccount`, `useWriteContract`, `useReadContract`)
- Use viem for address validation (`getAddress`) and transaction building
- Create custom hooks wrapping wagmi for contract-specific interactions
- Handle connection states explicitly (disconnected, connecting, connected)
- Reference @.cursor/rules/web3/wagmi.mdc for hook patterns
- Reference @.cursor/rules/web3/viem.mdc for address/transaction patterns

## Constraints
- MUST use Wagmi v2.x (not v1)
- MUST validate addresses with `getAddress()` from viem (never cast)
- SHOULD create custom hooks for contract interactions (see wagmi.mdc)
- AVOID wrapping generated hooks unless necessary

## Interactions
- Complements solana-dev for Solana frontend work
- Uses ethereum-development for EVM internals understanding
- References @repo/core for generated contract ABIs/types
```

### 2. solana-dev

**Current Issues:**
- Good structure but needs alignment with actual contracts
- References framework-kit but contracts use Anchor
- Missing monorepo package references
- Missing Anchor version (0.32.1)

**Updates Needed:**
- ✅ Add explicit Anchor version (0.32.1)
- ✅ Reference `@repo/contracts-solana` package
- ✅ Reference `apps/docs/content/docs/blockchain/solana-contracts.mdx`
- ✅ Align with actual Anchor.toml configuration
- ✅ Reference `@.cursor/rules/web3/solana.mdc` for validation patterns
- ✅ Update testing section to match actual test setup

**Target Updates:**
- Add "Monorepo Integration" section referencing package name
- Update Anchor version to 0.32.1
- Reference contract README for deployment examples
- Link to docs for setup instructions

### 3. solidity-development

**Current Issues:**
- Python invocation code
- Bonded agent metadata
- Generic Foundry examples
- Missing alignment with actual foundry.toml

**Updates Needed:**
- ✅ Remove Python invocation code
- ✅ Remove bonded agent metadata
- ✅ Reference Solidity 0.8.24 (from foundry.toml)
- ✅ Reference `@repo/contracts-evm` package
- ✅ Reference `apps/docs/content/docs/blockchain/evm-contracts.mdx`
- ✅ Align with actual Foundry configuration (optimizer 200 runs, etc.)
- ✅ Simplify examples to patterns
- ✅ Reference OpenZeppelin Contracts (used in actual contracts)

**Target Updates:**
- Add "Monorepo Integration" section
- Update Solidity version to 0.8.24
- Reference actual contract structure (TestToken.sol pattern)
- Link to contract README for deployment examples

### 4. ethereum-development

**Current Issues:**
- Python invocation code
- Bonded agent metadata
- Missing viem v2 context
- Generic examples

**Updates Needed:**
- ✅ Remove Python invocation code
- ✅ Remove bonded agent metadata
- ✅ Reference viem v2 explicitly
- ✅ Reference `@.cursor/rules/web3/viem.mdc`
- ✅ Align with actual RPC patterns (Arbitrum Sepolia)
- ✅ Simplify to patterns

### 5. smart-contract-security

**Current Issues:**
- Python invocation code
- Bonded agent metadata
- Generic examples
- Missing Foundry-specific testing patterns

**Updates Needed:**
- ✅ Remove Python invocation code
- ✅ Remove bonded agent metadata
- ✅ Reference Foundry testing patterns (from actual contracts)
- ✅ Reference `@repo/contracts-evm` test structure
- ✅ Simplify examples

### 6. blockchain-basics

**Current Issues:**
- Python invocation code
- Bonded agent metadata
- Too tutorial-like
- Generic examples

**Updates Needed:**
- ✅ Remove Python invocation code
- ✅ Remove bonded agent metadata
- ✅ Convert to declarative patterns
- ✅ Remove tutorial examples
- ✅ Focus on principles only

### 7. defi-protocols

**Current Issues:**
- Python invocation code
- Bonded agent metadata
- Excessive examples
- Missing alignment with actual contracts

**Updates Needed:**
- ✅ Remove Python invocation code
- ✅ Remove bonded agent metadata
- ✅ Simplify examples to patterns
- ✅ Reference actual contract patterns if applicable

### 8. nft-development

**Current Issues:**
- Python invocation code
- Bonded agent metadata
- Excessive examples
- Generic patterns

**Updates Needed:**
- ✅ Remove Python invocation code
- ✅ Remove bonded agent metadata
- ✅ Simplify examples to patterns
- ✅ Reference OpenZeppelin patterns (used in contracts)

## Implementation Checklist

### Phase 1: Cleanup (All Skills)
- [ ] Remove Python invocation code blocks
- [ ] Remove bonded agent metadata (sasmp_version, bonded_agent, bond_type)
- [ ] Remove version history tables
- [ ] Remove "Quick Start" Python examples

### Phase 2: Structure Alignment (All Skills)
- [ ] Convert to Scope/Principles/Constraints/Interactions structure
- [ ] Make declarative (remove instructional language)
- [ ] Add explicit version context
- [ ] Add trade-off explanations where relevant

### Phase 3: Code Alignment (Contract-Related Skills)
- [ ] **solidity-development**: Add Foundry 0.8.24, `@repo/contracts-evm` references
- [ ] **solana-dev**: Add Anchor 0.32.1, `@repo/contracts-solana` references
- [ ] **smart-contract-security**: Add Foundry testing patterns
- [ ] **ethereum-development**: Add viem v2, Arbitrum Sepolia context

### Phase 4: Rule Alignment (Frontend Skills)
- [ ] **web3-frontend**: Reference `@.cursor/rules/web3/wagmi.mdc` and `@.cursor/rules/web3/viem.mdc`
- [ ] **solana-dev**: Reference `@.cursor/rules/web3/solana.mdc`
- [ ] **ethereum-development**: Reference `@.cursor/rules/web3/viem.mdc`

### Phase 5: Documentation Alignment (All Skills)
- [ ] Add references to `apps/docs/content/docs/blockchain/` guides
- [ ] Add references to contract READMEs
- [ ] Add monorepo package references (`@repo/contracts-evm`, `@repo/contracts-solana`)

### Phase 6: Simplification (All Skills)
- [ ] Reduce examples to minimal patterns
- [ ] Remove tutorial-style content
- [ ] Focus on constraints and principles
- [ ] Remove redundant sections

## Success Criteria

After updates, each skill should:

1. ✅ Follow skills.mdc structure (Scope/Principles/Constraints/Interactions)
2. ✅ Be declarative, not instructional
3. ✅ Reference actual code/versions from contracts
4. ✅ Reference relevant Cursor rules
5. ✅ Reference documentation where applicable
6. ✅ Include monorepo context (packages, scripts)
7. ✅ Have no Python invocation code
8. ✅ Have no bonded agent metadata
9. ✅ Focus on patterns over examples
10. ✅ Include explicit version context

## Files to Update

1. `.cursor/skills/web3-frontend/SKILL.md`
2. `.cursor/skills/solana-dev/SKILL.md`
3. `.cursor/skills/solidity-development/SKILL.md`
4. `.cursor/skills/ethereum-development/SKILL.md`
5. `.cursor/skills/smart-contract-security/SKILL.md`
6. `.cursor/skills/blockchain-basics/SKILL.md`
7. `.cursor/skills/defi-protocols/SKILL.md`
8. `.cursor/skills/nft-development/SKILL.md`

## Reference Files

**Guidelines:**
- `.cursor/rules/base/skills.mdc` - Skills writing standards

**Contracts:**
- `contracts/evm/foundry.toml` - Foundry configuration
- `contracts/evm/README.md` - EVM contract usage
- `contracts/solana/Anchor.toml` - Anchor configuration
- `contracts/solana/README.md` - Solana contract usage

**Documentation:**
- `apps/docs/content/docs/blockchain/evm-contracts.mdx` - EVM setup guide
- `apps/docs/content/docs/blockchain/solana-contracts.mdx` - Solana setup guide

**Rules:**
- `.cursor/rules/web3/wagmi.mdc` - Wagmi v2 patterns
- `.cursor/rules/web3/viem.mdc` - Viem v2 patterns
- `.cursor/rules/web3/solana.mdc` - Solana patterns
- `.cursor/rules/web3/multichain.mdc` - Multichain patterns

## Notes

- Keep skills focused and scoped (single responsibility)
- Patterns > Examples (examples rot, patterns last)
- Hard rules only when violations cause real damage
- Make conflicts explicit (e.g., framework-kit vs web3.js)
- Design for composition (skills work together)
