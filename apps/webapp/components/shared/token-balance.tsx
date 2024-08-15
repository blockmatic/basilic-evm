'use client'

import { useTokenBalance } from '@/hooks/use-balance'
import { loadingBalance } from '@/lib/constants'
import { getToken } from '@repo/project-contracts'
import type { Token } from '@repo/project-contracts/src/types'
import { erc20Abi } from 'abitype/abis'
import { useAccount } from 'wagmi'

export function TokenBalance({ token }: { token: Partial<Token> }) {
  const { address } = useAccount()
  const tokenData = getToken({
    address: token.address,
    symbol: token.symbol,
    name: token.name,
  } as Pick<Token, 'address' | 'symbol' | 'name'>)

  if (!tokenData) return <div> token not found </div>

  const balance = useTokenBalance({
    token: tokenData,
    address,
    abi: erc20Abi,
  })

  return (
    <span
      itemProp="amount"
      itemScope
      itemType="https://schema.org/QuantitativeValue"
    >
      {balance.formatted} {tokenData.symbol}
    </span>
  )
}
