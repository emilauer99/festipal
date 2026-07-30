# festipal

## What This Is

festipal is a **multi-tenant festival app** (one festival = one tenant, reused across every
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

### Active

<!-- This build cycle: the "Visitor Shell" — a navigable, online vertical slice of the mobile app.
     Reconciled 2026-07-30 with the binding concept phase (docs/concept/04–10, ADR-009/014/016/020).
     Hypotheses until shipped and validated. -->

- [ ] A visitor logs in **passwordlessly via email OTP** (enter email → 6-digit code → in); a new email creates an `Account` (better-auth, global/non-tenant)
- [ ] On first login the visitor completes a **VisitorProfile**: required unique `username` (live availability check) + `displayName` (avatar optional)
- [ ] A returning visitor (email already has a VisitorProfile) goes straight in, skipping profile setup
- [ ] The visitor's session is long-lived and auto-renews (stays logged-in across restarts; re-auth via OTP on expiry)
- [ ] A visitor can browse **all** festivals and **save** ones to "Meine Festivals" (Meine/Alle segment, default Meine)
- [ ] A visitor can **enter** a festival **gate-lessly** (no ticket/approval) and land on that festival's home / main menu
- [ ] The home shows a basic festival **overview** the visitor can click into
- [ ] The home exposes a **Profile** screen (view-only: username, displayName, avatar/initials, email)
- [ ] The home exposes a **Friends** screen (placeholder — friends who saved the same festival; none yet)
- [ ] The `apps/mobile` Expo app exists and is wired to the real API through `packages/contracts`
- [ ] The API exposes the OTP-auth + profile + festival browse/save endpoints this slice needs (contract-first)
- [ ] An `Account` + `VisitorProfile` + `MyFestival` schema and better-auth (email-OTP) are wired into the NestJS API (currently absent)

### Out of Scope

<!-- Explicit boundaries for THIS cycle. Part of the long-term festipal vision, just not now. -->

- Deep content features — timetable, site map (MapLibre), news/updates — deferred to later phases; the shell only shows basic overview info
- Cashless integration (embedded per-festival WebView) — later phase; not needed for entry/home
- Swap marketplace (camping-spot / ticket swaps) — differentiator, later milestone
- Real Friends/social (search, requests, presence/map location) — placeholder only this cycle; "who's here" (friends ∩ saved festival) has no GPS ever
- Profile editing + `socials[]` — first-login creation only; editing and socials deferred
- Save via shared link / QR — list-based save this cycle (camera/scanner deferred)
- `FestivalTicket` (display-only QR) and `MyFestival.camp` text UI — schema may reserve fields, no UI this cycle
- Full offline-first behavior — online-assumed this cycle; use offline-capable tech now, implement caching/mutation-queue when content features land
- Admin web (`apps/admin`), `FestivalStaff`/`PlatformAdmin` flows, staff password login — organizer side deferred; visitor app is the priority
- Social login / SSO (Google/Apple) — 2027 (ADR-009); keep schema account-linking-ready
- Password login for visitors — visitors are OTP-only (password is a staff/admin-only credential, deferred with admin)
- `birthDate` / `gender` / Flinta + safety/youth-protection — pending Birgit's concept; kept migration-safe open

## Context

- **Greenfield-for-product, brownfield-for-repo.** The monorepo is ~⅓ scaffolded: `apps/api` runs
  with a festival module; `packages/*` exist at varying completeness. `apps/mobile` and `apps/admin`
  do **not** exist yet. Auth, identity tables, and any tests are absent (see `.planning/codebase/CONCERNS.md`).
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
| Profile & Friends: Profile view-only, Friends placeholder this cycle | Real social/editing is meaningful scope; keep the first slice lean | — Pending |
| Festival browse/save is list-based this cycle (no QR) | Avoids native camera/QR work; shared-link/QR save added later | — Pending |
| Online-assumed for this slice (offline architected, not implemented) | Login needs network anyway; no cacheable content yet | — Pending |

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
*Last updated: 2026-07-30 — Phase 1 (Identity Schema & Auth Foundation) complete: Account/VisitorProfile/MyFestival + better-auth OTP schema live in Neon, drift-safe contracts, ADR-021.*
