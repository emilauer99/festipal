# Roadmap: quiks — Mobile (Visitor App)

> Workstream `mobile`. The admin/staff web UI is planned independently in
> `.planning/workstreams/admin/` on its own milestone track — neither stream waits on the other.
> Shared collision zones (`packages/contracts`, `packages/db`, `packages/ui`) are changed by one
> stream at a time. **Admin builds the global activity-tag catalog and tag activation (ADR-018) in
> its own stream — mobile only *consumes* the effective tag list. Serialize that schema change.**

## Milestones

- ✅ **v1.0 Rollout — Visitor Shell** — Phases 1–6 (shipped 2026-08-12)
- 🚧 **v1.1 Activities & Friends** — Phases 7–12 (in progress)

## Phases

<details>
<summary>✅ v1.0 Rollout — Visitor Shell (Phases 1–6, incl. inserted 5.1) — SHIPPED 2026-08-12</summary>

- [x] Phase 1: Identity Schema & Auth Foundation (3/3 plans) — completed 2026-07-30
- [x] Phase 2: OTP Auth & Festival Backend API (6/6 plans) — completed 2026-08-02
- [x] Phase 3: Mobile App Shell & i18n Foundation (6/6 plans) — completed 2026-08-04
- [x] Phase 4: Visitor Auth & Profile Completion (7/7 plans) — completed 2026-08-05
- [x] Phase 5: Festival Selection & Home (11/11 plans) — completed 2026-08-09
- [x] Phase 5.1: quiks Rename & CI v1.0 Rollout *(INSERTED)* (7/7 plans) — completed 2026-08-11
- [x] Phase 6: Profile & Friends Placeholders (10/10 plans) — completed 2026-08-12

Detail: [`milestones/v1.0-ROADMAP.md`](./milestones/v1.0-ROADMAP.md) · Summary: [`MILESTONES.md`](./MILESTONES.md)

</details>

### 🚧 v1.1 Activities & Friends (Phases 7–12)

- [x] **Phase 7: Profile Visibility & Friendship Backend** — owner-view/friend-view projection split, user-global friendship + request model (completed 2026-08-12)
- [ ] **Phase 8: Friends** — the Phase-6 placeholder becomes real: add by handle, search, QR, requests, list
- [ ] **Phase 9: Festival Navigation Shell** — five-tab festival bar, honest placeholders, friends-in-this-festival, `home` → `start` rename
- [ ] **Phase 10: Activities Backend** — `activity`, tag resolution, attendees with capacity, tenant isolation
- [ ] **Phase 11: Activities** — create, discover, join/leave, clone, route-opening location
- [ ] **Phase 12: Activity Lobby Chat** — WS gateway + Redis, live group chat per activity

**Cut deliberately homogeneous** (root `CLAUDE.md`, Phase & Gate Economy): backend slices are
separated from UI slices so only the backend phases pay for the security and API-coverage gates.
Target ≤ 6 plans per phase — v1.0 averaged 7.1 and its two 10-plan phases are what made it expensive.

## Phase Details

### Phase 7: Profile Visibility & Friendship Backend

**Goal**: The API can express who may see what about whom, and friendships exist as a real,
user-global model with a request lifecycle — before any screen can leak anything
**Depends on**: Phase 6 (identity fields, `GET /me`)
**Requirements**: VIS-01, VIS-02
**Also lands** (substrate consumed by Phases 8 and 9, not separately requirement-mapped): the
friendship + friend-request schema, the request lifecycle endpoints, and username search.
**Plans**: 5/5 plans executed (5 waves — the layer chain contract → service → controller → spec is genuinely
sequential because `schemas.ts`, `router.ts` and `friendship.service.ts` are shared by every slice)

Plans:
**Wave 1**

- [x] 07-01-PLAN.md — Tracer: friendship/friend_request schema + migration 0005 + owner/foreign projection split + handle lookup end-to-end (discharges T-06-06)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 07-02-PLAN.md — Username prefix search with per-hit relation status (D-06/D-07/D-08/D-09)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 07-03-PLAN.md — Request lifecycle (send/accept/decline/withdraw) + auto-accept resolution of the reverse-direction race

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 07-04-PLAN.md — Friends list, incoming/outgoing request lists, unfriend

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 07-05-PLAN.md — VIS-01 field-absence proof across all four foreign paths, VIS-02 single-code-path invariant, festival independence

**Success Criteria** (what must be TRUE):

1. A request for a *foreign* profile returns the friend-view projection only — no `birthDate`, no
   e-mail — proven by a test that asserts field *absence*, not merely presence of what is allowed.

2. Username search and request previews resolve through that same projection function; a test proves
   there is no second code path that emits owner-only fields.

3. Friendship is user-global: it carries no `festivalId`, and a friendship established while in one
   festival is unchanged after switching to another.

4. The request lifecycle is complete and idempotent — send, accept, decline, withdraw, unfriend —
   with a mutual-friendship invariant that cannot express a one-sided friendship.

