CREATE TABLE IF NOT EXISTS cats (
  token_id TEXT PRIMARY KEY,
  name TEXT,
  image TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  champion_count INTEGER DEFAULT 0,
  lifetime_rewards TEXT DEFAULT '0',
  last_battle_timestamp INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
); 