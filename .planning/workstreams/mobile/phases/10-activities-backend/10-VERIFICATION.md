---
phase: 10-activities-backend
verified: 2026-08-15T00:45:00Z
status: passed
score: 41/41 must-haves verified
behavior_unverified: 0
overrides_applied: 0
prohibitions:
  flagged: 3
  note: >
    All three phase prohibitions are judgment-tier (no `verification: test` field in the
    PLAN frontmatter). Autonomous verify records NON-AUTHORITATIVE LLM-judge verdicts
    (all three: pass, with evidence) plus the mandatory unverified-prohibition flag —
    human review recommended, never a silent pass. Two of the three carry wired
    deterministic enforcement (specs executed green in this verification run).
human_verification:

  - test: >
      Prohibition P1 (10-01): "No activity or tag endpoint accepts the acting visitor's
      identity from a request body, query parameter or path segment — caller from the
      better-auth session only, festivalId from the path only." Review the contract walk
      in apps/api/test/activity-tenant-structure.spec.ts Part 2 and confirm the forbidden
      key set matches your intent.
    expected: >
      All 8 activity-shaped routes take the actor exclusively from the session; the
      forbidden-key walk (visitorId/creatorId/callerId/accountId/userId/participantId/
      festivalId/activityId/sessionId in body/query) stays the standing gate for later phases.
    why_human: >
      Judgment-tier prohibition — mechanically enforced by activity-tenant-structure.spec.ts
      Part 2 (ran green, 8 routes walked, non-vacuum guard >= 7) and activity-create.spec.ts
      case 9, but per policy a flagged prohibition is never silently absorbed into a passed
      verdict. LLM-judge verdict: PASS (non-authoritative).

  - test: >
      Prohibition P2 (10-01): "No presence, location-watch or 'who is here' signal is
      derived from activity or tag data — ADR-014 excludes it; the ADR-017 §2 geo point
      stays a one-off opt-in capture." Skim the activity contract surface
      (packages/contracts/src/router.ts activity routes) and the geo columns on
      packages/db/src/schema/activity.ts.
    expected: >
      No endpoint reports who is currently where; `joined` is a declaration of intent, not
      presence; `geoLat`/`geoLng` are a single nullable pair on the activity row (pair +
      range CHECKs), with no time series, watcher, or update endpoint.
    why_human: >
      Judgment-tier prohibition with no mechanical test possible — "is this a presence
      signal?" is a semantic call. Codebase evidence: grep over apps/api/src/activity and
      the contracts found zero presence/watch/geolocation code paths; geo is written once
      at create and never updated. LLM-judge verdict: PASS (non-authoritative).

  - test: >
      Prohibition P3 (10-04): "The participant payload never carries a field outside the
      six-key foreign view — no birthDate, no e-mail, no my_festival value, no second
      projection inside the activity module." Confirm the projection-uniqueness gate covers
      the new `activityParticipantSchema` embedding to your satisfaction.
    expected: >
      Detail participants are exactly { profile: <six keys>, joinedAt }; the six-field set
      is asserted by key EQUALITY (not subset) and serialized-body absence of
      birthDate/e-mail.
    why_human: >
      Judgment-tier prohibition — mechanically enforced by projection-uniqueness.spec.ts
      (exactly one foreign-view select map/shaping function in apps/api/src; ran green) and
      activity-discovery.spec.ts case 4 (sorted-key equality with the six-field list; ran
      green), but flagged per the no-silent-pass rule. LLM-judge verdict: PASS
      (non-authoritative).
---

# Phase 10: Activities Backend — Verification Report

**Phase Goal:** The API models activities, their tags and their attendees — festival-scoped, capacity-enforced, and provably isolated between festivals
**Verified:** 2026-08-15 (initial verification, no previous VERIFICATION.md)
**Status:** human_needed (all 41 must-haves VERIFIED; 3 judgment-tier prohibitions flagged for human review — none failing)
**Re-verification:** No — initial verification

