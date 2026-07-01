import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations.js'
import { users } from './users.js'

export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'qualified',
  'converted',
  'closed',
])

export const salesLeads = pgTable('sales_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id),
  userId: uuid('user_id').references(() => users.id),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  teamSize: varchar('team_size', { length: 50 }),
  estimatedScansPerMonth: varchar('estimated_scans_per_month', {
    length: 50,
  }),
  message: text('message'),
  status: leadStatusEnum('status').notNull().default('new'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
