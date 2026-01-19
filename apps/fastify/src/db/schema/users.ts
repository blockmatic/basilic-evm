import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    dynamicUserId: text('dynamic_user_id').notNull().unique(),
    email: varchar('email', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    dynamicUserIdIdx: index('users_dynamic_user_id_idx').on(table.dynamicUserId),
    emailIdx: index('users_email_idx').on(table.email),
  }),
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
