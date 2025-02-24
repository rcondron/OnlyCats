import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';

// Get the database path relative to the project root
const dbPath = join(process.cwd(), 'onlycats.db');

// Create a database instance
const sqlite = new Database(dbPath);

// Create the database connection
export const db = drizzle(sqlite);

export type Database = typeof db; 