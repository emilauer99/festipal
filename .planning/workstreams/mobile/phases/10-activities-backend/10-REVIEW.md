---
phase: 10-activities-backend
reviewed: 2026-08-15T00:34:19Z
depth: deep
files_reviewed: 28
files_reviewed_list:
  - apps/api/src/activity/activity.controller.ts
  - apps/api/src/activity/activity.module.ts
  - apps/api/src/activity/activity.service.ts
  - apps/api/src/app.module.ts
  - apps/api/src/db/postgres-error.ts
  - apps/api/src/festival/festival.controller.ts
  - apps/api/src/festival/festival.service.ts
  - apps/api/src/friendship/friendship.service.ts
  - apps/api/test/activity-capacity-db.spec.ts
  - apps/api/test/activity-create.spec.ts
  - apps/api/test/activity-discovery.spec.ts
  - apps/api/test/activity-join-leave.spec.ts
  - apps/api/test/activity-tags.spec.ts
  - apps/api/test/activity-tenant-isolation.spec.ts
  - apps/api/test/activity-tenant-structure.spec.ts
  - apps/api/test/auth-guard.spec.ts
  - packages/contracts/src/router.ts
  - packages/contracts/src/schemas.ts
  - packages/db/drizzle/0007_milky_exiles.sql
  - packages/db/drizzle/0008_smooth_mantis.sql
  - packages/db/drizzle/0009_nostalgic_stick.sql
  - packages/db/drizzle/0010_activity_capacity_guard.sql
  - packages/db/drizzle/meta/_journal.json
  - packages/db/scripts/seed.ts
  - packages/db/src/schema/activity-participant.ts
  - packages/db/src/schema/activity-tag.ts
  - packages/db/src/schema/activity.ts
  - packages/db/src/schema/index.ts
findings:
  critical: 0
  warning: 6
  info: 8
  total: 14
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-08-15T00:34:19Z
**Depth:** deep
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Deep review of the activities backend slice: contract routes, ActivityService (tags,
create, join/leave/delete, discovery/detail), DB schema + migrations 0007–0010 (including
the capacity trigger), the shared `postgresErrorOf` walker, and the seven test suites.

Cross-file analysis performed: contract ↔ controller ↔ service status-union mapping
(all eight routes match their declared response sets exhaustively), schema source ↔
generated SQL migrations (0008/0009 faithfully reproduce `activity-tag.ts` /
`activity.ts` / `activity-participant.ts`, including both partial unique indexes, all
four CHECKs, the `(id, festival_id)` unique target and the composite participant FK;
journal entries 7–10 are consistent and monotonic), import graph (no stale references
to the removed `tag`/`tag_translation` tables or the removed `listTags` route anywhere
in TS source), and the VIS-02 projection rule (activity detail reuses
`foreignProfileColumns`/`pickForeignProfile` from the friendship module — no second
projection introduced).

The load-bearing security properties hold up under adversarial reading:

- **Tenant isolation:** every read/write on `activity`/`activity_participant` carries
  `festivalId` in the WHERE or join condition; the composite FK
  `activity_participant_activity_fk` makes a festival-mismatched participant row
  unwritable even under races; the nullable-`festivalId` exception on `activity_tag`
  is correctly bounded by `effectiveTagWhere` (a foreign festival's own tag can never
  satisfy `isNull OR eq(festivalId)` for another tenant, and a hostile
  `festival_activity_tag` row for a foreign tag has no effect). `isTagEffective`
  reuses the exact predicate `listEffectiveTags` exposes, so no existence oracle
  opens between the two.
- **Capacity race:** the 0010 trigger's `SELECT ... FOR UPDATE` on the parent
  activity row correctly serializes concurrent joins; leave-vs-join interleavings can
  only under-fill, never over-fill; the already-participant branch preserves join
  idempotency at a full activity; the creator-seat insert inside `create()`'s
  transaction can never trip it (count 0 < cap ≥ 1). The trigger raises
  `23514`/`activity_capacity_full_chk`, distinguishable by name from
  `activity_capacity_positive_chk` as planned.
- **Client-supplied scope:** `creatorId`/`visitorId` come only from the session,
  `festivalId`/`activityId` only from the path; test 9 of `activity-create.spec.ts`
  and the structural contract walk both pin this.

