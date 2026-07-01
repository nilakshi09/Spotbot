import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations.js'
import { users } from './users.js'

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdByUserId: uuid('created_by_user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  requestCount: integer('request_count').notNull().default(0),
  rateLimit: integer('rate_limit').notNull().default(60),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type ApiKey = typeof apiKeys.$inferSelect
