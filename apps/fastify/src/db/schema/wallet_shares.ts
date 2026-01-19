import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users.js'
import { wallets } from './wallets.js'

export const walletShares = pgTable(
  'wallet_shares',
  {
    id: text('id').primaryKey(),
    walletId: text('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    sharedWithUserId: text('shared_with_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    permissions: text('permissions').notNull().$type<string[]>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    walletIdIdx: index('wallet_shares_wallet_id_idx').on(table.walletId),
    sharedWithUserIdIdx: index('wallet_shares_shared_with_user_id_idx').on(table.sharedWithUserId),
    walletUserIdx: uniqueIndex('wallet_shares_wallet_user_idx').on(
      table.walletId,
      table.sharedWithUserId,
    ),
  }),
)

export type WalletShare = typeof walletShares.$inferSelect
export type NewWalletShare = typeof walletShares.$inferInsert
