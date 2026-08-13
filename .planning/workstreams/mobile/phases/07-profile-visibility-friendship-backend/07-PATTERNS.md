# Phase 7: Profile Visibility & Friendship Backend - Pattern Map

**Mapped:** 2026-08-12
**Files analyzed:** ~9 (2 new schema files + migration, 2 contract files, new NestJS module ×3 files, 2 test files)
**Analogs found:** 9 / 9 (this phase's canonical_refs already name exact analogs — verified against live code)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/db/src/schema/friendship.ts` (new) | model (Drizzle table) | CRUD | `packages/db/src/schema/my-festival.ts` | exact |
| `packages/db/src/schema/friend-request.ts` (new) | model (Drizzle table) | CRUD | `packages/db/src/schema/my-festival.ts` | exact |
| `packages/db/src/schema/index.ts` (modified) | config (barrel export) | — | itself (existing pattern) | exact |
| `packages/db/drizzle/0005_*.sql` + `meta/*` (generated) | migration | batch | `packages/db/drizzle/0004_new_wong.sql` | exact |
| `packages/contracts/src/schemas.ts` (modified: split `visitorProfilePublicSchema`) | model (Zod schema) | transform | itself, lines 44-73 (`visitorProfilePublicSchema`) | exact |
| `packages/contracts/src/router.ts` (modified: new endpoints) | route (ts-rest contract) | request-response | itself, `getMe`/`saveFestival`/`listMyFestivals` entries | exact |
| `apps/api/src/friendship/friendship.module.ts` (new) | provider (NestJS module) | — | `apps/api/src/me/me.module.ts` | exact |
| `apps/api/src/friendship/friendship.controller.ts` (new) | controller | request-response | `apps/api/src/me/me.controller.ts` | exact |
| `apps/api/src/friendship/friendship.service.ts` (new) | service | CRUD + event-driven (request lifecycle) | `apps/api/src/festival/festival.service.ts` (idempotency) + `apps/api/src/me/me.service.ts` (conflict mapping) | exact (composite) |
| `apps/api/src/app.module.ts` (modified) | config (module registration) | — | itself, line 11 | exact |
| `apps/api/test/friend-request-race.spec.ts` (new) | test | event-driven (concurrency) | `apps/api/test/username-race.spec.ts` | exact |
| `apps/api/test/friendship-isolation.spec.ts` (new, VIS-01/VIS-02/SEC-02 proofs) | test | request-response | `apps/api/test/festival-isolation.spec.ts` | exact |

**Mobile client:** no change expected this phase (backend-only, `--ws mobile` scope). The mobile app consumes contract types by importing `@quiks/contracts`' `contract` object and deriving a typed ts-rest client — no hand-written interfaces. Once `router.ts` gains the new endpoints, mobile screens in Phase 8 will pick up types automatically; nothing to touch now.

## Pattern Assignments

### `packages/db/src/schema/friendship.ts` (model, CRUD)

**Analog:** `packages/db/src/schema/my-festival.ts` (full file, 40 lines — read in one pass)

**Composite-PK + cascade-FK-onto-visitor_profile pattern** (lines 23-36):
```typescript
export const myFestival = pgTable(
  'my_festival',
  {
    visitorId: text()
      .notNull()
      .references(() => visitorProfile.accountId, { onDelete: 'cascade' }),
    festivalId: uuid()
      .notNull()
      .references(() => festival.id, { onDelete: 'cascade' }),
    savedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    camp: text(),
  },
  (t) => [primaryKey({ columns: [t.visitorId, t.festivalId] })],
);

export const myFestivalInsertSchema = createInsertSchema(myFestival);
export const myFestivalSelectSchema = createSelectSchema(myFestival);
```

**Apply to `friendship`:** two `text()` FKs (`lowerId`, `higherId`) both `.references(() => visitorProfile.accountId, { onDelete: 'cascade' })`, `createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()`, `primaryKey({ columns: [t.lowerId, t.higherId] })`, plus a Postgres `CHECK` (`sql` template, see D-14) enforcing `lowerId < higherId` — this needs `check()` from `drizzle-orm/pg-core`, which `my-festival.ts` does not use; check `festival.ts` or another table for a `check(...)` precedent if one exists, otherwise add the constraint via raw SQL in the generated migration (drizzle-kit does not always emit CHECK from a table config depending on version — verify after `db:generate`).

**Apply to `friend_request`:** same canonical-pair FKs (`lowerId`, `higherId`) plus a third `text()` column `requesterId` (also referencing `visitorProfile.accountId`, cascade) carrying direction, `createdAt` timestamp, unique constraint on `(lowerId, higherId)` (not a composite PK if a separate `id` surrogate key is preferred — planner's discretion per CONTEXT.md "Claude's Discretion").

**Both files export `createInsertSchema`/`createSelectSchema`** exactly like `myFestivalInsertSchema`/`myFestivalSelectSchema` (line 38-39) — this is the drizzle-zod base the contracts layer composes on (Pitfall 6, never hand-mirrored).

---

### `packages/db/src/schema/visitor-profile.ts` (reference only — the `lower()` helper is REUSED, not modified)

**Case-insensitive prefix search helper** (lines 23-26):
```typescript
function lower(col: AnyPgColumn): SQL {
  return sql`lower(${col})`;
}
```

**Functional unique index it powers** (line 63):
```typescript
(t) => [uniqueIndex('visitor_profile_username_lower_unq').on(lower(t.username))],
```

**Apply to username search (D-06):** in `friendship.service.ts` (or wherever search lives), issue `sql\`lower(${visitorProfile.username}) LIKE lower(${input} || '%')\`` (or drizzle's `like`/`ilike` operator) against this SAME index — no new index, no `pg_trgm`. `MeService.checkUsernameAvailability` (`me.service.ts:107-114`) already demonstrates the `sql\`lower(...)\`` idiom for an exact match; the search variant just swaps `=` for a prefix `LIKE`.

**`.extend()` override list** (lines 123-165) — if the friend-view projection ever needs a NEW `text()` column beyond what's already picked, remember: every `text()` column requires a matching `.extend()` override on both `visitorProfileInsertSchema` and `visitorProfileSelectSchema`, or drizzle-zod's static type collapses to `unknown`. Not expected to be touched this phase (D-01/D-02 use only existing columns), but the T-06-06 comment at lines 42-45 (visitor-profile.ts) and lines 57-62 (schemas.ts) MUST be updated/removed once the split lands — CONTEXT.md canonical_refs flags this explicitly.

---

### `packages/db/src/schema/index.ts` (barrel export)

**Full existing file** (8 lines):
```typescript
export * from './locale';
export * from './festival';
export * from './tag';
export * from './auth';
export * from './auth-schemas';
export * from './visitor-profile';
export * from './my-festival';
```

**Apply:** append `export * from './friendship';` and `export * from './friend-request';` (or a combined `friend.ts` if the planner chooses one file — CONTEXT.md leaves file-splitting to the planner).

---

### Migration: `packages/db/drizzle/0005_*` (generated)

**Analog:** `packages/db/drizzle/0004_new_wong.sql` (full file, 3 lines):
```sql
ALTER TABLE "visitor_profile" ADD COLUMN "pronoun" text;--> statement-breakpoint
ALTER TABLE "visitor_profile" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "visitor_profile" ADD COLUMN "gender" text;
```

**Convention:** migrations are `NNNN_<generated-adjective-name>.sql`, numbered sequentially (`0000`-`0004` exist; next is `0005`). Never hand-write the SQL — generate via `pnpm --filter db db:generate` (or from repo root, per `packages/db/package.json` scripts: `db:generate` → `drizzle-kit generate`, `db:migrate` → `drizzle-kit migrate`) after the schema files are written, then review the generated SQL for the CHECK constraint (drizzle-kit's CHECK support varies by version — verify it emitted `CONSTRAINT ... CHECK (lower_id < higher_id)`; if not, hand-edit the generated migration file, which IS an accepted practice for constraints drizzle-kit can't infer). Also apply via `db:migrate` against local Docker Postgres before considering the phase done. **Coordination:** CONTEXT.md flags `packages/db` as the admin-stream collision zone — confirm admin isn't mid-migration before running `db:generate`/`db:migrate`.

---

### `packages/contracts/src/schemas.ts` (Zod schemas, transform)

**Analog / file being modified directly** — current `visitorProfilePublicSchema` (lines 64-73):
```typescript
export const visitorProfilePublicSchema = visitorProfileSelectSchema.pick({
  accountId: true,
  username: true,
  displayName: true,
  avatar: true,
  pronoun: true,
  birthDate: true,
  gender: true,
});
export type VisitorProfilePublic = z.infer<typeof visitorProfilePublicSchema>;
```

**Apply (D-01/D-02 split):** rename this (owner-bound) usage to something like `meProfileSchema` (kept as-is, still feeds `meSchema` at line 99) and add a SECOND schema `visitorProfileForeignSchema` (or similar name — naming is planner's discretion) also composed via `.pick()` on `visitorProfileSelectSchema`, carrying ONLY `accountId, username, displayName, avatar, pronoun, gender` (D-02 — no `birthDate`). This is the ONE foreign-view schema that VIS-02's uniqueness test will assert against. Keep the drift-detection property: never hand-mirror fields as a plain `z.object`.

**New schemas needed this phase** (compose the same way, on drizzle-zod bases from `friendshipSelectSchema`/`friendRequestSelectSchema` once those exist in `@quiks/db`):
- search-result item = foreign profile schema `.extend({ relation: z.enum(['none','requestOutgoing','requestIncoming','friends','self']) })` (D-07)
- friend-list item, incoming/outgoing request list item — likely `friendRequestSelectSchema` fields + embedded foreign profile

**`usernameAvailabilitySchema` pattern to mimic for simple response shapes** (lines 121-122):
```typescript
export const usernameAvailabilitySchema = z.object({ available: z.boolean() });
export type UsernameAvailability = z.infer<typeof usernameAvailabilitySchema>;
```

---

### `packages/contracts/src/router.ts` (ts-rest contract, request-response)

**Analog: existing `getMe`/`completeProfile`/`saveFestival`/`listMyFestivals` entries** (lines 45-85) — full pattern to copy per new endpoint:
```typescript
getMe: {
  method: 'GET',
  path: '/me',
  responses: { 200: meSchema },
  summary: '...',
},
completeProfile: {
  method: 'POST',
  path: '/me/complete-profile',
  body: completeProfileBodySchema,
  responses: { 200: visitorProfilePublicSchema, 409: errorSchema },
  summary: '...',
},
saveFestival: {
  method: 'POST',
  path: '/festivals/:festivalId/save',
  pathParams: z.object({ festivalId: z.string().uuid() }),
  body: z.object({}),
  responses: { 200: z.object({ saved: z.literal(true) }), 404: errorSchema, 409: errorSchema },
  summary: '...',
},
```

**Apply:** one router entry per lifecycle transition (send/accept/decline/withdraw/unfriend), one for handle-lookup (`GET /visitors/:username` or similar, `pathParams`, 200/404), one for search (`GET /me/friends/search?q=...`, `query`, 200 array), one/two for lists (`GET /me/friends`, `GET /me/friend-requests` — incoming/outgoing as separate top-level arrays or a combined query param, planner's discretion per D-125-126 in CONTEXT.md `Claude's Discretion`). All bodies for POST-with-no-payload actions should follow `saveFestival`'s `body: z.object({})` idiom. `errorSchema` (line 16) `z.object({ message: z.string() })` is the shared 404/409 error shape — reuse, don't redeclare.

---

### `apps/api/src/friendship/*.module.ts` / `*.controller.ts` / `*.service.ts` (new NestJS feature module)

**Directory convention:** sibling to `apps/api/src/me/` and `apps/api/src/festival/` — i.e. `apps/api/src/friendship/friendship.module.ts`, `friendship.controller.ts`, `friendship.service.ts`. NestJS suffix convention per project CLAUDE.md: `.module.ts` / `.service.ts` / `.controller.ts`, constructor injection.

**Module analog — `apps/api/src/me/me.module.ts`** (full file, 11 lines):
```typescript
import { Module } from '@nestjs/common';

import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
```

**Controller analog — `apps/api/src/me/me.controller.ts`** (full file, 68 lines). Core `@TsRestHandler` + `@Session()` pattern (lines 8-34, 59-66):
```typescript
@Controller()
export class MeController {
  constructor(private readonly me: MeService) {}

  // No @AllowAnonymous() — inherits the global AuthGuard (SEC-01).
  @TsRestHandler(contract.getMe)
  getMe(@Session() session: UserSession) {
    return tsRestHandler(contract.getMe, async () => {
      const profile = await this.me.getProfile(session.user.id);
      return { status: 200, body: { /* ... */ profile } };
    });
  }

  // SEC-02: scope comes only from the session — never a request param.
  @TsRestHandler(contract.listMyFestivals)
  listMyFestivals(@Session() session: UserSession) {
    return tsRestHandler(contract.listMyFestivals, async () => {
      const festivals = await this.me.listMyFestivals(session.user.id);
      return { status: 200, body: festivals };
    });
  }
}
```
**Conflict-to-status-code mapping (`completeProfile`, lines 39-48):**
```typescript
@TsRestHandler(contract.completeProfile)
completeProfile(@Session() session: UserSession) {
  return tsRestHandler(contract.completeProfile, async ({ body }) => {
    const result = await this.me.completeProfile(session.user.id, body);
    if (result.status === 'conflict') {
      return { status: 409, body: { message: 'Username already taken' } };
    }
    return { status: 200, body: result.profile };
  });
}
```

**Apply to `friendship.controller.ts`:** every endpoint takes `@Session() session: UserSession` and derives `session.user.id` — NEVER a path/body-supplied accountId (ARCHITECTURE.md anti-pattern "Client-Supplied Scope", explicitly named in CONTEXT.md canonical_refs). Each service call returns a discriminated union (`{status:'ok',...} | {status:'conflict'} | {status:'not-found'}`), which the controller maps to HTTP status — never throw for expected business outcomes.

**Service analogs — idempotency + error mapping, `apps/api/src/festival/festival.service.ts:131-157`:**
```typescript
async save(
  visitorId: string,
  festivalId: string,
): Promise<{ status: 'ok' } | { status: 'not-found' } | { status: 'profile-required' }> {
  const [fest] = await this.db.select({ id: festival.id }).from(festival)
    .where(eq(festival.id, festivalId)).limit(1);
  if (!fest) return { status: 'not-found' };

  try {
    await this.db.insert(myFestival).values({ visitorId, festivalId }).onConflictDoNothing();
    return { status: 'ok' };
  } catch (err) {
    const cause = (err as { cause?: unknown }).cause;
    if (cause instanceof PostgresError && cause.code === '23503') {
      return { status: 'profile-required' };
    }
    throw err;
  }
}
```

**Conflict-constraint discrimination — `apps/api/src/me/me.service.ts:65-104`** (the `23505` catch that distinguishes WHICH unique constraint fired via `cause.constraint_name`):
```typescript
try {
  const [row] = await this.db.insert(visitorProfile).values({ accountId, ...input }).returning({ /* ... */ });
  return { status: 'ok', profile: row };
} catch (err) {
  const cause = (err as { cause?: unknown }).cause;
  if (cause instanceof PostgresError && cause.code === '23505') {
    if (cause.constraint_name === USERNAME_UNIQUE_CONSTRAINT) {
      return { status: 'conflict' };
    }
    // ... idempotent existing-row fallback
  }
  throw err;
}
```

**Apply to friend-request send (D-10 auto-accept race):** the send-request service method must (a) canonically order the pair (`lowerId`/`higherId` via string comparison of the two accountIds — same technique CONTEXT.md D-14 describes), (b) attempt an insert into `friend_request`, (c) on the unique-constraint violation for `(lowerId, higherId)`, re-read the existing row: if `existing.requesterId !== callerId` (i.e. the reverse direction is already pending), this is the auto-accept path — delete the request row and insert into `friendship` in the same flow (wrap in `this.db.transaction(...)`, not used elsewhere in this codebase yet but standard Drizzle API — no existing analog for an explicit transaction block, so this is genuinely new ground within an otherwise copy-paste-able error-mapping shape). Otherwise (`existing.requesterId === callerId`) return an idempotent `{status:'ok'}` (already pending, D-11/D-13 imply no error). Mirror `festival.service.ts`'s pattern of checking `cause.constraint_name` if multiple unique constraints could fire (canonical-pair unique vs. any PK).

---

### `apps/api/src/app.module.ts` (module registration)

**Full existing file** (15 lines):
```typescript
import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { FestivalModule } from './festival/festival.module';
import { HealthController } from './health/health.controller';
import { MeModule } from './me/me.module';

