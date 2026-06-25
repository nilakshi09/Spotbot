import { relations } from 'drizzle-orm';
import { organizations } from './organizations.js';
import { users } from './users.js';
import { refreshTokens } from './refresh_tokens.js';
import { passwordResetTokens } from './password_reset_tokens.js';
import { scans } from './scans.js';
import { reports } from './reports.js';

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  refreshTokens: many(refreshTokens),
  passwordResetTokens: many(passwordResetTokens),
  scans: many(scans),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const scansRelations = relations(scans, ({ one }) => ({
  user: one(users, {
    fields: [scans.userId],
    references: [users.id],
  }),
  report: one(reports),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  scan: one(scans, {
    fields: [reports.scanId],
    references: [scans.id],
  }),
}));
