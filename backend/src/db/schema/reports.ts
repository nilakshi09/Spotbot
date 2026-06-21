import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { scans } from './scans.js';

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').notNull().unique().references(() => scans.id),
  shareToken: varchar('share_token', { length: 64 }).unique(),
  shareExpiresAt: timestamp('share_expires_at', { withTimezone: true }),
  pdfUrl: varchar('pdf_url', { length: 500 }),
  pdfGeneratedAt: timestamp('pdf_generated_at', { withTimezone: true }),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
