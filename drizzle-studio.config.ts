import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './migrations',
  driver: 'libsql',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:sqlite.db'
  },
} satisfies Config; 