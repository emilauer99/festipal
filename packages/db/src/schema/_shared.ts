import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

/** Standard UUID primary key (Postgres `gen_random_uuid()`). */
export const idColumn = () => uuid().primaryKey().defaultRandom();

/** created_at / updated_at columns shared by every table. */
export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
};