What did not hold up is the error-classification discipline the friendship module
itself established (its WR-02), plus a handful of contract-boundary edge cases and
test-coverage gaps — detailed below. Nothing found rises to a security vulnerability
or data-loss risk.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `join()`/`create()` collapse all 23503 FK violations into `profile-required`, misclassifying delete races as "Visitor profile required"

**File:** `apps/api/src/activity/activity.service.ts:373` (join), `apps/api/src/activity/activity.service.ts:314` (create)
**Issue:** Three distinct FKs can raise 23503 on the participant insert in `join()`:
`activity_participant_visitor_id_visitor_profile_account_id_fk` (caller has no profile
→ 409 profile-required is correct) and `activity_participant_activity_fk` (the
activity was dissolved between the existence SELECT and the INSERT → the correct
answer is the 404 `not-found` branch). The code checks only `cause?.code === '23503'`
without discriminating `constraint_name`, so a fully-profiled visitor who joins an
activity the creator dissolves concurrently receives 409 "Visitor profile required" —
an actively wrong instruction. `create()` has the same collapse across three FKs:
`activity_creator_id_...` (profile-required, correct), `activity_festival_id_...`
(festival deleted mid-flight → should be `festival-not-found`), and
`activity_tag_id_activity_tag_id_fk` (an unused tag deleted between `isTagEffective`
and the insert → should be `tag-not-found`). This is exactly the pattern
`friendship.service.ts` documents at length as its WR-02 lesson ("collapsing them
onto one answer told a caller who demonstrably HAS a profile to complete their
visitor profile") and fixes via `foreignKeyOutcome()` — the newer module regressed to
the pre-lesson idiom.
**Fix:** Discriminate by `constraint_name`, same as the 23514 branch already does:
```ts
// join()
if (cause?.code === '23503') {
  if (cause.constraint_name === 'activity_participant_activity_fk') {
    return { status: 'not-found' }; // activity dissolved mid-flight
  }
  return { status: 'profile-required' };
}
// create()
if (cause?.code === '23503') {
  if (cause.constraint_name === 'activity_festival_id_festival_id_fk')
    return { status: 'festival-not-found' };
  if (cause.constraint_name === 'activity_tag_id_activity_tag_id_fk')
    return { status: 'tag-not-found' };
  return { status: 'profile-required' };
}
```

### WR-02: `createActivityBodySchema.startTime` rejects ISO strings with a UTC offset

**File:** `packages/contracts/src/schemas.ts:119`
**Issue:** `z.string().datetime()` in Zod 3.x accepts only `Z`-suffixed UTC strings —
`2026-08-15T20:00:00+02:00` is a 400. Every client in the app's home market runs
UTC+1/+2; any date-picker or serializer that emits a local-offset ISO string (a
perfectly valid RFC 3339 timestamp that `new Date(...)` on the server would parse
correctly) is rejected at the contract boundary. `Date.prototype.toISOString()`
happens to emit `Z`, so a JS client that uses it works — but the contract is the
cross-client source of truth (ADR-006) and silently narrows "ISO datetime" to
"UTC-only ISO datetime" without documenting it.
**Fix:** `startTime: z.string().datetime({ offset: true })` — `new Date(body.startTime)`
in `create()` already handles offsets correctly, so no server change is needed. If
UTC-only is intended, document it in the route summary so Phase 11 builds the picker
accordingly.

### WR-03: A whitespace-only `title` alongside a `tagId` passes validation and produces a blank display title

**File:** `packages/contracts/src/schemas.ts:122`, `apps/api/src/activity/activity.service.ts:230,506`
**Issue:** The `.refine` only enforces `title.trim().length > 0` when `tagId` is
absent. `{ tagId: <valid>, title: '   ' }` passes the contract (tagId short-circuits
the refine), passes `activity_title_or_tag_chk` (title is not null), and is stored
as-is. The ADR-017 auto-title resolution `row.title ?? tag?.title ?? ''` then lets
the whitespace title WIN over the tag title, so the wire `title` is `'   '` — a
visually blank activity in every list, defeating the auto-title rule the CHECK
exists to guarantee.
**Fix:** Normalize at the service boundary before insert so a blank title falls back
to the tag:
```ts
const trimmedTitle = body.title?.trim() || null;
// ...values({ title: trimmedTitle, ... })
```
(or extend the `.refine`/add a `.transform` so a whitespace-only `title` is rejected
or coerced to `null` whenever `tagId` is set).

### WR-04: `create()` accepts a `startTime` in the past, producing a born-dead activity

**File:** `apps/api/src/activity/activity.service.ts:259-327`, `packages/contracts/src/schemas.ts:119`
**Issue:** Neither the contract nor the service constrains `startTime` relative to
now. An activity created with a past `startTime` (a timezone slip or client bug, cf.
WR-02) is immediately: absent from public discovery (`gt(startTime, now())`),
unjoinable by anyone (`now() >= startTime` → 409 started), and visible only in the
creator's own `my-activities`. No phase decision (D-07…D-12) states this is allowed,
no test covers it via the API, and the resulting state is indistinguishable from a
silent failure for the creator ("I created it, nobody can find or join it"). The
capacity/geo/title cases all got explicit contract-level pre-emption of degenerate
inputs; this one did not.
**Fix:** Either reject it at the service (`if (new Date(body.startTime) <= new Date())
return { status: 'invalid' };` — the 409 branch already exists) or record the
deliberate decision to allow retro-dated activities in the route summary so Phase 11
knows to guard the picker.

### WR-05: `auth-guard.spec.ts` covers only 1 of the 8 new activity routes

**File:** `apps/api/test/auth-guard.spec.ts:75-80`
**Issue:** The spec's own doctrine is "comprehensive… over the WHOLE `/api/v1`
endpoint set" and "no untagged endpoint" (its comment at line 67-70 even adds two
festival routes on exactly that argument). Phase 10 added eight routes
(`listActivityTags`, `createActivity`, `joinActivity`, `leaveActivity`,
`deleteActivity`, `listActivities`, `listMyActivities`, `getActivity`) but only
`GET .../activity-tags` was added to the 401 matrix. All eight do inherit the global
AuthGuard today, but the spec exists precisely so a future `@AllowAnonymous()` or
guard-registration regression on any of them fails loudly — for seven of the eight,
including every write path (create/join/leave/delete), it currently would not.
**Fix:** Add the seven missing anonymous-401 cases, e.g.:
```ts
it('POST /api/v1/festivals/:festivalId/activities', async () => {
  const res = await request(app.getHttpServer())
    .post(`/api/v1/festivals/${randomUUID()}/activities`)
    .send({ title: 'anon', startTime: new Date().toISOString() });
  expect(res.status).toBe(401);
});
// ...and join/leave/delete/list/my-activities/detail equivalents
```

