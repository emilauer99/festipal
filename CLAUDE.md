# CLAUDE.md

Guidance for Claude Code when working in the **festipal** repository.

## Project Overview

festipal is a festival app: overview, site map (Lageplan), timetable, news/updates and
cashless integration — plus two differentiating features: a **festival & camping-spot
swap marketplace** and **activities / connecting with friends**. Long-term goal: one
**multi-tenant** app reused across every partnering festival (one festival = one tenant).

Full rationale and the decision log live in `docs/DEVELOPMENT_DECISIONS.md` — read it
before making architectural changes.

> **Status: greenfield.** The monorepo is being scaffolded. Commands and paths below are
> the intended structure; update this file with exact commands as scaffolding lands.

## Tech Stack

- **Monorepo:** Turborepo + pnpm
- **Mobile app** (`apps/mobile`): React Native (New Architecture) + Expo + Expo Router + TypeScript; deploy via EAS (Build/Submit/Update OTA)
- **Admin web** (`apps/admin`): Next.js 15 + React 19 + shadcn/ui + Tailwind
- **Backend** (`apps/api`): NestJS (TypeScript)
- **API contracts** (`packages/contracts`): ts-rest + Zod — single source of truth for endpoints & types
- **Database** (`packages/db`): PostgreSQL + Drizzle ORM (Neon)
- **Auth:** better-auth (self-hosted, tenant-aware)
- **Realtime:** NestJS WebSocket gateway + Redis adapter
- **Hosting:** Neon (DB) · Railway (backend + Redis)
- **Offline:** Expo SQLite/MMKV + Drizzle + TanStack Query (persisted) + mutation queue
- **Cashless:** per-festival embedded URL (WebView in app / iframe in admin) — no own payment system
- **Maps:** MapLibre
- **Tests:** Vitest (unit) · Playwright (web E2E) · Maestro/Detox (app E2E)

## Repository Structure

```
apps/       mobile (Expo) · admin (Next.js) · api (NestJS)
packages/   contracts (ts-rest+Zod) · db (Drizzle) · ui (tokens/primitives) · config (eslint/tsconfig)
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

## Conventions

- **Language:** TypeScript everywhere, `strict` mode on. No untyped `any` at API boundaries.
- **Validation:** Zod schemas in `packages/contracts` are the source of truth; reuse them, don't re-declare shapes.
- **Shared code:** cross-app logic/types belong in `packages/*`, never copy-pasted between apps.
- **Git:** Trunk-based, short-lived feature branches, Conventional Commits, squash-merge via PR — **never commit directly to `main`**. Full rules in `docs/GIT_CONVENTIONS.md`.
- **Before finishing a change:** run lint, typecheck and the relevant tests; report failures honestly.

## Claude Code Working Notes

- **Model:** Opus 4.8 default; Sonnet 5 for high-volume mechanical work.
- Prefer the monorepo's shared packages over local re-implementations.
- When a decision is architectural, record it in `docs/DEVELOPMENT_DECISIONS.md` (ADR format).
