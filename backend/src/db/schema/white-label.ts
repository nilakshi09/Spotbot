import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations.js'

export const whiteLabel = pgTable('white_label', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .unique()
    .references(() => organizations.id),
  // Branding
  companyName: varchar('company_name', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  primaryColor: varchar('primary_color', { length: 7 }),
  accentColor: varchar('accent_color', { length: 7 }),
  // Report customization
  reportFooterText: varchar('report_footer_text', { length: 500 }),
  reportHeaderText: varchar('report_header_text', { length: 255 }),
  // Feature flags
  hidePoweredBySpotbot: boolean('hide_powered_by_spotbot')
    .notNull()
    .default(false),
  hideSpotbotLogo: boolean('hide_spotbot_logo')
    .notNull()
    .default(false),
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type WhiteLabel = typeof whiteLabel.$inferSelect
export type WhiteLabelInsert = typeof whiteLabel.$inferInsert