Evidence discipline: SUMMARY claims were not trusted. Every artifact was read in source; all 7
new spec files plus `projection-uniqueness.spec.ts` were executed by the verifier's own process
against the live local Docker Postgres (78/78 tests green in three targeted runs — never the
full suite per run policy).

## Goal Achievement

### Observable Truths — ROADMAP Success Criteria (the contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | Every new festival-scoped table carries `festivalId`, every query filters on it; a cross-tenant test proves B's activities never appear in A's context | ✓ VERIFIED | `activity-tenant-structure.spec.ts` (6/6, run by verifier): `information_schema` proves NOT NULL `festival_id` on `activity`/`activity_participant`/`festival_activity_tag`, `activity_tag` explicitly nullable, `activity_tag_translation` FK-scoped; composite FK `activity_participant_activity_fk` real on the live DB with exactly (activity_id, festival_id). `activity-tenant-isolation.spec.ts` (12/12, run by verifier): serialized-body absence + non-vacuum gegenprobe per table, one describe block per table. Service source: every `activity` read/write WHERE carries `festivalId` (activity.service.ts:353, 395, 421, 426, 554, 586, 627, 639) |
| SC2 | Capacity enforced at DB level — concurrent joins on the last seat cannot both succeed | ✓ VERIFIED | Migration `0010_activity_capacity_guard.sql`: BEFORE INSERT trigger with `SELECT ... FOR UPDATE` on the parent row, already-participant branch, `capacity IS NULL` branch, RAISE 23514/`activity_capacity_full_chk`. `activity-capacity-db.spec.ts` (4/4, run by verifier) incl. the 10-round two-connection last-seat race; `activity-join-leave.spec.ts` case 2 (5-round HTTP race, run green). Service `join()` deliberately does NOT re-check capacity (activity.service.ts:340-344) — the decision sits in the DB |
| SC3 | Effective tag list = enabled-global ∪ festival-own; a per-festival disable never affects another festival | ✓ VERIFIED | `effectiveTagWhere()` (activity.service.ts:154-159) — both scope conditions in SQL WHERE; `activity-tags.spec.ts` (7/7, run by verifier) cases 1/5/6; `activity-tenant-isolation.spec.ts` `festival_activity_tag` block: disable in A leaves B unchanged AND the tag genuinely disappears from A |
| SC4 | Creator is an attendee from creation; the invariant cannot be violated by leaving | ✓ VERIFIED | `create()` writes activity + creator participant row in ONE `db.transaction` (activity.service.ts:279-307); `activity-create.spec.ts` case 1 asserts the stored participant row (run green); `leave()` returns `creator` → 409 with the row untouched (activity.service.ts:398); `activity-join-leave.spec.ts` case 7 proves it at the DB row (run green) |

**Roadmap score:** 4/4 Success Criteria verified, all with behavioral evidence executed in this run.

### Observable Truths — PLAN must_haves (37, grouped per plan)

**10-01 (7/7 VERIFIED)** — `activity-tags.spec.ts` 7/7 run green by verifier:
effective list with locale resolution + defaultLocale fallback (cases 1-2); nullable-festivalId
exception (global effective everywhere, festival-own only inside its festival — case 4,
serialized body); same-slug adjacency = two entries via the two partial unique indexes in
`0008_smooth_mantis.sql` lines 29-30 (case 3); absent row = enabled, empty = 200 `[]` (case 6);
per-festival disable isolated + reversible (case 5); total slug-ASC/id-ASC order (case 7);
scaffold `tag`/`tag_translation`/`tagSchema`/`listTags` fully gone — `packages/db/src/schema/tag.ts`
does not exist, zero code references remain (only explanatory comments), `0007_milky_exiles.sql`
is pure DROP.

