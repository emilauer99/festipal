import { PostgresError } from 'postgres';

/**
 * Finds the driver error inside whatever drizzle threw. `me.service.ts` reads
 * `err.cause` directly, which is right for a bare statement — but a statement
 * that fails INSIDE a transaction travels back out through postgres.js's
 * `begin()` wrapper, so the depth is not guaranteed to stay 1. Walking a short
 * cause chain is a superset of the existing idiom: it still finds the driver
 * error at depth 1, and it does not silently degrade a known conflict into a 500
 * if a driver or ORM upgrade adds a layer.
 *
 * Shared by `friendship.service.ts` and `activity.service.ts` — moved here
 * (10-02) once a second module needed the same cause-chain walker, rather than
 * leave a second copy sitting next to it (the exact drift this project
 * legislates against everywhere else).
 */
export function postgresErrorOf(err: unknown): PostgresError | null {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (current instanceof PostgresError) return current;
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}
