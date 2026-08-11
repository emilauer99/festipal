# CLAUDE.md

Guidance for Claude Code when working in the **quiks** repository.

## Project Overview

quiks is a festival app: overview, site map (Lageplan), timetable, news/updates and
cashless integration — plus two differentiating features: a **festival & camping-spot
swap marketplace** and **activities / connecting with friends**. Long-term goal: one
**multi-tenant** app reused across every partnering festival (one festival = one tenant).

Full rationale and the decision log live in `docs/DEVELOPMENT_DECISIONS.md` — read it
before making architectural changes.

> **Status: greenfield.** The monorepo is being scaffolded. Commands and paths below are
> the intended structure; update this file with exact commands as scaffolding lands.

## Brand & Design

- Binding brand source: [`docs/brand/quiks-ci-v1.md`](docs/brand/quiks-ci-v1.md) (ADR-023, quiks CI v1.0).
- Primary Beere `#E8559F`, secondary Amber `#FFC53D`.
- Sunset (150° Amber → Beere) is the only allowed gradient — mark, hero and avatar/identity surfaces
  only (list widened app-wide in phase 06 per D-07; ADR-023 carries the amendment note).
- Hell-first (light-first): Papier `#F7F5F2` is the default surface; dark mode is the "night shift".
  Wired up in phase 05.1: `apps/mobile/lib/theme.ts` resolves the device scheme, and only the exact
  value `dark` yields the night-shift set — everything else, including an unresolved scheme, yields
  `lightColors`. Both modes are live, so treat light as the case to check first.
- The Outfit roles carry their CI tracking in the `typeRoles` tokens: a style that takes its size
  from a tracked role must set that role's `letterSpacing` too — the `apps/mobile` suite fails if it
  does not.
- The ADR-024 rename has LANDED (phase 05.1): packages are `@quiks/*`, the bundle ID is
  `at.quiks.app` and the app URL scheme is `quiks`. Nothing in the codebase carries the old
  product name any more — historical design assets under `docs/concept/designs/` keep their
  original filenames on purpose and are the only exception.
- The wordmark renders as lowercase `quiks` with a separately-coloured trailing period; it is
  a proper noun and is never wrapped in Lingui.

## Tech Stack

- **Monorepo:** Turborepo + pnpm
- **Mobile app** (`apps/mobile`): React Native (New Architecture) + Expo + Expo Router + TypeScript; deploy via EAS (Build/Submit/Update OTA); custom components built on RN primitives in `packages/ui`, styled exclusively via shared design tokens — NO third-party UI component library (ADR-022)
- **Admin web** (`apps/admin`): Next.js 15 + React 19 + shadcn/ui + Tailwind; minimize hand-written CSS (Tailwind utilities + shadcn components; custom CSS needs justification) (ADR-022)
- **Backend** (`apps/api`): NestJS (TypeScript)
- **API contracts** (`packages/contracts`): ts-rest + Zod — single source of truth for endpoints & types
- **Database** (`packages/db`): PostgreSQL + Drizzle ORM (Neon)
- **Auth:** better-auth (self-hosted, tenant-aware)
- **Realtime:** NestJS WebSocket gateway + Redis adapter
- **Hosting:** Neon (DB) · Railway (backend + Redis)
- **Offline:** Expo SQLite/MMKV + Drizzle + TanStack Query (persisted) + mutation queue
- **Cashless:** per-festival embedded URL (WebView in app / iframe in admin) — no own payment system
- **i18n** (`packages/i18n`): Lingui (UI strings, ICU + type-safe) shared by app & admin; `Intl` for date/number formatting; dynamic content translated via DB translation tables with per-festival locales
- **Maps:** MapLibre
- **Tests:** Vitest (unit) · Playwright (web E2E) · Maestro/Detox (app E2E)

## Repository Structure

```
apps/       mobile (Expo) · admin (Next.js) · api (NestJS)
packages/   contracts (ts-rest+Zod) · db (Drizzle) · ui (tokens/primitives) · i18n (Lingui catalogs) · config (eslint/tsconfig)
docs/       DEVELOPMENT_DECISIONS.md and other design docs
```

## Development Commands

All commands run from the repo root via pnpm + Turborepo (exact scripts finalized during scaffolding):

- **Install:** `pnpm install`
- **Dev (all):** `pnpm dev` — or per app: `pnpm --filter mobile dev`, `--filter admin dev`, `--filter api dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Typecheck:** `pnpm typecheck`
- **Test:** `pnpm test`
- **DB migrations:** `pnpm --filter db migrate`
- **App build (stores):** `eas build` · **Submit:** `eas submit` · **OTA:** `eas update`

## Architecture Principles (non-negotiable)

1. **Multi-tenancy from day 1** — every domain model and query is festival-scoped. Never expose or query cross-tenant data without an explicit, checked tenant context.
2. **Offline-first from day 1** — map, timetable, ticket/wallet must work with no connectivity. Don't assume the network.
3. **End-to-end type safety** — no untyped API boundaries. API shape changes go through `packages/contracts`; both server and clients derive their types from it.
4. **Security** — never store or process card/payment data. Cashless is a per-festival embedded URL: load the festival's own cashless page over HTTPS in a sandboxed WebView (app) / iframe (admin), restricted to the configured domain; hide the section when no URL is set. No secrets in the repo. Auth must be tenant-aware.
5. **Design fidelity** — the frontend follows the designs the user creates in Claude Design (claude.ai/design); match them precisely.
6. **i18n from day 1** — app and admin are multilingual. No hardcoded user-facing strings: UI text goes through Lingui catalogs in `packages/i18n`; dynamic content is stored per-locale (translation tables) with a per-festival default/fallback locale. Keep layouts RTL-safe.

## Conventions

- **Language:** TypeScript everywhere, `strict` mode on. No untyped `any` at API boundaries. Pinned to **TypeScript 6.0.x** (ecosystem compat; TS 7 native pending typescript-eslint support — see ADR-013).
- **Validation:** Zod schemas in `packages/contracts` are the source of truth; reuse them, don't re-declare shapes.
- **Shared code:** cross-app logic/types belong in `packages/*`, never copy-pasted between apps.
- **UI components:** mobile uses owned RN-primitive components in `packages/ui` styled via shared tokens (no third-party UI kit); admin uses shadcn/ui + Tailwind with minimized custom CSS — see ADR-022.
- **Git:** Trunk-based, short-lived feature branches, Conventional Commits, squash-merge via PR — **never commit directly to `main`**. Full rules in `docs/GIT_CONVENTIONS.md`.
- **Parallel workstreams:** GSD planning is split into `.planning/workstreams/{mobile,admin}/` — the visitor app and the admin/staff UI are planned by two concurrent sessions. Scope every GSD command with `--ws`. `packages/contracts`, `packages/db` and `packages/ui` are the shared collision zones: only one stream changes them at a time, and admin's schema work must be additive. Details in `.claude/CLAUDE.md`.
- **Before finishing a change:** run lint, typecheck and the relevant tests; report failures honestly.

## Claude Code Working Notes

- **Model:** Opus 4.8 default; Sonnet 5 for high-volume mechanical work.
- Prefer the monorepo's shared packages over local re-implementations.
- When a decision is architectural, record it in `docs/DEVELOPMENT_DECISIONS.md` (ADR format).
