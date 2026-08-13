# quiks

## What This Is

quiks is a **multi-tenant festival app** (one festival = one tenant, reused across every
partnering festival). For visitors it brings the whole festival into one place: overview, site
map, timetable, news/updates, and cashless — plus two differentiators, a **camping-spot / ticket
swap marketplace** and **activities + connecting with friends**. It ships as an Expo mobile app
for visitors, a Next.js admin web for festival organizers, and a NestJS backend, all in one
Turborepo. This build cycle focuses on the **visitor mobile app**.

## Core Value

A festival visitor can get into the app, connect to their festival, and reach everything about
their festival experience from one home screen. If everything else fails, that entry-and-home
path must work.

## Requirements

### Validated

<!-- Inferred from the existing codebase map (.planning/codebase/) — scaffolded, not yet
     shipped to users. Locked as the current baseline. -->

- ✓ Turborepo + pnpm monorepo with shared packages (`contracts`, `db`, `i18n`, `ui`, `config`) — existing
- ✓ NestJS API boots on port 8081 with config (Zod env loader) and a Drizzle DB module — existing
- ✓ Festival domain module serves read-only festival + tag data with locale resolution — existing
- ✓ ts-rest + Zod API contracts as the single source of truth (`packages/contracts`) — existing
- ✓ Drizzle schema for tenant-scoped entities (`festival`, `festival_locale`, `tag`, `tag_translation`) with the `festivalId` FK multi-tenancy pattern — existing
- ✓ i18n locale constants + `resolveUiLocale` / `resolveLocalized` helpers (`packages/i18n`) — existing
- ✓ 15 ADRs recording stack and architecture decisions (`docs/DEVELOPMENT_DECISIONS.md`) — existing
- ✓ Identity/membership schema in `packages/db`: vendored better-auth OTP tables (`user`/`session`/`account`/`verification`) + `visitor_profile` (accountId PK, `lower(username)` unique index) + gate-less `my_festival` save join; drizzle-zod bases surfaced drift-safely through `packages/contracts`; applied to Neon; identity model recorded as ADR-021 — **Validated in Phase 1: Identity Schema & Auth Foundation** (PLAT-01). Runtime auth wiring is Phase 2.
- ✓ The API exposes the OTP-auth + profile + festival browse/save endpoints this slice needs (contract-first): better-auth email-OTP behind a global login-first `AuthGuard`, `GET/POST /api/v1/me*` (profile completion, username availability, my festivals), `GET /api/v1/festivals`, gate-less `POST /api/v1/festivals/:festivalId/save` (409 profile-required guard), `festivalId` data isolation proven by tests — **Validated in Phase 2: OTP Auth & Festival Backend API** (SEC-01, SEC-02)
- ✓ An `Account` + `VisitorProfile` + `MyFestival` schema and better-auth (email-OTP) are wired into the NestJS API (env-configured Resend provider with dev console fallback; bodyParser smoke-tested; auth-annotation table reviewed) — **Validated in Phase 2: OTP Auth & Festival Backend API**
- ✓ The `apps/mobile` Expo (Expo Router, RN New Arch) app exists, talks to the real API through `packages/contracts` (ts-rest client with SecureStore cookie-forwarding, better-auth Expo client, TanStack Query), and enforces i18n from the first line of UI (Lingui catalogs DE/EN loaded, `no-literal-string` lint, `resolveUiLocale` German fallback); full core-value path (OTP login → festivals → save → gate-less enter → home) signed off on real Android hardware — **Validated in Phase 3: Mobile App Shell & i18n Foundation** (PLAT-02, I18N-01)
- ✓ Passwordless **email-OTP login** (email → 6-digit code → in; new email creates a better-auth `Account`), mandatory first-login **VisitorProfile completion** (unique `username` with live availability + `displayName`, optional avatar), returning-visitor **skip-profile** fast path, and a **long-lived auto-renewing session** (persists across restarts, re-auth via OTP on expiry) — **Validated in Phase 4: Visitor Auth & Profile Completion**
- ✓ A visitor can **browse all festivals** and **save** them to "Meine Festivals" (Meine/Alle segment, default Meine), **enter a festival gate-lessly** (no ticket/approval) landing on that festival's home, and the home shows a basic festival **overview**; festival-scoped reads are `festivalId`-isolated (SEC-02 cross-tenant test) and cold-start restores only the last-entered *saved* festival — **Validated in Phase 5: Festival Selection & Home** (SEC-02)
- ✓ The app carries a global four-tab bar (Start · Festivals · Friends · Mehr) with four real routes, a **view-only Profile** push-screen (displayName, @username, e-mail, avatar/initials, derived age and identity line from the session-bound `GET /me`; no input, no mutation), a **Friends** screen whose six blocks each state their precondition instead of faking a working surface, and a full **Mehr** screen (account → profile, language display, real dark-mode override persisted above the device scheme, and logout with a native cancellable confirm). Placeholder rows answer with one shared "coming soon" toast; nothing invents data, and the SafeNow card carries its distancing sentence in DE and EN — **Validated in Phase 6: Profile & Friends Placeholders** (HOME-03, PROF-01, FRND-01)

