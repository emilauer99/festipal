# Phase 10: Activities Backend - Pattern Map

**Mapped:** 2026-08-14
**Files analyzed:** 12 (create/modify)
**Analogs found:** 12 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/db/src/schema/activity.ts` | model | CRUD | `packages/db/src/schema/tag.ts` (translation-table pattern) + `my-festival.ts` (tenant FK/cascade) | role-match |
| `packages/db/src/schema/activity-tag.ts` (replaces `tag.ts`) | model | CRUD | `packages/db/src/schema/tag.ts` | exact (structural twin, nullable-FK delta) |
| `packages/db/src/schema/activity-participant.ts` | model | CRUD (race-critical) | `packages/db/src/schema/my-festival.ts` | exact (composite-PK join table) |
| `packages/db/src/schema/index.ts` | config | — | itself (barrel) | exact |
| `packages/db/drizzle/0007_*.sql` (generated) | migration | — | prior numbered migrations in `packages/db/drizzle/` | role-match |
| `packages/contracts/src/schemas.ts` | model/DTO | transform | `tagSchema`/`festivalSchema` block (lines ~36-42, festival block) | exact |
| `packages/contracts/src/router.ts` | route | request-response | `listTags`/`getFestival`/`saveFestival` routes | exact |
| `apps/api/src/activity/activity.module.ts` | config | — | `apps/api/src/festival/festival.module.ts` | exact |
| `apps/api/src/activity/activity.controller.ts` | controller | request-response | `apps/api/src/festival/festival.controller.ts` | exact |
| `apps/api/src/activity/activity.service.ts` | service | CRUD + event-driven (capacity race) | `apps/api/src/festival/festival.service.ts` (locale resolution) + `apps/api/src/friendship/friendship.service.ts` (`postgresErrorOf`, transactional pair-write) | role-match (composite of two analogs) |
| `apps/api/src/activity/activity-projection.ts` | utility | transform | `apps/api/src/friendship/visitor-projection.ts` | exact |
| `apps/api/src/app.module.ts` | config | — | itself, add `ActivityModule` next to `FestivalModule` | exact |
| `packages/db/scripts/seed.ts` | utility | batch (seed) | itself, add `activityTag`/`activityTagTranslation` planting loop | exact |
| `apps/api/test/activity-capacity-race.spec.ts` | test | event-driven (concurrency) | `apps/api/test/username-race.spec.ts` | role-match (precedent for concurrent-insert proof shape; note below) |
| `apps/api/test/activity-tenant-isolation.spec.ts` | test | request-response | `apps/api/test/festival-isolation.spec.ts` | exact |
| `apps/api/test/projection-uniqueness.spec.ts` (extend) | test | transform | itself | exact |

## Pattern Assignments

### `packages/db/src/schema/activity-tag.ts` (model, CRUD) — replaces `packages/db/src/schema/tag.ts`

**Analog:** `packages/db/src/schema/tag.ts` (full file, 37 lines, read in full — this file is DELETED by this phase per D-01)

```typescript
// packages/db/src/schema/tag.ts (CURRENT — being replaced)
import { pgTable, primaryKey, text, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './_shared';
import { festival } from './festival';
import { localeEnum } from './locale';

export const tag = pgTable(
  'tag',
  {
    id: idColumn(),
    festivalId: uuid()
      .notNull()
      .references(() => festival.id, { onDelete: 'cascade' }),
    slug: text().notNull(),
    ...timestamps,
  },
  (t) => [unique('tag_festival_slug_unq').on(t.festivalId, t.slug)],
);

export const tagTranslation = pgTable(
  'tag_translation',
  {
    tagId: uuid()
      .notNull()
      .references(() => tag.id, { onDelete: 'cascade' }),
    locale: localeEnum().notNull(),
    title: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.tagId, t.locale] })],
);
```

**What to change for `activity_tag`:**
- `festivalId` becomes `uuid().references(() => festival.id, { onDelete: 'cascade' })` **without** `.notNull()` — the D-01/D-02 nullable-tenant special case (global catalog = `NULL`). This is the one structural delta from the analog; every cross-tenant test in this phase must special-case it (per canonical_refs).
- Drop the `unique('tag_festival_slug_unq')` constraint shape or adapt it — a nullable `festivalId` changes uniqueness semantics (two NULLs don't collide under standard btree unique). Decide slug uniqueness scope in the plan (global tags vs. per-festival custom tags — the latter is out of scope this phase per D-01, but the constraint must not break on `festivalId IS NULL` rows).
- Rename table/const from `tag`/`tagTranslation` to `activityTag`/`activityTagTranslation`; `activity_tag_translation` keeps the exact composite-PK translation-table shape (`tagId` FK + `locale` + `title`).
- New: `festival_activity_tag` (D-04/D-05 activation table) — model this as a `my-festival.ts`-style composite-PK join table: `(festivalId, tagId)` PK, `enabled: boolean().notNull().default(false)` is WRONG per D-05 (default-ON/opt-out) — a row's mere PRESENCE with `enabled=false` is the opt-out; absence = enabled. So the table only ever needs an `enabled` column if you allow re-enabling after disabling; otherwise presence-as-disable is sufficient. Resolve in the plan.

### `packages/db/src/schema/activity-participant.ts` (model, CRUD/race-critical)

**Analog:** `packages/db/src/schema/my-festival.ts` (full file, 40 lines, read in full above)

```typescript
// packages/db/src/schema/my-festival.ts — composite-PK join table pattern to copy
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

