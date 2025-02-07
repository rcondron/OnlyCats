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

export const battles = sqliteTable('battles', {
  id: integer('id').primaryKey(),
  battleId: text('battle_id').notNull(),
  winnerId: text('winner_id').notNull(),
  loserId: text('loser_id').notNull(),
  round: integer('round').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const tournaments = sqliteTable('tournaments', {
  id: integer('id').primaryKey(),
  battleId: text('battle_id').notNull(),
  result: text('result').notNull(),
  winnerAddress: text('winner_address').notNull(),
  prizePool: text('prize_pool').notNull(),
  participantCount: integer('participant_count').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export type Cat = typeof cats.$inferSelect;
export type InsertCat = typeof cats.$inferInsert; 