import { index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { wallets } from './wallets.js'

export const chainTypeEnum = pgEnum('chain_type', ['evm', 'solana'])
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'confirmed',
  'failed',
])

export const transactions = pgTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    walletId: text('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    chainType: chainTypeEnum('chain_type').notNull(),
    hash: text('hash').notNull(),
    from: text('from').notNull(),
    to: text('to').notNull(),
    value: text('value').notNull(),
    status: transactionStatusEnum('status').notNull(),
    // EVM-specific fields
    blockNumber: text('block_number').$type<number>(),
    blockHash: text('block_hash'),
    gasUsed: text('gas_used'),
    // Solana-specific fields
    slot: text('slot').$type<number>(),
    signature: text('signature'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at'),
  },
  table => ({
    walletIdIdx: index('transactions_wallet_id_idx').on(table.walletId),
    hashIdx: uniqueIndex('transactions_hash_idx').on(table.hash),
  }),
)

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