**Apply to `activity_participant`:** composite PK `(activityId, visitorId)`, `visitorId: text().references(() => visitorProfile.accountId, { onDelete: 'cascade' })` (same "profile required" encoding as `my_festival`), `activityId: uuid().references(() => activity.id, { onDelete: 'cascade' })`, `joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow()`. **Capacity enforcement (Discretion item, D-08 null=unbecoming grenzenlos):** the DB-level guard needs either (a) a trigger/check subquery counting rows against `activity.capacity`, or (b) an application-level `SELECT ... FOR UPDATE` + insert inside `this.db.transaction(...)`, mirroring the transactional pair-write pattern in `friendship.service.ts` (`sendRequest`/counter-request auto-accept, which wraps read+write in `this.db.transaction()`). Since Postgres has no native "capacity" constraint primitive, prefer a `CHECK`-free approach: a partial unique index cannot express "count < capacity", so the plan should reach for an advisory-lock-free transaction pattern — `SELECT count(*) ... FOR UPDATE` on the activity row (lock the parent row, not a count) before the participant insert, then rely on the transaction's isolation to serialize concurrent joins. Test precedent below.

### `apps/api/src/activity/activity.service.ts` (service, CRUD + capacity race)

**Analog 1 — locale resolution:** `apps/api/src/festival/festival.service.ts:52-87` (`listTags`, read in full above) — copy the LEFT JOIN + `Map<id, {slug, titles}>` accumulation + `resolveLocalized(entry.titles, locale, fest.defaultLocale)` shape verbatim for the effective tag list (D-02/D-05): union of global (`festivalId IS NULL`) tags not opted out in `festival_activity_tag` with `enabled=false`, plus the festival's own tags.

**Analog 2 — transactional write + Postgres error mapping:** `apps/api/src/friendship/friendship.service.ts:83-90` (`postgresErrorOf`, read in full above):

```typescript
function postgresErrorOf(err: unknown): PostgresError | null {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (current instanceof PostgresError) return current;
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}
```

Import this helper (or a shared copy — check whether it should move to a shared util given two modules now need it) and use it exactly as `festival.service.ts:145-156`'s `save()` does for the `23503` FK-violation → `profile-required` (409) mapping, and as the join-race pattern for capacity: catch inside `try/catch` around a `this.db.transaction(...)` block, `postgresErrorOf(err)`, map known codes to a discriminated result (`{ status: 'ok' } | { status: 'full' } | { status: 'not-found' } | { status: 'profile-required' }`), never throw a raw exception for an expected conflict.

### `apps/api/src/activity/activity-projection.ts` (utility, transform — D-12 foreign view)

**Analog:** `apps/api/src/friendship/visitor-projection.ts` (full file, 84 lines, read in full above)

```typescript
export const foreignProfileColumns = {
  accountId: visitorProfile.accountId,
  username: visitorProfile.username,
  displayName: visitorProfile.displayName,
  avatar: visitorProfile.avatar,
  pronoun: visitorProfile.pronoun,
  gender: visitorProfile.gender,
};

export function pickForeignProfile(row: VisitorProfileForeign): VisitorProfileForeign {
  return {
    accountId: row.accountId,
    username: row.username,
    displayName: row.displayName,
    avatar: row.avatar,
    pronoun: row.pronoun,
    gender: row.gender,
  };
}
```