**Notes**: This phase discharges **T-06-06**, the obligation carried out of v1.0. It is the reason
this phase is first: v1.1 is the first milestone in which an endpoint serves a foreign profile.
`code_review_depth: deep` — this is auth-adjacent with a migration. Watch the **duplicate-request /
reverse-direction race**: A→B and B→A arriving concurrently must not create two rows or two
friendships; solve it in the schema (canonical ordered pair + unique constraint), not in app logic.
**UI hint**: no

### Phase 8: Friends

**Goal**: The Friends screen stops being a placeholder — a visitor can find people three ways,
manage requests, and see a real friends list
**Depends on**: Phase 7
**Requirements**: FRND-02, FRND-03, FRND-04, FRND-05, FRND-06, FRND-08
**Plans**: 5/5 plans executed (5 Wellen — `app/(tabs)/friends.tsx` und die beiden Lingui-Kataloge sind
geteilter Zustand über alle Slices hinweg, die Kette ist daher echt sequenziell, wie in Phase 7)

Plans:
**Wave 1**

- [x] 08-01-PLAN.md — Tracer: Suche → Treffer → Anfrage end-to-end, `PersonRow` + `RelationAction` + `useFriendMutations` (FRND-02/FRND-03, D-01…D-04)

**Wave 2** *(blockiert auf Wave 1)*

- [x] 08-02-PLAN.md — Anfragen-Sektion beide Richtungen, Zähler-Badge, Chats-/Vorschlagsblock entfernt (FRND-05, D-05…D-08)

**Wave 3** *(blockiert auf Wave 2)*

- [x] 08-03-PLAN.md — `lib/friend-sort.ts` mit Hermes-Fallback, echte Crew-Liste, `friend-detail`-Modal, Entfreunden (FRND-06/FRND-08, D-09…D-12)

**Wave 4** *(blockiert auf Wave 3)*

- [x] 08-04-PLAN.md — QR-Logik + `QRMark` + QR-Screen mit „Mein Code", echter CTA auf der Karte (FRND-04, D-13) · **nicht autonom** (Paket-Legitimitäts-Gate)

**Wave 5** *(blockiert auf Wave 4)*

- [x] 08-05-PLAN.md — `expo-camera` + nativer Rebuild, `CameraScanPanel` mit drei Berechtigungszuständen, Bestätigungskarte (FRND-04, D-14…D-16) · **nicht autonom** (Paket-Legitimitäts-Gate)

**Success Criteria** (what must be TRUE):

1. A visitor can send a friend request by entering a quiks-code/handle, by username search, and by
   scanning another visitor's QR code; their own handle renders as a scannable QR.

2. Incoming and outgoing requests are visible and can be accepted, declined, or withdrawn, with the
   list reflecting the result without a manual refresh.

3. The friends list shows real friends, and ending a friendship removes it from both sides.
4. Every empty state still names its precondition rather than the absence (the D-11 rule from Phase 6
   survives contact with real data).

5. All new strings are in both Lingui catalogs; `username`/`displayName` are never translated.

**Notes**: The camera permission for QR scanning is the one native addition — it needs a rationale
string and a graceful denial path, and `npx expo run:android` from `apps/mobile` before device
testing. The `['me']` query key is already shared between Profil and Friends; extend rather than
duplicate. **Blocking/reporting is deliberately NOT in this phase** — see the honest note in
REQUIREMENTS.md Future Requirements: this ships the ability for strangers to contact you without the
ability to stop them.
**UI hint**: yes

### Phase 9: Festival Navigation Shell

**Goal**: Inside a festival there is a real five-tab bar, its two content tabs are honest
placeholders, the Friends tab shows friends who saved this festival, and the global first tab is
finally named `start` everywhere
**Depends on**: Phase 8 (friends must exist before "friends in this festival" means anything)
**Requirements**: NAV-01, NAV-02, NAV-03, FRND-07

**Success Criteria** (what must be TRUE):

1. Entering a festival lands on a five-tab bar — Dashboard · Aktivitäten · Friends · Timetable ·
   Lageplan — with every tab a real registered route, none decorative.

2. Timetable and Lageplan each state their precondition in the D-11/D-13 pattern; no dead control
   fails silently, and the single shared `SoonToast` remains the only coming-soon mechanism.

3. The festival Friends tab shows exactly the visitor's own friends who saved this festival — an
   intersection, never a presence or location signal (ADR-014).

4. The global first tab is `start` in the route, the msgid and the UI, and existing deep links
   still resolve.

**Notes**: The rename (NAV-03) touches the deep-link capture path — the same area that produced the
Phase-5 unmatched-route bug, whose real cause was an Expo dev-client launch URL being captured as a
route. Verify on device with `expo start -c`, not in the node-env runner. Three of the five tabs
being placeholders is the cost of the user's decision to build the full shell now; NAV-02 is what
keeps that honest rather than hollow.
**UI hint**: yes