- ✓ The **owner-vs-foreign profile projection split** and a **user-global friendship backend** exist behind the login-first guard: `visitorProfileForeignSchema` (six fields) as the base, `visitorProfileOwnerSchema` (+ `birthDate`) as the single named extension; handle lookup, username prefix search, the four request transitions (send/accept/decline/withdraw) with auto-accept on the reverse-direction race, friends list, request lists and unfriend — all four foreign paths through **one** select map and **one** relation resolver. Friendships are one canonically ordered row (symmetric, no mirror) and survive switching festivals. Field absence is proven at the serialized HTTP body, and VIS-02 is pinned as an invariant test that walks the whole contract, so a second projection or a 1:1 message path cannot be added silently — **Validated in Phase 7: Profile Visibility & Friendship Backend** (VIS-01, VIS-02; discharges T-06-06)

- ✓ The **Friends screen is real**: a visitor finds people three ways — quiks-code/handle, username
  prefix search, and scanning another visitor's QR — and their own handle renders as a scannable
  quiks code. Incoming and outgoing requests are visible with a count badge and accept/decline/
  withdraw resolve without a manual refresh; the crew list sorts umlaut-correctly, the detail modal
  shows only the friend-view fields plus "friends since", and unfriending removes the row on both
  sides. Typing swaps the screen into search mode (D-03) and clearing restores it. The trailing
  element of every row is driven by the one Phase-7 relation resolver, so all five relation states
  render correctly — verified on device across all five. The camera is the first native capability
  in this project: it is mounted only while the scan segment is active, asks for camera without
  microphone, and its decoded text never reaches a router, a `Linking.openURL` or a WebView —
  **Validated in Phase 8: Friends** (FRND-02, FRND-03, FRND-04, FRND-05, FRND-06, FRND-08)

### Active

<!-- v1.0 "Visitor Shell" shipped 2026-08-12 — every hypothesis of that cycle moved to Validated
     above. The next mobile milestone is Activities + Friends (user decision, 2026-08-12); its
     requirements are written by /gsd-new-milestone --ws mobile and land here. -->

**Mobile — next milestone (Activities + Friends), requirements not yet written:**

- [x] **Blocking prerequisite (T-06-06) — discharged in Phase 7 (2026-08-12):**
      `visitorProfilePublicSchema` no longer exists. It is split into `visitorProfileForeignSchema`
      (base, six fields) and `visitorProfileOwnerSchema` (= foreign + `birthDate`), both composed from
      the drizzle-zod base via `.pick()`. Phase 07-05 pins the split with a VIS-02 single-code-path
      invariant test, so a second projection cannot be added silently. `gender` is deliberately part of
      the foreign view (D-02); the visibility *policy* question (IDN-02 — Flinta filter, age threshold)
      is untouched and still open.
- [x] **Real Friends: search, requests, connections — shipped in Phase 8 (2026-08-13).** FRND-02
      through FRND-06 and FRND-08 are validated above. What ships **without** it is recorded, not
      papered over: **FRND-09 (block/report) is still absent**, so v1.1 lets strangers find and
      contact you with no way to stop them — schedule it before the first real user cohort.
- [ ] Activities / connecting with friends (ADR-017) — the second differentiator
- [ ] Tab route rename `home` → `start` (decided 2026-08-12; do it before new routes land — Phase 9
      carries it as NAV-03, and it touches the deep-link capture path)

**Admin —** planned independently in `.planning/workstreams/admin/`, its own milestone track.

### Out of Scope

<!-- Explicit boundaries for THIS cycle. Part of the long-term quiks vision, just not now. -->

