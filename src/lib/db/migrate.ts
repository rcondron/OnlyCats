import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from '.';

// This will run migrations on the database, skipping the ones already applied
migrate(db, { migrationsFolder: './drizzle' }); 