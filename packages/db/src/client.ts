import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>;

/**
 * Creates a Drizzle client over a postgres.js connection.
 * Pass the POOLED Neon URL at runtime; `prepare: false` is required behind
 * the Neon/pgBouncer pooler.
 */
export function createDatabase(connectionString: string) {
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema, casing: 'snake_case' });
}