**10-02 (8/8 VERIFIED)** — `activity-create.spec.ts` 9/9 run green by verifier:
creator-in-same-transaction (case 1); title-or-tag at contract `.refine`
(schemas.ts:122) AND DB CHECK `activity_title_or_tag_chk` (0009 line 17, case 3); auto-title
resolution + disabled-tag-keeps-title via `loadActivityView` joining the tag directly by id
(activity.service.ts:193-247, cases 2/5); foreign and disabled tag → identical 404 body
(case 4, bodies compared); no creator/festival key in `createActivityBodySchema`, client-supplied
scope ignored (case 9, stored-row assertion); composite FK makes a cross-tenant participant row
inexpressible (0009 line 35 + structure spec against live DB); capacity null/≥1 at contract and
`activity_capacity_positive_chk` (case 7); geo all-or-nothing via `activity_geo_pair_chk`/
`activity_geo_range_chk` (case 8).

**10-03 (8/8 VERIFIED)** — `activity-capacity-db.spec.ts` 4/4 + `activity-join-leave.spec.ts`
10/10 run green by verifier: trigger-based enforcement with FOR UPDATE (0010 SQL read + DB spec
case 1); concurrent last-seat race exactly-one-wins over 10 DB rounds + 5 HTTP rounds (DB case 3,
HTTP case 2); `capacity IS NULL` unlimited (DB case 2, HTTP case 3); re-join at full activity
idempotent — the trigger's already-participant branch (0010 lines with EXISTS check, DB case 4,
HTTP case 1); creator-leave 409 with surviving row (HTTP case 7); leave evidence-free — identical
200 bodies across real/repeat/nonexistent (HTTP case 8); delete creator-only with cascade, 404
unknown, 409 non-creator (HTTP case 9); started activity refuses join via server-side
`now() >= start_time` (activity.service.ts:350, HTTP case 4).

**10-04 (8/8 VERIFIED, incl. the backstop truth)** — `activity-discovery.spec.ts` 9/9 +
`projection-uniqueness.spec.ts` run green by verifier: public list startTime cutoff in SQL
(`gt(activity.startTime, sql\`now()\`)`, activity.service.ts:554, case 1); `my-activities` without
cutoff via innerJoin on the caller's own participant row (activity.service.ts:582-586, case 2);
list carries `participantCount`+`joined` as correlated bound-parameter subqueries, never names
(activity.service.ts:453-454, case 3 serialized-body absence); detail embeds
`{ profile: visitorProfileForeignSchema, joinedAt }` via imported `foreignProfileColumns`/
`pickForeignProfile` — no `activity-projection.ts` exists (directory listing verified), key
EQUALITY with the six-field list (case 4); disabled tag stays on existing activities in list and
detail (case 5); empty/unknown festival → 200 `[]`, unknown activity → 404 (case 6);
**backstop truth** "startTime tie → id-ASC run-stable order": explicit evidence exists —
`orderBy(asc(activity.startTime), asc(activity.id))` (activity.service.ts:555) + case 7 repeats
the call and compares id sequences → confirmed, no abstention needed; cross-tenant list/detail
isolation (case 8).

**10-05 (6/6 VERIFIED)** — both proof specs run green by verifier: serialized-body cross-tenant
proof per table with non-vacuum gegenprobe (isolation spec 12/12, one describe block per table
incl. write paths); nullable-exception as its own three-case block (a/b/c); `information_schema`
tenant-column assertion with the two named exceptions; composite FK proven on the live DB;
contract walk over ≥7 routes (8 found) against the forbidden-key set; SEC-03 marked `[x]` in
REQUIREMENTS.md line 54 with the traceability row (line 99) naming both spec files.

