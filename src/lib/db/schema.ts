import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const cats = sqliteTable('cats', {
  tokenId: text('token_id').primaryKey(),
  name: text('name'),
  image: text('image'),
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  championCount: integer('champion_count').default(0),
  lifetimeRewards: text('lifetime_rewards').default('0'),
  lastBattleTimestamp: integer('last_battle_timestamp'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
});

export type Cat = typeof cats.$inferSelect;
export type InsertCat = typeof cats.$inferInsert; 