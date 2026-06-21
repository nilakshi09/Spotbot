import { pgTable, uuid, varchar, integer, timestamp, pgEnum, index, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const platformEnum = pgEnum('platform', ['instagram', 'youtube']);
export const statusEnum = pgEnum('status', ['pending', 'processing', 'completed', 'failed']);
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high']);

export type SubScores = {
  growthVelocity: { score: number; confidence: number; summary: string; details: Record<string, unknown> };
  engagementRate: { score: number; confidence: number; summary: string; details: Record<string, unknown> };
  commentSentiment: { score: number; confidence: number; summary: string; details: Record<string, unknown> };
  spikeDetection: { score: number; confidence: number; summary: string; details: Record<string, unknown> };
};

export type ProfileData = {
  displayName: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  profilePictureUrl: string;
  isVerified: boolean;
  category: string;
};

export const scans = pgTable('scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  platform: platformEnum('platform').notNull(),
  handle: varchar('handle', { length: 255 }).notNull(),
  status: statusEnum('status').notNull().default('pending'),
  fraudScore: integer('fraud_score'),
  realReach: integer('real_reach'),
  riskLevel: riskLevelEnum('risk_level'),
  subScores: jsonb('sub_scores').$type<SubScores>(),
  profileData: jsonb('profile_data').$type<ProfileData>(),
  rawData: jsonb('raw_data'),
  errorMessage: varchar('error_message', { length: 1000 }),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => [
  index('scans_user_id_idx').on(table.userId),
  index('scans_handle_platform_idx').on(table.handle, table.platform),
  index('scans_status_idx').on(table.status).where(sql`${table.status} IN ('pending', 'processing')`),
  index('scans_created_at_idx').on(table.createdAt),
]);