- Deep content features — timetable, site map (MapLibre), news/updates — deferred to later phases; the shell only shows basic overview info
- Cashless integration (embedded per-festival WebView) — later phase; not needed for entry/home
- Swap marketplace (camping-spot / ticket swaps) — differentiator, later milestone
- ~~Real Friends/social (search, requests, presence/map location) — placeholder only this cycle~~ → **moved into the next mobile milestone** (user decision 2026-08-12). "Who's here" (friends ∩ saved festival) still has no GPS, ever.
- Profile editing + `socials[]` — first-login creation only; editing and socials deferred
- Save via shared link / QR — list-based save this cycle (camera/scanner deferred)
- `FestivalTicket` (display-only QR) and `MyFestival.camp` text UI — schema may reserve fields, no UI this cycle
- Full offline-first behavior — online-assumed this cycle; use offline-capable tech now, implement caching/mutation-queue when content features land
- Admin web (`apps/admin`), `FestivalStaff`/`PlatformAdmin` flows, staff password login — organizer side deferred; visitor app is the priority
- Social login / SSO (Google/Apple) — 2027 (ADR-009); keep schema account-linking-ready
- Password login for visitors — visitors are OTP-only (password is a staff/admin-only credential, deferred with admin)
- `birthDate` / `gender` / Flinta + safety/youth-protection — pending Birgit's concept; kept migration-safe open

## Context

- **State after v1.0 (2026-08-12).** `apps/api` (NestJS) and `apps/mobile` (Expo, RN New Arch) are
  both live and talk to each other through `packages/contracts`; `apps/admin` is **not** scaffolded
  yet and is the other workstream's job. ~13.8k LOC across `apps` + `packages` in 194 tracked files.
  Auth (better-auth email-OTP), the identity/membership schema and test suites all exist — the
  "auth, identity tables and tests are absent" note from the original scaffold is obsolete.
  Test posture: `apps/api` has an integration suite against a real local Postgres; `apps/mobile`
  runs a node-env Vitest scoped to pure `lib/` logic — **there is no RN component-test harness**, so
  every screen-level truth is verified by on-device UAT, not automatically.
- **Binding concept phase (2026-07-28 meeting → docs/concept/04–10, ADRs to 020).** These decisions
  are authoritative and this planning set was reconciled to them on 2026-07-30: login-first;
  passwordless email-OTP for visitors (password+OTP is staff/admin only); identity = `Account` →
  `VisitorProfile` / `FestivalStaff[]` / `PlatformAdmin`; gate-less festival join modeled as
  `MyFestival` (saved festival, optional `camp` text); "who's here" = friends who saved the same
  festival (no GPS); activities/social, two-tier admin, lageplan, help-board, activity chat all
  post-shell; light+dark both; user-generated content is never translated.
- **Design fidelity matters.** The frontend must follow designs the user creates in Claude Design
  (claude.ai/design). `docs/concept/` holds design analysis, open questions, and a design system.
- **Known blockers this cycle must clear:** no auth implementation, no `user`/global-relationship
  schema, and `apps/mobile` not scaffolded. These gate the visitor slice.
- **Cashless is never our payment system** — it's a per-festival embedded HTTPS URL in a sandboxed
  WebView, hidden when unset (ADR-011). No card/payment data ever touches this app.

## Constraints