**Score:** 41/41 truths verified (4 SC + 37 plan truths; several plan truths restate an SC — the
SC wording was kept as the contract). 0 present-behavior-unverified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/db/src/schema/activity-tag.ts` | 3 tables + partial unique indexes + drizzle-zod schemas | ✓ VERIFIED | 128 lines; exports `activityTag`/`activityTagTranslation`/`festivalActivityTag` + insert/select schemas; both partial indexes with WHERE clauses |
| `packages/db/src/schema/activity.ts` | activity table, 4 CHECKs, UNIQUE(id,festivalId), index | ✓ VERIFIED | 115 lines; all four named CHECKs + `activity_id_festival_unq` + `activity_festival_start_idx` present |
| `packages/db/src/schema/activity-participant.ts` | join table + composite tenant FK | ✓ VERIFIED | 49 lines; `activity_participant_pk` + `activity_participant_activity_fk` on (activityId, festivalId) |
| `packages/db/drizzle/0007/0008/0009/0010` | drop, create, activity tables, trigger | ✓ VERIFIED | 0007 pure DROP; 0008 creates + both partial indexes; 0009 all constraints incl. composite FK; 0010 plpgsql guard + trigger, breakpoint outside `$$` body. All APPLIED — proven by the structure spec's live `information_schema` queries and the firing trigger |
| `apps/api/src/activity/*.ts` (module/controller/service) | full ActivityModule, 8 ts-rest handlers | ✓ VERIFIED | Service 650 lines, all 8 methods substantive; controller wires all 8 contract routes, actor always `session.user.id`; `ActivityModule` registered in `app.module.ts:20` |
| `apps/api/src/db/postgres-error.ts` | shared cause-chain walker | ✓ VERIFIED | Defined once; `friendship.service.ts` imports it (3 usages), no local re-definition |
| `packages/db/scripts/seed.ts` | idempotent 10-tag global catalog DE+EN | ✓ VERIFIED | `onConflictDoUpdate` with `targetWhere` against the partial index; wired to `activityTag`/`activityTagTranslation` |
| `packages/contracts` (schemas + router) | 8 routes, composed schemas, no scaffold residue | ✓ VERIFIED | `activitySchema` composed on `activitySelectSchema.pick(...)`; no `createdAt`/`updatedAt` picked; `activityParticipantSchema.profile` IS `visitorProfileForeignSchema`; `tagSchema`/`listTags` gone (comments only) |
| 7 test spec files | behavioral + structural proofs | ✓ VERIFIED | All exist (211–494 lines each), all 7 executed green by the verifier |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| activity.service.ts | schema/activity-tag.ts | LEFT JOIN festivalActivityTag + translation | ✓ WIRED | service lines 109-116 |
| activity.service.ts | contracts/locale.ts | `resolveLocalized(..., requested ?? defaultLocale, defaultLocale)` | ✓ WIRED | lines 139, 222, 500 |
| app.module.ts | activity.module.ts | imports array | ✓ WIRED | lines 3, 20 |
| activity.service.ts | schema/activity-participant.ts | one `db.transaction` writing activity + creator row | ✓ WIRED | lines 279-307 |
| activity.service.ts | db/postgres-error.ts | `postgresErrorOf` discriminating 23503/23514 by `constraint_name` | ✓ WIRED | lines 310, 364-373 |
| contracts/schemas.ts | schema/activity.ts | `activitySelectSchema.pick(...)` composition | ✓ WIRED | schemas.ts:81 |
| drizzle/0010 | schema/activity-participant.ts | BEFORE INSERT trigger reading capacity FOR UPDATE | ✓ WIRED | trigger exists on live DB (spec assertions on 23514/`activity_capacity_full_chk` only the trigger raises — fired in this run) |
| activity.service.ts | friendship/visitor-projection.ts | imports `foreignProfileColumns`/`pickForeignProfile`/`toIsoString` — no second projection | ✓ WIRED | line 27; no `activity-projection.ts`; projection-uniqueness green |
| tenant-structure.spec | contracts/router.ts + live DB | contract walk + information_schema | ✓ WIRED | executed green in this run |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| listActivityTags response | tags | Drizzle query over `activity_tag` ∪ joins | Yes (live GET proven in specs) | ✓ FLOWING |
| createActivity response | activity | `.returning()` + `loadActivityView` re-read | Yes | ✓ FLOWING |
| discovery/detail responses | summaries/participants | correlated subqueries + inArray translations + foreign projection | Yes | ✓ FLOWING |
| Seed catalog | 10 global tags | `db:seed` upsert; tag specs consume the seeded rows | Yes (specs assert the 10 globals) | ✓ FLOWING |

### Behavioral Spot-Checks (executed by verifier)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| SEC-03 structure + capacity race | `vitest run activity-tenant-structure activity-capacity-db` | 10/10 passed (5.3s) | ✓ PASS |
| Tenant isolation + membership + create | `vitest run activity-tenant-isolation activity-join-leave activity-create` | 31/31 passed (8.7s) | ✓ PASS |
| Tag list + discovery + VIS-02 gate | `vitest run activity-tags activity-discovery projection-uniqueness` | 37/37 passed (7.5s) | ✓ PASS |
| Docker Postgres reachable | `docker compose ps` | quiks-postgres-1 running | ✓ PASS |
| All 15 task commits exist | `git cat-file -t <15 hashes>` | 15/15 = commit | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes exist or are declared for this phase — SKIPPED (the
vitest specs above are the phase's declared verification mechanism and were executed directly).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-03 | 10-01…10-05 (all five plans declare it) | Every new festival-scoped table is `festivalId`-isolated, each with its own cross-tenant test | ✓ SATISFIED | `activity-tenant-isolation.spec.ts` (12/12) + `activity-tenant-structure.spec.ts` (6/6), both executed green; REQUIREMENTS.md §Security `[x]` + traceability row names both specs. Note: the requirement text also names `activity_message` — that table belongs to Phase 12 (chat) and does not exist yet; the structural spec's exception-list design will catch it when it lands without a tenant column |

No orphaned requirements: REQUIREMENTS.md maps only SEC-03 to Phase 10 (ACT-01…06 → Phase 11, CHAT → Phase 12).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TBD/FIXME/XXX/TODO/HACK/placeholder markers in any phase-modified source or test file | — | — |

Advisory context from 10-REVIEW.md (deep, 28 files): 0 critical, 6 warnings, 8 info. The
verifier independently confirmed the review's headline (WR-01: `join()`/`create()` collapse all
23503 FK violations into `profile-required` without discriminating `constraint_name` —
activity.service.ts:314, 373). This is a real error-classification quality gap in a
delete-race edge case, but it does not violate any must-have truth, prohibition, or tenant/
capacity invariant — it mislabels a 404-worthy race as a 409. Non-blocking for goal achievement;
should be picked up from the review backlog.

### Human Verification Required

Three judgment-tier prohibitions, flagged per the no-silent-pass rule (full detail in
frontmatter). All three carry non-authoritative PASS verdicts; P1 and P3 have wired mechanical
enforcement executed green in this run; only P2 ("no presence signal from activity data") rests
on semantic judgment backed by a clean grep.

1. **P1 — Kein client-gesetzter Actor/Scope** — bestätige, dass die Verbotsliste des Contract-Walks der Intention entspricht. (Mechanisch erzwungen, grün.)
2. **P2 — Kein Präsenz-/Ortssignal aus Aktivitätsdaten** — bestätige, dass `joined` + einmaliger Geo-Punkt kein verdecktes Präsenzsignal sind. (Nur Judgment; Grep sauber.)
3. **P3 — Teilnehmer-Payload nie über die Sechs-Feld-Fremdsicht hinaus** — bestätige die Abdeckung durch projection-uniqueness + Discovery-Case 4. (Mechanisch erzwungen, grün.)

### Gaps Summary

None. All 41 must-haves verified with codebase and executed-test evidence; the phase goal —
festival-scoped, capacity-enforced, provably isolated activity/tag/attendee modeling — is
achieved in the codebase, not merely claimed. Status is `human_needed` solely because three
judgment-tier prohibitions must be human-acknowledged rather than silently passed.

---

_Verified: 2026-08-15T00:45:00Z_
_Verifier: Claude (gsd-verifier, model fable)_
