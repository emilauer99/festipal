---
phase: 7
slug: profile-visibility-friendship-backend
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-12
---

# Phase 7 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: **authored at plan time** — all five PLAN files (`07-01` … `07-05`) carry a
parseable `<threat_model>` block. This audit therefore **verifies that the planned mitigations
exist in the implementation**; it does not re-scan for new threats.

---

## Trust Boundaries

Union of the boundaries declared across the five plans.

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Client → API (`GET /visitors/:username`) | Untrusted handle string from an authenticated but arbitrary visitor | Foreign visitor profile view (6 fields) |
| Client → API (`GET /visitors?q=`) | Freely chosen search string from an authenticated but arbitrary visitor | Foreign visitor profile view, ≤ 20 hits |
| Client → API (4 lifecycle endpoints) | An authenticated visitor names an arbitrary foreign account as target | Relationship state only, no profile data |
| Client → API (`/me/friends`, `/me/friend-requests`, `DELETE /me/friends/:accountId`) | A visitor reads their own relationship set and dissolves a friendship | Foreign profile view embedded per list item |
| Session → Service | Caller identity must originate from the better-auth session, never from path/query/body | `session.user.id` |
| Service → Postgres | Pattern match over untrusted input; concurrent writes across two linked tables | Parameterized SQL, canonically ordered pair |
| API → Postgres | New tables with FKs onto the identity table; constraint violations must not surface as 500 | SQLSTATE 23505 / 23503 / 23514 |
| Contract → all clients | The published response shape *is* the visibility boundary — what is declared here is outside | `visitorProfileForeignSchema` vs `visitorProfileOwnerSchema` |
| Source → future phases | A later-added route or column list is the realistic path by which a leak appears | Invariant tests instead of review discipline |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-07-01 | Information Disclosure | `visitorProfileForeignSchema` / `foreignProfileColumns` | high | mitigate | `apps/api/src/friendship/visitor-projection.ts:23` — the single 6-column select map; `pickForeignProfile` at `:52` is the single shaping function. `foreign-projection.spec.ts` asserts absence on the serialized body. | closed |
| T-07-02 | Elevation of Privilege | `FriendshipController.lookupVisitor` | high | mitigate | `friendship.controller.ts:18-20` — caller is `session.user.id` only; no handler accepts a caller id. No `@AllowAnonymous()` anywhere under `apps/api/src/friendship/` — the global `APP_GUARD` (`auth.module.ts:12`) applies. | closed |
| T-07-03 | Information Disclosure | Handle lookup as an existence oracle | medium | accept | D-05: no discoverability opt-out in v1.1. Session required, foreign view only. Documented in REQUIREMENTS.md § Future Requirements (FRND-09). See Accepted Risks R-01. | closed (accepted) |
| T-07-04 | Tampering | `friendship` / `friend_request` pair invariant | high | mitigate | Composite PKs `friendship_pair_pk` / `friend_request_pair_pk` plus ordering CHECKs and `friend_request_requester_chk` — in the schema (`packages/db/src/schema/friendship.ts:40,56`, `friend-request.ts:40-52`), not in app logic. Live in migration `0005`, re-pinned to `COLLATE "C"` by `0006`. | closed |
| T-07-05 | Denial of Service | Raw `username` as comparison input | low | mitigate | `friendship.service.ts:203` — exact equality via `lower()` against the existing unique index, `.limit(1)`. Bound through Drizzle's `sql` template, never concatenated. | closed |
| T-07-06 | Repudiation | Migration `0005` from the wrong workstream | medium | mitigate | Migrations `0005`/`0006` are journalled sequentially and applied; the `admin` workstream is not scaffolded and has touched no migration. `packages/db/drizzle/` is internally consistent (see deferred item D-1 for the unrelated local-DB row anomaly). | closed |
| T-07-07 | Information Disclosure | Search hit projection | high | mitigate | Search selects through the same `foreignProfileColumns` constant; `friendship-isolation.spec.ts:257-261` asserts absence on the serialized array body. | closed |
| T-07-08 | Information Disclosure | User enumeration via prefix search | medium | accept | D-05, deliberate. Dampeners in place: session required, 2-char floor, `.limit(20)`, prefix not substring, `username` only. See Accepted Risks R-02. | closed (accepted) |
| T-07-09 | Tampering | LIKE metacharacters in the input | medium | mitigate | `friendship.service.ts:245-256` — backslash, `%` and `_` escaped before the prefix wildcard; condition carries `escape '\'`; value bound via `sql` template. | closed |
| T-07-10 | Denial of Service | Unbounded hits / N+1 relation resolution | low | mitigate | Hard `.limit(20)` (`:258`); relation resolution bundled into two queries (`resolveRelations`, `:123-170`) — cost per search is constant in the hit count. | closed |
| T-07-11 | Elevation of Privilege | Relationship status from a foreign perspective | high | mitigate | `searchVisitors` declares no caller parameter; `callerId` is `session.user.id` (`friendship.controller.ts:36-37`). | closed |
| T-07-12 | Spoofing | `sendRequest` / `requesterId` | high | mitigate | `requesterId` filled from `session.user.id` only (`friendship.service.ts:326`); no endpoint takes a sender parameter. Schema-level backstop `friend_request_requester_chk`. | closed |
| T-07-13 | Elevation of Privilege | `acceptRequest` / `withdrawRequest` | high | mitigate | Conditions live in the SQL predicate, not in a preceding check: `ne(friendRequest.requesterId, callerId)` in `sealFriendship` (`:467`), `eq(..., callerId)` in `withdrawRequest` (`:514`). WR-01 turned the accept-path check into the delete itself. | closed |
| T-07-14 | Tampering | Reverse-direction and duplicate races | high | mitigate | Composite PK on the canonical pair plus ordering CHECK; `23505` discriminated by name into the auto-accept path; auto-accept and accept run in `db.transaction`. `friend-request-race.spec.ts` cases 3, 5, 12 plus a 25-round counter-probe. | closed |
| T-07-15 | Information Disclosure | Lifecycle error responses | medium | mitigate | `decline`/`withdraw` have a single 200 branch contract-side; `accept` of one's own outgoing request returns the same 404 as "does not exist"; no lifecycle response carries profile data. | closed |
| T-07-16 | Denial of Service | Unbounded open outgoing requests | low | accept | D-13, deliberate — no cooldown in v1.1, consistent with D-05/D-11. See Accepted Risks R-03. | closed (accepted) |
| T-07-17 | Repudiation | No history of declined requests | low | accept | D-12, explicitly decided as a one-way door. The absence of a status column is precisely why the unique constraint kills the duplicate race in the schema. See Accepted Risks R-04. | closed (accepted) |
| T-07-18 | Information Disclosure | Embedded profiles in friend and request lists | high | mitigate | Both list paths select via `foreignProfileColumns` and shape via `pickForeignProfile` (`friendship.service.ts:554`, `:599`) — no fourth column list. `friendship-isolation.spec.ts:311-357` proves absence on the serialized body. | closed |
| T-07-19 | Elevation of Privilege | Reading a foreign friend/request list | high | mitigate | Neither list route declares `pathParams`, `query` or `body`; `session.user.id` is the only caller reference and sits inside the join condition. | closed |
| T-07-20 | Tampering | Dissolving a foreign friendship | high | mitigate | `unfriend` (`:620-629`) forms the canonical pair from caller and target — a pair not containing the caller is unaddressable. | closed |
| T-07-21 | Information Disclosure | Disclosing a friendship that never existed | low | mitigate | `unfriend` always answers 200; the response does not distinguish whether a row was deleted. | closed |
| T-07-22 | Denial of Service | Unbounded list length | low | accept | Bounded by a visitor's real friend count; pagination without UI pagination would be silent data loss. See Accepted Risks R-05. | closed (accepted) |
| T-07-23 | Information Disclosure | Future route carrying owner fields outward | high | mitigate | `projection-uniqueness.spec.ts:276` walks **all** `Object.entries(contract)` route keys against an exception list, not a positive list. Counter-probe B (documented in `07-05-SUMMARY.md`) shows a new route with an owner field goes red. | closed |
| T-07-24 | Information Disclosure | A second, unprojected column list in the module | high | mitigate | `projection-uniqueness.spec.ts:547-548` — exactly one `export const foreignProfileColumns`, exactly one `export function pickForeignProfile`; comment lines filtered before counting (WR-03). | closed |
| T-07-25 | Information Disclosure | A later-added profile column becomes public by default | high | mitigate | Key **equality** against the fixed six-key list at five sites (`:491`, `:503`), not subset. WR-03 widened the walk beyond `birthDate`/`email` to all owner-only keys. | closed |
| T-07-26 | Elevation of Privilege | Foreign access without a session | high | mitigate | `friendship-isolation.spec.ts:441-446` — all four foreign endpoints return 401 without a cookie. Control itself is the global `APP_GUARD`; no opt-out decorator exists in the module. See Residual Observation O-1. | closed |
| T-07-27 | Tampering | A silently added tenant column on a user-global table | medium | mitigate | `friendship-isolation.spec.ts:419` queries `information_schema.columns` for both tables — absence of a festival column **and** the complete expected column set. | closed |
| T-07-28 | Repudiation | Friendship asserted only as a schema property | low | mitigate | Success criterion 3 drawn as an observation (isolation spec cases 7 and 8, case 8 by serialized byte comparison), not inferred from a missing column. | closed |
| T-07-SC | Tampering | npm/pnpm installations | low | accept | This phase installs no new package — tables, contract split and NestJS module ship without a new dependency. Supply-chain surface unchanged, no package-legitimacy gate needed. Confirmed unchanged in all five SUMMARY files. See Accepted Risks R-06. | closed (accepted) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-01 | T-07-03 | D-05 — no discoverability opt-out in v1.1; the handle lookup requires a valid session and returns only the foreign view. Open in REQUIREMENTS.md § Future Requirements (FRND-09). | Emil Auer (D-05) | 2026-08-12 |
| R-02 | T-07-08 | D-05 — prefix search enumerates usernames by design; retrofit belongs with FRND-09 (block/report). Dampeners listed in the register. | Emil Auer (D-05) | 2026-08-12 |
| R-03 | T-07-16 | D-13 — no cooldown/limit on open outgoing requests in v1.1; deliberately not half a protection ahead of FRND-09. Retrofit is a count query plus an error branch. | Emil Auer (D-13) | 2026-08-12 |
| R-04 | T-07-17 | D-12 — no history of declined requests, explicitly a one-way door; confirmed at the 07-01 checkpoint. | Emil Auer (D-12) | 2026-08-12 |
| R-05 | T-07-22 | Lists are unpaginated in v1.1; a limit without UI pagination would be silent data loss. Cheap retrofit at exactly these two endpoints. | Emil Auer | 2026-08-12 |
| R-06 | T-07-SC | No new package in this phase; supply-chain surface unchanged across all five plans. | Emil Auer | 2026-08-12 |

