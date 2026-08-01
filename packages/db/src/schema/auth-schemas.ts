import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { account, session, user, verification } from './auth';

/**
 * drizzle-zod base schemas for the vendored better-auth tables (D-02, SC-3).
 *
 * Hand-written and kept in a SEPARATE file from the generated `./auth.ts` so
 * regenerating that file (via `auth generate`) never clobbers these exports.
 * `packages/contracts` imports these bases and composes API-facing shapes on
 * top (`.pick`/`.omit`/`.extend`) in Phase 2 — a DB column rename then becomes a
 * compile error in the contract composition rather than a runtime surprise.
 */
export const userInsertSchema = createInsertSchema(user);
export const userSelectSchema = createSelectSchema(user);

export const sessionInsertSchema = createInsertSchema(session);
export const sessionSelectSchema = createSelectSchema(session);

export const accountInsertSchema = createInsertSchema(account);
export const accountSelectSchema = createSelectSchema(account);

export const verificationInsertSchema = createInsertSchema(verification);
export const verificationSelectSchema = createSelectSchema(verification);
