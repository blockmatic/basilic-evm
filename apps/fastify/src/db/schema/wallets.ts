import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const chainTypeEnum = pgEnum('chain_type', ['evm', 'solana'])
export const thresholdSchemeEnum = pgEnum('threshold_scheme', ['TWO_OF_TWO'])

export const wallets = pgTable(
  'wallets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chainType: chainTypeEnum('chain_type').notNull(),
    address: text('address').notNull(),
    encryptedKeyShares: text('encrypted_key_shares').notNull(),
    encryptionKeyId: text('encryption_key_id').notNull(),
    network: text('network').notNull(),
    networkId: text('network_id').notNull(),
    label: varchar('label', { length: 255 }),
    thresholdScheme: thresholdSchemeEnum('threshold_scheme').notNull(),
    backedUpToClientShareService: boolean('backed_up_to_client_share_service')
      .notNull()
      .default(false),
    passwordProtected: boolean('password_protected').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    userIdIdx: index('wallets_user_id_idx').on(table.userId),
    addressIdx: uniqueIndex('wallets_address_idx').on(table.address),
    userChainAddressIdx: uniqueIndex('wallets_user_chain_address_idx').on(
      table.userId,
      table.chainType,
      table.address,
    ),
  }),
)

export type Wallet = typeof wallets.$inferSelect
export type NewWallet = typeof wallets.$inferInsert