*Accepted risks do not resurface in future audit runs.*

**Honesty obligation carried forward:** R-01…R-05 all hang on FRND-09 (block/report), which is
explicitly post-v1.1. They are held as flagged-unverified prohibitions in `07-05` and are the
reason `07-VERIFICATION.md` stands at `human_needed` rather than `passed` — that is the intended
state, not an open threat.

---

## Residual Observations (non-blocking)

| ID | Source | Observation | Why non-blocking |
|----|--------|-------------|------------------|
| O-1 | 07-REVIEW.md IN-02 | The five *mutating* friendship endpoints have no explicit anonymous-401 test; only the four foreign read endpoints do (isolation spec case 10). | Test-coverage gap, not a missing control. The global `APP_GUARD` covers every route and the module declares no opt-out decorator. Severity Info — below the `high` block threshold. |
| O-2 | 07-REVIEW.md IN-01 | `foreignProfileColumns` is not type-locked; an added column would compile silently. | Caught one layer up: `projection-uniqueness.spec.ts` asserts key **equality** (T-07-25), so the addition goes red in CI. Info. |
| O-3 | 07-REVIEW.md IN-05 | `instanceof PostgresError` would fail silently if the `postgres` package resolved twice. | Not observed in this workspace; would surface as an immediate test failure in `friend-request-race.spec.ts`. Info. |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-12 | 29 | 29 | 0 | /gsd-secure-phase (orchestrator, L1 grep-depth verification) |

Verification method: each `mitigate` disposition was checked against the implementation
(`apps/api/src/friendship/`, `packages/db/src/schema/`, `packages/db/drizzle/`,
`apps/api/test/`) rather than against the SUMMARY self-reports. Each `accept` disposition was
checked for a recorded decision reference and entered into the Accepted Risks Log above.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-12