@Module({
  imports: [ConfigModule, DbModule, AuthModule, FestivalModule, MeModule],
  controllers: [HealthController],
})
export class AppModule {}
```

**Apply:** add `import { FriendshipModule } from './friendship/friendship.module';` and append `FriendshipModule` to the `imports` array — same slot as `FestivalModule`/`MeModule`.

---

### `apps/api/test/friend-request-race.spec.ts` (test, event-driven/concurrency)

**Analog: `apps/api/test/username-race.spec.ts`** (full file, 138 lines) — structure to copy:
```typescript
import { randomUUID } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { user, visitorProfile, type Database } from '@quiks/db';

import { MeService } from '../src/me/me.service';
import { createTestDatabase } from './setup';

describe('username-race (Pitfall 11 / SC-5)', () => {
  let db: Database;
  let me: MeService;
  const accountA = `test-username-race-a-${randomUUID()}`;
  const accountB = `test-username-race-b-${randomUUID()}`;

  beforeAll(async () => {
    db = createTestDatabase();
    me = new MeService(db);
    await db.insert(user).values([/* two throwaway accounts */]);
  });

  afterAll(async () => {
    await db.delete(visitorProfile).where(inArray(visitorProfile.accountId, [accountA, accountB]));
    await db.delete(user).where(inArray(user.id, [accountA, accountB]));
  });

  it('...', async () => { /* sequential race proof, not literal Promise.all concurrency —
    the existing precedent proves the DB constraint via two sequential calls where the
    SECOND one is expected to hit the constraint, which is sufficient because the constraint
    itself (not application-level locking) is what's under test */ });
});
```

**Apply to the A→B/B→A auto-accept race (D-10):** two throwaway `user` + `visitorProfile` rows (accountA, accountB via `randomUUID()`-suffixed emails/usernames — never touch seed data, per festival-isolation.spec.ts's D-03 comment at line 83), call `friendshipService.sendRequest(accountA, accountB)` then `friendshipService.sendRequest(accountB, accountA)` (reverse direction) and assert: exactly one `friendship` row exists for the canonical pair, zero `friend_request` rows remain, no thrown error on either call. `afterAll` cleans up both new tables plus `user`.

---

### `apps/api/test/friendship-isolation.spec.ts` (test, request-response / VIS-01 field-absence + VIS-02 single-codepath)

**Analog: `apps/api/test/festival-isolation.spec.ts`** — full HTTP-level harness pattern (lines 1-151, imports/helpers/beforeAll/afterAll):
```typescript
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { festival, myFestival, user, visitorProfile, type Database } from '@quiks/db';