- **Tech stack**: Turborepo/pnpm · Expo + Expo Router (RN New Arch) mobile · Next.js 15 admin · NestJS API · ts-rest+Zod contracts · Drizzle/Neon Postgres · better-auth · Redis realtime · MapLibre · Lingui i18n — Decided across ADRs 001–015; don't re-litigate without an ADR.
- **TypeScript**: strict mode everywhere, pinned to TS 6.0.x (TS 7 pending typescript-eslint support — ADR-013). No untyped `any` at API boundaries.
- **Architecture (non-negotiable)**: multi-tenancy from day 1 (every domain model/query festival-scoped) · offline-first by design (don't assume network) · end-to-end type safety via `packages/contracts` · i18n from day 1 (no hardcoded user-facing strings) · tenant-aware auth · no secrets in repo.
- **Git**: trunk-based, short-lived feature branches, Conventional Commits, squash-merge via PR — never commit to `main` (`docs/GIT_CONVENTIONS.md`).
- **Validation**: Zod schemas in `packages/contracts` are the source of truth; reuse, don't re-declare.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build the visitor mobile app first (before admin) | It's the primary user-facing product and the core-value entry path | — Pending |
| First cut is a navigable "shell" (auth + festival save/enter + home), not full features | Get an end-to-end usable slice fast; add content features later (horizontal layers roadmap) | — Pending |
| **Passwordless email-OTP** for visitors (ADR-009) | Login-first needs a low-friction gate; no password stored; email inherently verified by the code | ✓ Concept-binding |
| Identity = `Account` → `VisitorProfile` (ADR-016); visitors are global, **not** org-members | One login base for all person types; visitor fields (`username`/`avatar`) live on VisitorProfile, not Account | ✓ Concept-binding |
| First-login **profile completion** (unique `username` + `displayName`) is in the shell | Concept makes it mandatory at first login; more than a placeholder | ✓ Concept-binding |
| Festival join is **gate-less "save"** (`MyFestival`), not a membership/access gate (ADR-014) | No ticket/approval to enter; tenant isolation is data-scoping by `festivalId`, not auth membership | ✓ Concept-binding |
| Profile & Friends: Profile view-only, Friends placeholder this cycle | Real social/editing is meaningful scope; keep the first slice lean | ✓ Shipped Phase 6 |
| Placeholders answer honestly instead of looking functional (D-11/D-13) | A dead switch or an inert search field that looks live teaches distrust; every empty state names its precondition, dead controls are genuinely `disabled` with a Soon badge, and one shared toast answers every placeholder tap | ✓ Shipped Phase 6 |
| Dark-mode override sits **above** the device scheme and writes explicit values (D-08a, amended by WR-01) | Leaving the light state writer-less made the switch dead on a system-dark device — off wrote `'system'`, which resolved back to dark. Off now writes `'light'`; the price (touching the switch leaves "follow the device" until a three-way picker exists) is recorded in the code | ✓ Shipped Phase 6 |
| `visitor_profile` gains `birthDate`/`gender`/`pronoun` with **no visibility policy** (D-12) | The fields are needed for the identity line now; IDN-02 (per-field visibility, age gate, Flinta filter, signup disclaimer) waits on Birgit's concept. Hard constraint: the public projection must be split into an owner view and a friend view before the first endpoint serves a *foreign* profile | ⚠ Shipped Phase 6 with an open obligation (T-06-06) |
| Festival browse/save is list-based this cycle (no QR) | Avoids native camera/QR work; shared-link/QR save added later | ✓ Shipped Phase 5 |
| Online-assumed for this slice (offline architected, not implemented) | Login needs network anyway; no cacheable content yet | — Pending |
| Rename to **quiks** and CI v1.0 land together, not incrementally (ADR-023/ADR-024) | `scheme` ↔ `trustedOrigins` and bundle-ID ↔ native build are coupled; a partial rename breaks auth at runtime, not at build time | ✓ Shipped Phase 05.1 |
| **Hell-first**: Papier is the default surface, dark mode is the "night shift" | CI v1.0 is light-first; `apps/mobile/lib/theme.ts` resolves the device scheme per render, only exact `dark` yields the night set | ✓ Shipped Phase 05.1 |
| Repo folder + GitHub remote rename deferred to a **post-merge checklist** (D-15) | Renaming the remote mid-branch would break the open PR and every local clone; the ordered checklist is `05.1-RENAME-CHECKLIST.md` | — Pending |
| A friendship is **one canonically ordered row**, not a mirrored pair (D-14) | Symmetry becomes a schema invariant instead of app logic: the same row answers for both parties, and unfriending deletes it once for both | ✓ Shipped Phase 7 |
| Declining, withdrawing and unfriending are **evidence-free**: exactly one 200 branch, no 404 (T-07-15/T-07-21) | A 404 would tell the requester "there was something to delete" — declining must never expose the decliner to the declined. Verified live in UAT: after a decline, the requester's view is field-identical to never having asked | ✓ Shipped Phase 7 |
| A unique violation on the pair PK **is** the auto-accept transition, not an error (D-10) | Two people requesting each other simultaneously is the expected case, not a conflict; `23505` inside the transaction seals the friendship instead of surfacing a 409 | ✓ Shipped Phase 7 |
| v1.1 ships username discoverability and requests from strangers with **no block, report, cooldown, opt-out or rate limit** (D-05/D-11/D-13) | A half measure with no UI behind it teaches false safety; the contract deliberately carries no visibility parameter and the exposure is recorded openly as FRND-09 rather than papered over. **Schedule FRND-09 before the first real user cohort** | ⚠ Shipped Phase 7 with a recorded exposure |
| The ADR-020 exclusion of a 1:1 message channel is enforced **mechanically** | `projection-uniqueness.spec.ts` matches 13 direct-message segments against every contract route, so a future DM route breaks the suite instead of quietly landing | ✓ Shipped Phase 7 |
| The scan panel is **unmounted, not hidden**, and the scanner is disarmed by **prop identity** (T-08-18/T-08-21) | Conditional render is what actually tears the camera down when the segment or screen is left; handing `onBarcodeScanned` `undefined` outside the idle state stops the native per-frame callback from entering JS at all, where an in-handler boolean guard would merely no-op after the fact | ✓ Shipped Phase 8 |
| A scanned quiks code is **plain text, never a deep link** (Phase-7 D-17, enforced in T-08-19) | The decoded payload passes a pure parser and is discarded on `null`; it is never handed to the router, `Linking.openURL` or a WebView, so a forged code cannot reach a navigation or URL surface. The confirmation card (D-14) is what makes a forged handle harmless rather than the parser alone | ✓ Shipped Phase 8 |
| `friend-detail` reads the friends **query cache** instead of fetching (D-04 consequence) | There is deliberately no foreign-profile *detail* endpoint — the four foreign paths from Phase 7 are the whole surface. Keying off the cache means the route param is only ever a local lookup key, so an unknown id closes the screen instead of probing a foreign identity | ✓ Shipped Phase 8 |
| Two third-party packages (`qrcode-generator`, `expo-camera`) passed a **blocking legitimacy checkpoint before install** | With `research` off there is no automatic legitimacy audit, so both were treated as `[ASSUMED]` and verified by hand (publisher, repo, exact name, dependency tree) before the install command ran — the two `T-08-SC` entries in `08-SECURITY.md` carry the evidence | ✓ Shipped Phase 8 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-13 after Phase 8 (Friends) — 5/5 plans, six requirements validated (FRND-02/03/04/05/06/08). UAT 8/8 passed on device after the `expo-camera` native rebuild, including the four checkpoints no device had seen (full five-state relation mapping, the WR-01/WR-02 fixes, the confirmation card across all five relation values, and the denied-permission callout at the longest catalog string in DE and EN). Security: 24/24 threats closed, `threats_open: 0`, four of them `high` (presence-signal absence, camera runtime, decoded-payload handling, and two package-legitimacy gates). Next: Phase 9 (Festival Navigation Shell) — context already gathered.*

*Previously: 2026-08-12 after Phase 7 (Profile Visibility & Friendship Backend) — 5/5 plans, VIS-01 and VIS-02 validated, T-06-06 discharged. The three judgment-tier UAT claims were confirmed by the user, one of them (VIS-01) after replaying the decline flow live against the dev API with three real accounts.*

---
*Milestone v1.0 close (2026-08-12) — **"Rollout" (Visitor Shell) closed for the mobile workstream.** 7/7 phases, 50/50 plans, 116 tasks, 20/20 v1 requirements; every phase `phase_complete` with `verification_status: passed`, so this is a `verified_closeout`, not an override. Shipped over 15 days (2026-07-28 → 2026-08-12) as PRs #4–#13, `main` at `44e7914`. Delivered end to end: identity/tenancy schema that cannot drift, passwordless email-OTP behind a login-first guard with `festivalId` isolation, the Expo shell with i18n enforced from the first line of UI, the full visitor path signed off on real Android hardware, the quiks rebrand + CI v1.0, and the global tab bar with Profile/Friends/Mehr. Archived to `workstreams/mobile/milestones/v1.0-*`; `REQUIREMENTS.md` removed so the next milestone starts fresh.*

*Two corrections recorded at close: (1) the two workstreams run **independently** — the earlier note that v1.0 could only close once admin was done was wrong, and mobile closed on its own; (2) the deferred FloatingNav DE-translation item was **stale** — the DE catalog has exactly one empty `msgstr` (the PO header), i.e. zero missing translations, verified against the catalog rather than assumed.*

*Carried forward, scheduled not forgotten: **T-06-06** (owner-vs-friend profile projection) is a hard prerequisite for the next milestone, since Activities + Friends is exactly the surface that serves foreign profiles; plus the `home`→`start` route rename (decided), `/gsd-ui-review 06` (never run), iOS device verification (deferred since Phase 3), and a `WINDOWS.md` reconciliation pass — its 26 open entries overstate real debt.*