### WR-06: Seed re-runs never refresh tag titles, contradicting the documented "no-op/refresh" semantics

**File:** `packages/db/scripts/seed.ts:121-127`
**Issue:** The header comment sells the seed as "re-runnable as a no-op/refresh" and
the tag-list comment says "the user reviews this exact list in the plan and can amend
it here." Festivals genuinely refresh (`onConflictDoUpdate` on all fields), but
`activity_tag_translation` uses `onConflictDoNothing` — so amending a DE/EN title in
`SEED_ACTIVITY_TAGS` and re-running the seed silently changes nothing on any
existing database (dev, staging, or the seeded Neon instance). The one thing the
comment invites the user to edit is the one thing a re-run won't apply.
**Fix:** Mirror the festival upsert:
```ts
await db
  .insert(activityTagTranslation)
  .values([...])
  .onConflictDoUpdate({
    target: [activityTagTranslation.tagId, activityTagTranslation.locale],
    set: { title: sql`excluded.title` },
  });
```

## Info

### IN-01: `join()`'s started-check is a TOCTOU read, not enforced at write time

**File:** `apps/api/src/activity/activity.service.ts:346-362`
**Issue:** `started` is computed by the database (good), but in a SELECT separate
from the INSERT — a join whose SELECT lands microseconds before `startTime` inserts
after it. Unlike capacity (trigger-enforced), started-ness has no write-time guard.
Window is milliseconds and the effect (one extra participant in a just-started
activity) is harmless; noted so the asymmetry with the capacity guard is a recorded
decision rather than an oversight.
**Fix:** Accept as-is, or fold the condition into the trigger later if D-10 ever
becomes a hard invariant.

### IN-02: A tag with zero translation rows resolves to an empty-string title

