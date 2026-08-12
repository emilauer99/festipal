<!-- GSD:project-start source:PROJECT.md -->

## Project

**quiks**

quiks is a **multi-tenant festival app** (one festival = one tenant, reused across every
partnering festival). For visitors it brings the whole festival into one place: overview, site
map, timetable, news/updates, and cashless — plus two differentiators, a **camping-spot / ticket
swap marketplace** and **activities + connecting with friends**. It ships as an Expo mobile app
for visitors, a Next.js admin web for festival organizers, and a NestJS backend, all in one
Turborepo. This build cycle focuses on the **visitor mobile app**.

The ADR-024 rename has landed (phase 05.1): workspace packages are `@quiks/*`, the bundle ID is
`at.quiks.app` and the app URL scheme is `quiks`. Historical design assets under
`docs/concept/designs/` deliberately keep their original filenames as history.

**Core Value:** A festival visitor can get into the app, connect to their festival, and reach everything about
their festival experience from one home screen. If everything else fails, that entry-and-home
path must work.

### Constraints

- **Tech stack**: Turborepo/pnpm · Expo + Expo Router (RN New Arch) mobile · Next.js 15 admin · NestJS API · ts-rest+Zod contracts · Drizzle/Neon Postgres · better-auth · Redis realtime · MapLibre · Lingui i18n — Decided across ADRs 001–015; don't re-litigate without an ADR.
- **TypeScript**: strict mode everywhere, pinned to TS 6.0.x (TS 7 pending typescript-eslint support — ADR-013). No untyped `any` at API boundaries.
- **Architecture (non-negotiable)**: multi-tenancy from day 1 (every domain model/query festival-scoped) · offline-first by design (don't assume network) · end-to-end type safety via `packages/contracts` · i18n from day 1 (no hardcoded user-facing strings) · tenant-aware auth · no secrets in repo.
- **Git**: trunk-based, short-lived feature branches, Conventional Commits, squash-merge via PR — never commit to `main` (`docs/GIT_CONVENTIONS.md`).
- **Validation**: Zod schemas in `packages/contracts` are the source of truth; reuse, don't re-declare.
- **Brand/Design**: ADR-023 + `docs/brand/quiks-ci-v1.md` — Beere/Amber; Sunset is the only allowed gradient; hell-first (light-first); Limette/Violett are now CI-token fallback only, not brand colors. The ADR-024 rename has landed in phase 05.1 — `@quiks/*` / `at.quiks.app` / scheme `quiks` are the current names.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

Full inventory lives in `.planning/codebase/STACK.md` — read it only when a task turns on
an exact version, deployment target or workspace script. Load-bearing facts:

- TypeScript 6.0.3 workspace-wide (strict) · Node ≥22 · pnpm 11.17 · Turborepo
- Expo/RN New Arch (`apps/mobile`) · Next.js 15 + React 19 (`apps/admin`) · NestJS 11 (`apps/api`)
- ts-rest 3.52 + Zod 3.25 (`packages/contracts`) · drizzle-orm 0.45 + Postgres (`packages/db`) · Lingui 6 (`packages/i18n`)
- API port 8081 · env via Zod in `apps/api/src/config/env.ts` · Neon (prod) / Docker Postgres (local dev)
- Deploy: Railway (API) · Neon (DB) · EAS Build/Submit/Update (mobile)

> Kept deliberately short — this file is re-read by every agent on every invocation.
> Do not let `/gsd-map-codebase` re-inflate it; the detail belongs in `.planning/codebase/`.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Full list in `.planning/codebase/CONVENTIONS.md`. What actually gets enforced:

- Prettier: semi, single quotes, trailing comma `all`, width 100, tab 2 — config is authoritative, don't hand-format
- ESLint 10 flat config, shared base in `packages/config/eslint.config.base.mjs`
- Named exports only, no defaults. Barrel `index.ts` per package.
- Types inferred from Zod (`z.infer`), never re-declared. `import type` explicit.
- Nullable for "not found" (`Promise<T | null>`); never return `undefined`.
- Explicit return types on public signatures; no `any` at API boundaries (use `unknown` + narrow).
- NestJS file suffixes: `.module.ts` / `.service.ts` / `.controller.ts`; constructor injection.
- Cite architectural decisions inline: `// ADR-011: Cashless via embedded URL`
- Cross-package imports use workspace names (`@quiks/contracts`); relative paths within a package.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Full map in `.planning/codebase/ARCHITECTURE.md`. The rules that constrain every change:

- **Contracts first.** `packages/contracts` is the single source of truth for API shape. Server and
  both clients derive types from it — an endpoint change starts there (ADR-006).
- **Tenant scope everywhere.** Every tenant-scoped table carries `festivalId` FK; every query filters
  on it. `festivalId` flows from the request — services never assume a default festival (ADR-014).
- **Locale resolved server-side, two axes** (ADR-012): UI locale (device/app) and content locale
  (festival). Translatable entities use a `*_translation` companion table keyed `(entityId, locale)`;
  fallback chain is requested → festival `defaultLocale` → any.
- **`packages/*` must not import from `apps/*`.** Apps import packages, never the reverse.
- **Pooler-safe DB.** Drizzle client uses `prepare: false` behind Neon pgBouncer (ADR-005).
- **Turbo enforces build order** — packages build before dependent apps.

Layout: `apps/{mobile,admin,api}` · `packages/{contracts,db,ui,i18n,config}`.
API entry `apps/api/src/main.ts`; health at `GET /api/v1/health`.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

In `.claude/skills/` — invoke by name when the task matches:
`nestjs-best-practices` · `nextjs-app-router-patterns` · `nextjs-turbopack` ·
`react-native-architecture` · `react-native-design` · `ui-ux-pro-max`
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

## Parallel Workstreams (GSD)

> Hand-written section, deliberately placed after the last GSD marker block so a regeneration
> cannot overwrite it.

`.planning/` runs in **workstream mode**: two streams are planned concurrently by two Claude
sessions against the same monorepo.

| Workstream | Scope | Code |
|---|---|---|
| `mobile` | Visitor Expo app — v1.0 Rollout, Phase 6 next | `apps/mobile` |
| `admin` | Admin/staff web UI — own milestone, not started | `apps/admin` (not scaffolded yet) |

`ROADMAP.md`, `STATE.md`, `REQUIREMENTS.md` and `phases/` are per-stream under
`.planning/workstreams/<name>/`. `PROJECT.md`, `config.json`, `codebase/`, `research/`, `quick/`,
`debug/`, `scripts/`, `WINDOWS.md` and `ui-reviews/` stay shared at `.planning/` — both streams
read the same ADRs and project decisions.

**Scope every GSD command to a stream.** Pass `--ws mobile` / `--ws admin`, or set
`GSD_WORKSTREAM` in the terminal before launching the session. Unscoped, GSD can resolve the other
stream's `STATE.md`.

**Serialize shared-package changes.** `packages/contracts` and `packages/db` are where the two
streams genuinely collide: `drizzle-zod` propagates a schema change into every app, so concurrent
edits break the other stream's typecheck. Only one stream touches them at a time. Admin's
identity/staff-role work must be **additive** — new tables, no changes to `visitor_profile` or
`my_festival` (ADR-014/016/021). `packages/ui` is shared as well: mobile consumes the RN tokens,
admin consumes Tailwind/shadcn (ADR-022) — how CI v1.0 tokens bridge into Tailwind needs an ADR
before admin styling starts.

**Local infrastructure is shared.** Only one session runs the API on 8081 (Metro defaults to 8081
too); admin's Next.js takes 3000. Both streams use the one local Docker Postgres — `docker-compose.yml`
carries an explicit `name: quiks`, so the stack is controllable from either worktree and does not
depend on the directory name.