**Apply to the activity participant detail path (D-12):** the participant-detail endpoint MUST import and use these exact exports from `friendship/visitor-projection.ts` — **do not re-declare a second select map or shaping function**. `projection-uniqueness.spec.ts` asserts `export const foreignProfileColumns` and `export function pickForeignProfile` each occur **exactly once** in the whole `apps/api/src` tree (see `apps/api/test/projection-uniqueness.spec.ts:537-549`), and separately asserts the four identity columns (`displayName`, `avatar`, `pronoun`, `gender`) appear together in only `visitor-projection.ts` plus the named owner-projection exception (`me/me.service.ts`). A new `activity-projection.ts` that imports these symbols is safe; a new file that re-lists `displayName`/`avatar`/`pronoun`/`gender` together will trip the existing spec's "nowhere else" check.

### `packages/contracts/src/schemas.ts` + `router.ts` (route, request-response)

**Analog:** `packages/contracts/src/schemas.ts:36-42` (`tagSchema`, being removed) and `router.ts:44-51` (`listTags` route, being removed):

```typescript
// schemas.ts — pattern for the new tag/activity schemas (tagSchema being replaced)
export const tagSchema = z.object({ /* id, slug, title — see file for exact fields */ });
export type Tag = z.infer<typeof tagSchema>;

// router.ts — route shape to copy for list/detail/create/join/leave/delete
listTags: {
  method: 'GET',
  path: '/festivals/:festivalId/tags',
  pathParams: z.object({ festivalId: z.string().uuid() }),
  query: z.object({ locale: localeSchema.optional() }),
  responses: { 200: z.array(tagSchema) },
  summary: 'List a festival’s tags, titles resolved to the requested locale',
},
```

Also mirror `saveFestival`'s gate-less-but-session-scoped shape (`festival.controller.ts:44-56`, `festival.service.ts:131-157`) for join/leave: `params: { festivalId, activityId }`, discriminated `{status}` result mapped to `404`/`409` in the controller, never a client-supplied visitor id.

### `apps/api/src/activity/activity.module.ts` (config)

**Analog:** `apps/api/src/festival/festival.module.ts` (full file, 11 lines):

```typescript
import { Module } from '@nestjs/common';
import { FestivalController } from './festival.controller';
import { FestivalService } from './festival.service';

@Module({
  controllers: [FestivalController],
  providers: [FestivalService],
})
export class FestivalModule {}
```

Copy verbatim with `Activity*` names; register in `apps/api/src/app.module.ts`'s `imports: [ConfigModule, DbModule, AuthModule, FestivalModule, MeModule, FriendshipModule]` (add `ActivityModule` — line 12).

### `apps/api/src/activity/activity.controller.ts` (controller, request-response)

**Analog:** `apps/api/src/festival/festival.controller.ts` (full file, 57 lines, read above) — copy the `@TsRestHandler(contract.X)` + `tsRestHandler(contract.X, async ({ params, query }) => {...})` shape, the `@Session() session: UserSession` injection for scope (never trust a body/query-supplied visitor id), and the discriminated-result-to-HTTP-status mapping (`not-found` → 404, `profile-required`/`full`/creator-leave → 409).

### `apps/api/test/activity-tenant-isolation.spec.ts` (test, SEC-03)

**Analog:** `apps/api/test/festival-isolation.spec.ts` (full file, 223 lines, read above). Copy the fixture shape: two throwaway festivals (A/B) created in `beforeAll`, two visitors via `signInWithOtp`/`createVisitor` helpers (OTP capture-file read pattern), assert visitor-scoped list never leaks the other tenant's id/fields via **serialized body substring check** (`JSON.stringify(res.body)` must not contain the other tenant's id or unique field values) — not just parsed-array checks. **Extra case required by this phase (D-01/D-02):** a dedicated test for the nullable-`festivalId` special case on `activity_tag` — a global tag (`festivalId: null`) must be visible/effective for BOTH festival A and B, while a festival-owned tag (if any exist this phase) must not leak.

### `apps/api/test/activity-capacity-race.spec.ts` (test, concurrency)