**File:** `packages/db/src/schema/activity-tag.ts:75-85`, `packages/contracts/src/locale.ts:29`
**Issue:** Nothing requires an `activity_tag` to have at least one
`activity_tag_translation` row. `resolveLocalized({}, ...)` returns `''`, so a
translation-less tag renders as an empty chip in the tag list, and an activity
auto-titled from it gets `title: ''`. Unreachable via current seed/API (no tag-create
endpoint yet), but the admin workstream will add one — worth an invariant then.
**Fix:** When the admin tag CRUD lands, require the festival-default-locale
translation at creation time (service-level check).

### IN-03: `festival.service.save` still uses the depth-1 `err.cause` idiom instead of `postgresErrorOf`

**File:** `apps/api/src/festival/festival.service.ts:101-105`
**Issue:** `postgres-error.ts` was extracted (10-02) precisely because the depth-1
read "silently degrades a known conflict into a 500 if a driver or ORM upgrade adds
a layer." `save()` is a bare statement so depth-1 works today, but it is now the
last remaining copy of the fragile idiom outside `me.service.ts`.
**Fix:** `const cause = postgresErrorOf(err); if (cause?.code === '23503') ...` — one-line swap.

### IN-04: Migration 0007 drops `tag`/`tag_translation` with CASCADE and no data carry-over

**File:** `packages/db/drizzle/0007_milky_exiles.sql:1-2`
**Issue:** Any rows in the scaffold tables (and any dependent objects, via CASCADE)
are destroyed irreversibly; the replacement catalog is only repopulated by re-running
the seed. Deliberate per D-01 and fine for the current dev/staging posture, but the
migration is a one-way door on every environment it runs against — the Neon instance
must be re-seeded after deploy or `activity-tags` responses are empty.
**Fix:** None required; ensure the deploy runbook pairs `migrate` with `db:seed`.

### IN-05: `activity-create.spec.ts` tests 4/5 are order-coupled through shared mutable state

**File:** `apps/api/test/activity-create.spec.ts:284, 260-297`
**Issue:** Test 5 depends on test 4 having disabled `globalTagId` and on
`createdActivityIds[1]` being the activity from test 2; test 5 also re-enables the
tag "for the remaining tests." A future `.only`, reorder, or shard breaks them in
confusing ways. Vitest runs a file's cases sequentially today, so this is latent,
not live.
**Fix:** Give test 5 its own disable/enable bracket and resolve the earlier activity
id by title instead of positional index.

### IN-06: The capacity trigger guards INSERT only — capacity UPDATE and participant re-pointing are unguarded

**File:** `packages/db/drizzle/0010_activity_capacity_guard.sql:52-53`
**Issue:** `BEFORE INSERT` only. An `UPDATE activity SET capacity = 1` on a fuller
activity, or an `UPDATE activity_participant SET activity_id = ...`, would bypass the
guard. No such write path exists in v1 (no capacity-edit endpoint, participant rows
are insert/delete only), so this is a schema-level note for the admin workstream, not
a live hole.
**Fix:** When an activity-edit endpoint lands, extend the trigger to
`BEFORE INSERT OR UPDATE OF activity_id ON activity_participant` and add a
capacity-shrink check on `activity`.

### IN-07: No per-creator limit on activity creation

**File:** `apps/api/src/activity/activity.service.ts:259`
**Issue:** A signed-in visitor with a profile can create unbounded activities in any
festival (the save-gate does not apply; ADR-014). Combined with unbounded
description text (2000 chars each), this is the phase's cheapest spam/flood vector.
The friendship module documented its equivalent decision (D-11/D-13 "no limit, no
cooldown") explicitly; this one is undocumented.
**Fix:** None required for v1; record the decision, and note it as a rate-limiting
candidate alongside the OTP limiter.

### IN-08: `activity-tags.spec.ts` hardcodes exactly 10 global seed tags

**File:** `apps/api/test/activity-tags.spec.ts:230, 277, 337`
**Issue:** `toHaveLength(12)`/`toHaveLength(10)` couples the spec to both the seed
list's size and the cleanliness of the shared dev database (any stray global tag from
an aborted run fails it). The coupling to the seed is deliberate and commented
("breaks loudly"); the coupling to DB pollution is a known suite-wide issue
(test-DB pollution is already on the project's open list).
**Fix:** Acceptable as-is; if flakes appear, assert the 10 seeded slugs as a subset
plus "own tags present / foreign tags absent" instead of exact counts.

---

_Reviewed: 2026-08-15T00:34:19Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
