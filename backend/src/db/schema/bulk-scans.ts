import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const bulkScanStatusEnum = pgEnum('bulk_scan_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

export const bulkScans = pgTable('bulk_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  status: bulkScanStatusEnum('status').notNull().default('pending'),
  totalHandles: integer('total_handles').notNull(),
  completedCount: integer('completed_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  handles: jsonb('handles').notNull().$type<BulkHandle[]>(),
  resultUrl: varchar('result_url', { length: 500 }),
  errorMessage: varchar('error_message', { length: 1000 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export interface BulkHandle {
  handle: string
  platform: 'instagram' | 'youtube'
  scanId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  fraudScore?: number
  riskLevel?: string
  error?: string
}