**Analog:** `apps/api/test/username-race.spec.ts` (full file, 138 lines, read above) — this is the closest existing precedent for "prove a DB constraint wins a race that app logic alone would lose," but note it is **sequential** (two `completeProfile` calls awaited one after another proving the second correctly loses to the unique index), not truly concurrent. For Erfolgskriterium 2 ("konkurrierende Joins auf den letzten Platz dürfen nicht beide durchgehen"), the new spec needs genuinely **parallel** requests: `await Promise.all([join1, join2])` against an activity with `capacity` set to current-participants + 1, then assert exactly one `{status:'ok'}` and one `{status:'full'}` (or one 200 and one 409 over HTTP via `supertest`, mirroring `festival-isolation.spec.ts`'s `request(app.getHttpServer())` shape). Also test the D-08 null-capacity special case: unlimited joins never return `full`.

## Shared Patterns

### Postgres error → discriminated result mapping
**Source:** `apps/api/src/friendship/friendship.service.ts:83-90` (`postgresErrorOf`) + `apps/api/src/festival/festival.service.ts:131-157` (`save()` usage)
**Apply to:** `activity.service.ts` join/leave/create — `23503` (FK violation, e.g. no visitor_profile) → `profile-required` (409); a capacity-exceeded condition (however encoded — check constraint, trigger, or transaction-level count) → `full` (409); never let a Postgres error surface as an unhandled 500 for an expected conflict.

### Locale resolution (D-02)
**Source:** `apps/api/src/festival/festival.service.ts:52-87` (`listTags`) + `packages/contracts/src/locale.ts:24-30` (`resolveLocalized`)
**Apply to:** effective tag list endpoint — LEFT JOIN translation table, accumulate per-id `LocalizedText` map, resolve with `resolveLocalized(titles, requested ?? fest.defaultLocale, fest.defaultLocale)`.

### Scope from session, never from params/query
**Source:** `apps/api/src/festival/festival.controller.ts:44-56` (`saveFestival`, `@Session() session: UserSession`, `session.user.id`)
**Apply to:** every activity controller handler that writes (create/join/leave/delete) — `visitorId`/`creatorId` always come from `session.user.id`; `festivalId`/`activityId` come from the path, never a body field (`.planning/codebase/ARCHITECTURE.md` §Anti-Patterns "Client-Supplied Scope").

### drizzle-zod `.extend()` workaround for `text()` columns
**Source:** `packages/db/src/schema/visitor-profile.ts:72-159` (full comment + `.extend()` blocks, read above)
**Apply to:** every new `text()` column in `activity.ts` (`title`, `subtitle`, `description`, `location`) — without an `.extend()` override, drizzle-zod's TS inference collapses these to `unknown`. Copy the pattern: `createInsertSchema(activity).extend({ title: z.string()..., subtitle: z.string().nullable().optional(), ... })`, keeping insert/select schemas separately as `visitor-profile.ts` does (insert = strict caps, select = loose for legacy-row safety).

### Foreign-view projection singleton (D-12/VIS-02)
**Source:** `apps/api/src/friendship/visitor-projection.ts` (`foreignProfileColumns`, `pickForeignProfile`) + `apps/api/test/projection-uniqueness.spec.ts`
**Apply to:** activity participant detail listing — import and reuse these exact exports; do not create a second select map/shaping function. Extend `projection-uniqueness.spec.ts`'s scan (or add an activity-specific assertion) if the new endpoint's route key needs to be added to the contract-walk exception lists.

### Idempotent seed insertion
**Source:** `packages/db/scripts/seed.ts` (full file, 83 lines, read above) — `onConflictDoUpdate`/`onConflictDoNothing()` keyed on unique constraints, wrapped in a `try/finally` that calls `db.$client.end()`.
**Apply to:** planting the ~10 global `activity_tag` + `activity_tag_translation` rows (D-06) — add a second loop after (or interleaved with) `SEED_FESTIVALS`, upserting on `activity_tag.slug` (global tags, `festivalId: null`) and `onConflictDoNothing()` on the translation composite PK.

## No Analog Found

None — every file in scope has at least a role-match analog in the existing codebase.

## Metadata

**Analog search scope:** `packages/db/src/schema/`, `packages/contracts/src/`, `apps/api/src/{festival,friendship,me}/`, `apps/api/test/`
**Files scanned (read in full):** `my-festival.ts`, `tag.ts`, `festival.service.ts`, `festival.controller.ts`, `festival.module.ts`, `username-race.spec.ts`, `festival-isolation.spec.ts`, `projection-uniqueness.spec.ts`, `friendship.service.ts` (partial, 60-170), `friendship/visitor-projection.ts`, `visitor-profile.ts`, `packages/db/scripts/seed.ts`, `packages/contracts/src/locale.ts`, `packages/contracts/src/router.ts` (partial), `app.module.ts` (grep)
**Pattern extraction date:** 2026-08-14
