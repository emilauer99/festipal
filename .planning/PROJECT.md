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

### Active

<!-- This build cycle: the "Visitor Shell" — a navigable, online vertical slice of the mobile app.
     Hypotheses until shipped and validated. -->

- [ ] A visitor can register and log in with email/password (better-auth, global/non-tenant user)
- [ ] A visitor's session persists so they land logged-in on reopen (online-assumed)
- [ ] A visitor can browse a list of festivals and select/join one
- [ ] After joining, a visitor lands on a main menu / home for the selected festival
- [ ] The home shows a basic festival **overview** the visitor can click into
- [ ] The home exposes a **Profile** screen (placeholder — navigable, basic info, no editing yet)
- [ ] The home exposes a **Friends** screen (placeholder — navigable, no real connections yet)
- [ ] The `apps/mobile` Expo app exists and is wired to the real API through `packages/contracts`
- [ ] The API exposes the auth + user + festival-list endpoints this slice needs (contract-first)
- [ ] A `user` table + better-auth are wired into the NestJS API (currently absent)

### Out of Scope

<!-- Explicit boundaries for THIS cycle. Part of the long-term festipal vision, just not now. -->

- Deep content features — timetable, site map (MapLibre), news/updates — deferred to later phases; the shell only shows basic overview info
- Cashless integration (embedded per-festival WebView) — later phase; not needed for entry/home
- Swap marketplace (camping-spot / ticket swaps) — differentiator, later milestone
- Real Friends/social (search, requests, presence/"who's here") — placeholder only this cycle
- Profile editing — view-only placeholder this cycle
- Join via code / ticket / QR scanning — list-only selection this cycle (camera/scanner work deferred)
- Full offline-first behavior — online-assumed this cycle; use offline-capable tech now, implement caching/mutation-queue when content features land
- Admin web (`apps/admin`) — organizer side deferred; visitor app is the priority
- Social login / OAuth — email/password only for v1

## Context

- **Greenfield-for-product, brownfield-for-repo.** The monorepo is ~⅓ scaffolded: `apps/api` runs
  with a festival module; `packages/*` exist at varying completeness. `apps/mobile` and `apps/admin`
  do **not** exist yet. Auth, the `user` table, and any tests are absent (see `.planning/codebase/CONCERNS.md`).
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
| First cut is a navigable "shell" (auth + festival join + home), not full features | Get an end-to-end usable slice fast; add content features slice-by-slice (vertical MVP) | — Pending |
| Email/password auth only for v1 (no social login) | Simplest path via better-auth; OAuth deferrable | — Pending |
| Profile & Friends are placeholders this cycle | Real social/profile is meaningful scope; defer to keep the first slice lean | — Pending |
| Festival selection is list-only this cycle | Avoids native camera/QR work; code/QR join added later | — Pending |
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
*Last updated: 2026-07-29 after initialization*
