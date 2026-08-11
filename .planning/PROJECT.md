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
- ✓ The API exposes the OTP-auth + profile + festival browse/save endpoints this slice needs (contract-first): better-auth email-OTP behind a global login-first `AuthGuard`, `GET/POST /api/v1/me*` (profile completion, username availability, my festivals), `GET /api/v1/festivals`, gate-less `POST /api/v1/festivals/:festivalId/save` (409 profile-required guard), `festivalId` data isolation proven by tests — **Validated in Phase 2: OTP Auth & Festival Backend API** (SEC-01, SEC-02)
- ✓ An `Account` + `VisitorProfile` + `MyFestival` schema and better-auth (email-OTP) are wired into the NestJS API (env-configured Resend provider with dev console fallback; bodyParser smoke-tested; auth-annotation table reviewed) — **Validated in Phase 2: OTP Auth & Festival Backend API**
- ✓ The `apps/mobile` Expo (Expo Router, RN New Arch) app exists, talks to the real API through `packages/contracts` (ts-rest client with SecureStore cookie-forwarding, better-auth Expo client, TanStack Query), and enforces i18n from the first line of UI (Lingui catalogs DE/EN loaded, `no-literal-string` lint, `resolveUiLocale` German fallback); full core-value path (OTP login → festivals → save → gate-less enter → home) signed off on real Android hardware — **Validated in Phase 3: Mobile App Shell & i18n Foundation** (PLAT-02, I18N-01)
- ✓ Passwordless **email-OTP login** (email → 6-digit code → in; new email creates a better-auth `Account`), mandatory first-login **VisitorProfile completion** (unique `username` with live availability + `displayName`, optional avatar), returning-visitor **skip-profile** fast path, and a **long-lived auto-renewing session** (persists across restarts, re-auth via OTP on expiry) — **Validated in Phase 4: Visitor Auth & Profile Completion**
- ✓ A visitor can **browse all festivals** and **save** them to "Meine Festivals" (Meine/Alle segment, default Meine), **enter a festival gate-lessly** (no ticket/approval) landing on that festival's home, and the home shows a basic festival **overview**; festival-scoped reads are `festivalId`-isolated (SEC-02 cross-tenant test) and cold-start restores only the last-entered *saved* festival — **Validated in Phase 5: Festival Selection & Home** (SEC-02)

### Active

<!-- This build cycle: the "Visitor Shell" — a navigable, online vertical slice of the mobile app.
     Reconciled 2026-07-30 with the binding concept phase (docs/concept/04–10, ADR-009/014/016/020).
     Hypotheses until shipped and validated. -->

- [ ] The home exposes a **Profile** screen (view-only: username, displayName, avatar/initials, email)
- [ ] The home exposes a **Friends** screen (placeholder — friends who saved the same festival; none yet)
- [x] The `apps/mobile` Expo app exists and is wired to the real API through `packages/contracts` — **done in Phase 3** (PLAT-02, I18N-01)
- [x] Passwordless email-OTP login + first-login VisitorProfile completion + returning-user skip + long-lived session — **done in Phase 4**
- [x] Browse/save festivals (Meine/Alle) + gate-less enter + basic festival home overview — **done in Phase 5**

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
| Festival browse/save is list-based this cycle (no QR) | Avoids native camera/QR work; shared-link/QR save added later | ✓ Shipped Phase 5 |
| Online-assumed for this slice (offline architected, not implemented) | Login needs network anyway; no cacheable content yet | — Pending |
| Rename to **quiks** and CI v1.0 land together, not incrementally (ADR-023/ADR-024) | `scheme` ↔ `trustedOrigins` and bundle-ID ↔ native build are coupled; a partial rename breaks auth at runtime, not at build time | ✓ Shipped Phase 05.1 |
| **Hell-first**: Papier is the default surface, dark mode is the "night shift" | CI v1.0 is light-first; `apps/mobile/lib/theme.ts` resolves the device scheme per render, only exact `dark` yields the night set | ✓ Shipped Phase 05.1 |
| Repo folder + GitHub remote rename deferred to a **post-merge checklist** (D-15) | Renaming the remote mid-branch would break the open PR and every local clone; the ordered checklist is `05.1-RENAME-CHECKLIST.md` | — Pending |

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
*Last updated: 2026-08-11 — Phase 05.1 (quiks Rename & CI v1.0 Rollout) complete & verified, 16/16 must-haves (Verifikation Runde 2, nach Gap-Closure durch Quick-Task 260811-jz6). Der Code trägt durchgängig den Namen quiks (`@quiks/*`, Bundle-ID `at.quiks.app`, Scheme `quiks://` konsistent mit `trustedOrigins`), CI v1.0 ist verbindlich verdrahtet (Beere/Amber, Sunset als einziges Gradient-Token, Limette/Violett per Test ausgeschlossen), hell-first ist der Default, alle Screens und Komponenten lösen Farben pro Render auf, die Schriftrollen tragen echte Gewichte und ihr CI-Tracking (per Guard-Test gegen stilles Zurückfallen abgesichert), und sechs echte App-Icons ersetzen die Expo-Platzhalter. Geräteabnahme durch den Entwickler freigegeben. Offen: `05.1-SECURITY.md` (secure-phase), Repo-/Remote-Rename per D-15-Checkliste, sowie die Ledger-Einträge WINDOWS 25/30/31 (Mono-Rollen, Android Themed Icons, visuelle Wirkung des Trackings). Next: Phase 6 — Profile & Friends placeholders.*