import { createTestApp, createTestDatabase } from './setup';

// signInWithOtp(app, email) -> cookie  (real OTP round-trip via captured-OTP file)
// createVisitor(app, db, label) -> { accountId, cookie }  (signs in, inserts visitorProfile row)

describe('festival isolation (SEC-02 cross-tenant denial)', () => {
  let app: INestApplication;
  let db: Database;
  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();
    // provision throwaway fixtures, never the dev seed
  });
  afterAll(async () => {
    // delete throwaway rows in dependency order; app.close(); never delete user/session rows
    await app.close();
  });

  it('...', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/...').set('cookie', visitor1.cookie);
    expect(res.status).toBe(200);
    // D-03-style: assert the SERIALIZED body does not contain a field's value at all —
    // stronger than checking the parsed object doesn't have a key.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(forbiddenValue);
  });
});
```

**Apply (VIS-01 field-absence, D-03):** create two visitors via `createVisitor`, hit an endpoint returning a foreign-view profile (search/lookup/list), and assert `JSON.stringify(res.body)` does NOT contain the target's `birthDate` value or a `birthDate`/`email` KEY at all — same technique `festival-isolation.spec.ts` uses at lines 172-176 to prove festival B's fields never leak (`expect(serialized).not.toContain(festivalBId)` etc.). This is the load-bearing test-writing pattern for D-03's "absence, not presence" requirement.

**Apply (VIS-02 single-codepath):** a unit-level test (not necessarily HTTP) that greps/imports and asserts there is exactly one exported foreign-profile-projection function/schema used by every one of the four D-04 access paths (handle-lookup, search, request lists, friend list) — e.g. assert search-result items and friend-list items are both built by calling the same helper/schema, or a static check that no second `.pick()`/hand-built object exists. Concrete mechanism is planner's discretion; the intent (provable singularity, not just correctness at one call site) is fixed by CONTEXT.md.

## Shared Patterns

### Session-derived scope, never client-supplied
**Source:** `apps/api/src/me/me.controller.ts` (every handler), `apps/api/src/festival/festival.controller.ts` (`saveFestival`/`listMyFestivals`)
**Apply to:** every new friendship endpoint — `@Session() session: UserSession` → `session.user.id` is the ONLY source of the caller's identity, for BOTH the actor and (where relevant) checking that a target accountId param actually exists.
```typescript
@TsRestHandler(contract.listMyFestivals)
listMyFestivals(@Session() session: UserSession) {
  return tsRestHandler(contract.listMyFestivals, async () => {
    const festivals = await this.me.listMyFestivals(session.user.id);
    return { status: 200, body: festivals };
  });
}
```

### Postgres error-code mapping (no exceptions for expected conflicts)
**Source:** `apps/api/src/me/me.service.ts:83-103` (23505), `apps/api/src/festival/festival.service.ts:145-156` (23503)
**Apply to:** `friendship.service.ts` — `23505` on the `friend_request`/`friendship` unique constraints maps to the auto-accept/idempotent path (D-10/D-11), never a thrown 500. Always check `(err as { cause?: unknown }).cause instanceof PostgresError`, never `err` itself (drizzle wraps the driver error).

### Idempotency via `onConflictDoNothing()`
**Source:** `apps/api/src/festival/festival.service.ts:143`
**Apply to:** repeat "send request" when already friends, or repeat unfriend/withdraw — prefer `onConflictDoNothing()`/delete-if-exists over throwing, consistent with D-11/D-13's "no punitive errors" posture.

### Contract-first schema composition (drizzle-zod base, `.pick()`/`.extend()`, never hand-mirrored)
**Source:** `packages/contracts/src/schemas.ts:64-73` (`visitorProfilePublicSchema`), `:111-118` (`completeProfileBodySchema`)
**Apply to:** every new Zod schema in this phase — compose on `visitorProfileSelectSchema`/the new `friendshipSelectSchema`/`friendRequestSelectSchema`, never redeclare fields as a fresh `z.object`.

### Nullable-for-not-found, controller maps to 404
**Source:** `apps/api/src/me/me.service.ts:24` (`getProfile` returns `VisitorProfilePublic | null`)
**Apply to:** handle-lookup (`GET /visitors/:username` or similar) — service returns `null`, controller maps to `{status: 404, body: {message: ...}}`, per CONTEXT.md's explicit "follows the existing house rule" note.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Auto-accept transaction in `friendship.service.ts` (send-request race resolution) | service | event-driven | No existing service in this codebase wraps multiple writes in `this.db.transaction(...)`; `festival.service.ts`/`me.service.ts` are both single-statement-plus-catch. Genuinely new: implement per Drizzle's standard `db.transaction(async (tx) => {...})` API (not project-specific — general Drizzle usage), keeping the same `23505`/`cause.constraint_name` discrimination pattern inside the transaction callback. |

## Metadata

**Analog search scope:** `packages/db/src/schema/`, `packages/db/drizzle/`, `packages/contracts/src/`, `apps/api/src/me/`, `apps/api/src/festival/`, `apps/api/src/app.module.ts`, `apps/api/test/`
**Files scanned:** 13 (all explicitly named in CONTEXT.md canonical_refs/code_context; all verified against live code, no drift found)
**Pattern extraction date:** 2026-08-12
