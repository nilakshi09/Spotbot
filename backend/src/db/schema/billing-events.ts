import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const billingEvents = pgTable('billing_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id),
  stripeEventId: varchar('stripe_event_id', { length: 255 })
    .notNull()
    .unique(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventData: jsonb('event_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