### Phase 10: Activities Backend

**Goal**: The API models activities, their tags and their attendees — festival-scoped, capacity-
enforced, and provably isolated between festivals
**Depends on**: Phase 6 (festival scoping baseline); coordinate with `admin` on the tag tables
**Requirements**: SEC-03

**Also lands** (consumed by Phase 11): `activity` with tag-or-title, subtitle, description,
location, `startTime`, `capacity`; the effective tag list (enabled global ∪ festival-own); the
attendee join/leave endpoints; the optional geo point.

**Success Criteria** (what must be TRUE):

1. Every new festival-scoped table carries `festivalId` and every query filters on it; a cross-tenant
   test proves festival B's activities never appear in festival A's context (SEC-03, inheriting SEC-02).

2. Capacity is enforced at the database level, not only in the service — concurrent joins on the last
   remaining seat cannot both succeed.

3. The effective tag list resolves as enabled-global ∪ festival-own, and a tag disabled by a festival
   disappears from that festival's list without affecting any other festival.

4. The creator is an attendee from creation, and the invariant cannot be violated by leaving.

**Notes**: **`packages/db` and `packages/contracts` collision risk is real here** — `admin` builds
the tag catalog and activation UI (ADR-018) against the same tables. Agree the schema once, land it
from one stream, and keep the other stream's changes additive. `ActivityTag` has a nullable
`festivalId` (null = global catalog) — that nullable FK is the one place where the otherwise absolute
"every tenant table filters on `festivalId`" rule has a deliberate exception, so it needs its own
test rather than an assumption. `code_review_depth: deep` — migration + tenant scoping.
**UI hint**: no

### Phase 11: Activities

**Goal**: A visitor can create, discover, join, leave and clone activities inside a festival, and
open an activity's location as a route in an external maps app
**Depends on**: Phase 9 (the Aktivitäten tab), Phase 10 (the API)
**Requirements**: ACT-01, ACT-02, ACT-03, ACT-04, ACT-05, ACT-06

**Success Criteria** (what must be TRUE):

1. A visitor can create an activity with either a tag or a title — the auto-title rule holds (tag →
   `tag.label` + optional subtitle; no tag → title required) — plus location, start time and capacity.

2. The festival's activities are discoverable, and joining or leaving updates the seat count
   immediately and survives an app restart.

3. A full activity cannot be joined, and the UI says so rather than failing on submit.
4. Cloning opens a prefilled create form where only time and place need changing.
5. An activity with a geo point offers "open route", which hands off to an external maps app; one
   without a geo point simply shows its free-text location.

6. All strings are in both catalogs; user-entered activity titles and descriptions are never
   translated (ADR-012/020).

**Notes**: The geo point is a **one-off, opt-in capture** for route handoff — it is emphatically not
presence tracking (ADR-017 §2 vs ADR-014). Do not introduce a location watcher. Activity content is
user-generated: it goes through the same no-translate rule as `username`/`displayName`.
**UI hint**: yes

### Phase 12: Activity Lobby Chat

**Goal**: Attendees of an activity get a live group chat for it, which survives reconnects and ends
when they leave
**Depends on**: Phase 11
**Requirements**: CHAT-01, CHAT-02, CHAT-03

**Success Criteria** (what must be TRUE):

1. Joining an activity grants access to exactly that activity's group chat; there is no 1:1 DM path
   anywhere in the API surface (ADR-020) — proven by an endpoint-inventory assertion, not by
   inspection.

2. A message sent by one attendee appears live for another attendee without a manual refresh.
3. After a connection drop and reconnect, the recent history loads and no message is silently lost.
4. Leaving an activity revokes chat access — both the socket subscription and the history read.

**Notes**: **Turn `research` ON for this phase.** This is the only genuinely new territory in the
milestone: NestJS WebSocket gateway + Redis adapter (ADR-010), authentication of the socket
handshake, room scoping by activity, and reconnect/backfill semantics. None of it has a precedent in
this codebase. Also settle explicitly what happens with the app backgrounded — without NOTF-01 (out
of scope) chat is foreground-only in practice, and the UI should not imply otherwise.
`code_review_depth: deep` — a socket that authorizes by room membership is an authorization surface.
**UI hint**: yes

## Carried Into Later Milestones

Not scheduled in v1.1, tracked so it is not rediscovered:

- **FRND-09 block/report** — v1.1 ships stranger-initiated contact without a way to stop it.
  Schedule before the first real user cohort.

- **NOTF-01 push** — friend requests and chat messages are invisible while the app is closed.
- **`/gsd-ui-review 06`** — never run; the 6-pillar audit of the Phase-6 screens.
- **iOS device verification** — deferred since Phase 3 (no Mac/Xcode).
- **`.planning/WINDOWS.md`** — 26 open entries, largely stale; needs a reconciliation pass.
