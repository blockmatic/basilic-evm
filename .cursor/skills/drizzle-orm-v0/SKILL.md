---
name: Drizzle PostgreSQL
description: |
  Drizzle ORM for TypeScript - type-safe SQL queries, schema definitions, migrations, and relations.
  
  Use when: building database layers in Next.js or Node.js applications.
---

# Skill: drizzle-orm

## Scope

- Applies to: Drizzle ORM v0.44+ for PostgreSQL, MySQL, SQLite - schema definitions, type-safe queries, migrations, relations
- Does NOT cover: Database drivers setup, migration tooling details, other ORMs

## Assumptions

- Drizzle ORM v0.44+
- Drizzle Kit v0.31+ (dev dependency) for migrations
- PostgreSQL, MySQL, or SQLite database
- TypeScript v5+ with strict mode

## Principles

- Define schemas using `pgTable`, `text`, `varchar`, `timestamp`, etc.
- Use query helpers (`eq`, `and`, `or`, `like`, etc.) for type-safe queries
- Use `select()`, `insert()`, `update()`, `delete()` for CRUD operations
- Use `relations()` for defining relationships
- Use `db.transaction()` for atomic operations
- Generate migrations with `drizzle-kit generate`
- Use `$inferSelect` and `$inferInsert` for type inference

## Constraints

### MUST

- Use Drizzle Kit for migrations (`drizzle-kit generate`, `drizzle-kit migrate`)
- Define schemas with proper column types and constraints
- Use query helpers instead of raw SQL when possible

### SHOULD

- Use relations for type-safe joins
- Use transactions for multi-step operations
- Use prepared statements for frequently executed queries
- Export types using `$inferSelect` and `$inferInsert`
- Handle `DrizzleQueryError` for structured error handling
- Consider cache layer for frequently accessed queries (optional)

### AVOID

- Raw SQL unless necessary (use query helpers)
- Manual type assertions (use inferred types)
- Skipping migration generation

## Interactions

- Works with [nextjs](@cursor/skills/nextjs-v16/SKILL.md) Server Components and API routes
- Complements [fastify](@cursor/skills/fastify-v5/SKILL.md) for API development

## Patterns

### Schema Definition

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### Query Pattern

```typescript
import { eq } from 'drizzle-orm'

const user = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1)
```

### Transaction Pattern

```typescript
await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values(userData).returning()
  await tx.insert(profiles).values({ userId: user.id, ...profileData })
})
```

### Error Handling Pattern

```typescript
import { DrizzleQueryError } from 'drizzle-orm'

try {
  const user = await db.select().from(users).where(eq(users.id, userId))
} catch (error) {
  if (error instanceof DrizzleQueryError) {
    // Structured error with context: error.message, error.cause, error.query
    console.error('Database error:', error.message)
    console.error('Query:', error.query)
  }
  throw error
}
```

## New Features (v0.44+)

### DrizzleQueryError
Enhanced error handling wrapper that provides structured error context:
- Wraps database driver errors with unified metadata
- Provides access to query, cause, and message
- Works across all database drivers (PostgreSQL, MySQL, SQLite)

### Cache Layer Support
Optional cache layer (sponsored by Upstash) for query results:
- Plug in caching strategies for frequently accessed queries
- Reduces database load for read-heavy applications
- See official Drizzle documentation for cache provider setup

### Enhanced Seeding
Improved seed generators with additional options:
- `min` and `max` parameters for `time`, `timestamp`, and `datetime` generators
- UUID generator now defaults to v4 (was v1) - aligns with Zod v4 validation
- PostgreSQL sequences automatically updated after seeding

### Migration Improvements
- Stricter migration validation (no conditional SQL constructs by default)
- Better handling of unique constraints and indexes
- Improved schema snapshot management

See [Query Patterns](references/queries.md) and [PostgreSQL Patterns](references/postgresql-patterns.md) for detailed examples.

## References

- [Query Patterns](references/queries.md) - CRUD operations, joins, aggregations
- [PostgreSQL Patterns](references/postgresql-patterns.md) - PostgreSQL-specific patterns
