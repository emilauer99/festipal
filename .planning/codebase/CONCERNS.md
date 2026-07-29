# Codebase Concerns

**Analysis Date:** 2026-07-29

## Scaffolding Gaps

### Missing Application Packages

**Critical incomplete structure:**
- Missing: `apps/mobile/` (React Native + Expo — ADR-001)
- Missing: `apps/admin/` (Next.js 15 + React 19 — ADR-003)
- Files: Should be under `apps/mobile/` and `apps/admin/` per pnpm-workspace.yaml
- Impact: Monorepo is only 33% scaffolded; frontend development blocked until apps exist
- Fix approach: Create `apps/mobile/package.json`, `app.json` (Expo config), Expo Router structure; create `apps/admin/package.json`, Next.js config

### Missing Database Schema for Authentication & Global Data

**Critical gap in ADR-009 & ADR-014:**
- Files: `packages/db/src/schema/` missing `user.ts`, `session.ts`, and friend/relationship tables
- Issue: better-auth integration cannot start without user schema. ADR-014 states "User-global (kein Tenant)" but no `user` table exists.
- Current schema: Only festival-scoped entities (festival, tag, festivalLocale) defined; no global user context
- Impact: Auth cannot be wired; all endpoints will remain public until user schema + auth guards exist
- Fix approach: 
  1. Define `user` table (id, email, name, passwordHash, createdAt, updatedAt, locale preference) in `packages/db/src/schema/user.ts`
  2. Define better-auth session schema per ADR-009
  3. Add friend/relationship tables for the "Friends" feature (global, not festival-scoped)

### No Authentication Implementation

**Blocker for security and multi-tenancy:**
- Files: `apps/api/src/` missing auth module, NestJS guards, session middleware
- Issue: ADR-009 specifies better-auth (TypeScript, self-hosted, tenant-aware) but no integration code exists
- Current state: `apps/api/src/config/env.ts` has BETTER_AUTH_SECRET and BETTER_AUTH_URL as optional, but no library dependency or implementation
- Impact: All endpoints public; no permission checks; can't enforce tenant isolation
- Fix approach:
  1. Add better-auth to `apps/api/package.json` dependencies
  2. Create `apps/api/src/auth/` module with BetterAuth setup, session validation
  3. Create `AuthGuard` for protecting endpoints (verify JWT/session, extract userId, set request context)
  4. Create `TenantGuard` for enforcing festival-scoped access (verify user can access requested festivalId)
  5. Apply guards to all festival-scoped endpoints in contracts

### No Auth Endpoints or Contracts

**Missing from `packages/contracts/src/router.ts`:**
- No sign-up, sign-in, sign-out endpoints
- No user profile endpoints (get/update)
- No password reset flow
- Impact: Apps cannot authenticate or manage sessions
- Fix approach: Extend `packages/contracts/src/router.ts` with auth routes: POST /auth/sign-in, POST /auth/sign-up, POST /auth/sign-out, GET /auth/me, POST /auth/refresh

### No Test Framework Configuration

**Completely missing:**
- Files: `apps/api/`, `packages/contracts/`, `packages/db/` have no vitest.config.ts
- Missing: No jest/vitest in any app package.json
- Missing: No Playwright config for web E2E (needed for `apps/admin`)
- Missing: No Maestro/Detox config for mobile E2E (needed for `apps/mobile`)
- Impact: ADR mentions Vitest + Playwright + Maestro/Detox but zero tests can be written
- Fix approach:
  1. Add `vitest` and `@vitest/ui` to root devDependencies
  2. Create vitest.config.ts in `apps/api/` and each package
  3. Add `packages/db/` test fixtures (in-memory SQLite for unit tests)
  4. Reserve Playwright and Maestro config for when web/mobile apps exist

### No i18n Catalogs or Configuration

**`packages/i18n` exists but is empty:**
- Files: `packages/i18n/src/` lacks Lingui configuration, message catalogs, locale definitions
- Issue: ADR-012 specifies Lingui for UI strings + Intl for formatting + DB translation tables, but no setup visible
- Current: Only `@lingui/core` in dependencies; no message extraction, compile, or locale files
- Impact: No i18n infrastructure; can't run app in multiple languages
- Fix approach:
  1. Create `packages/i18n/lingui.config.js` with locale configuration (de, en)
  2. Create `packages/i18n/src/locales/` directory with `messages.po` files per locale
  3. Create TypeScript type exports for message keys (via Lingui macro)
  4. Document message extraction workflow in CLAUDE.md

### No UI Package Implementation

**`packages/ui` is a shell:**
- Files: `packages/ui/src/` likely empty or minimal (no components, tokens, or exports)
- Issue: ADR-015 specifies Design System (tokens + components) as foundational; apps/mobile and apps/admin depend on it
- Impact: No reusable component library; frontend build can't start
- Fix approach:
  1. Create `packages/ui/src/tokens.ts` (CSS-in-JS or export object with semantic color/spacing aliases per Brand Guide)
  2. Create `packages/ui/src/components/` with atomic design primitives (Button, Card, etc.) for React Native + React Web
  3. Document token consumption in `packages/ui/README.md`

---

## Architectural Risks

### Environment Loading Called Twice

**Risk in bootstrap logic:**
- Files: `apps/api/src/main.ts` (line 10: `loadEnv()`) and `apps/api/src/config/config.module.ts` (line 9: `loadEnv()`)
- Issue: `loadEnv()` is synchronous and throws if validation fails. Calling it twice doubles error risk and could cause confusion if process.env is modified between calls
- Impact: Harder to debug startup failures; if an env var is optional in one call but required in another, silent failures possible
- Fix approach: Call `loadEnv()` once in main.ts, pass result to AppModule via factory, or use NestJS ConfigService pattern (single source)

### Missing Environment Documentation

**No `.env.example` file:**
- Issue: Developers don't know which environment variables are required (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, PORT)
- Impact: Developers must read source code to understand setup; CI/CD may fail silently if env vars missing
- Fix approach: Create `.env.example` in repo root with all required and optional vars documented

### Tenant Context Not Propagated to Requests

**Gap in ADR-014 multi-tenancy implementation:**
- Files: Controllers in `apps/api/src/festival/` accept `festivalId` as path param, but no request middleware extracts active tenant context
- Issue: ADR-014 states "each festival-scoped Request/Query carries a geprüfte festivalId" but no auth/middleware layer verifies:
  1. User is authenticated
  2. User has access to the requested festival
  3. Request context holds the tenant ID for logging/audit
- Impact: Endpoints can be called without auth; cross-tenant access not prevented at middleware level
- Fix approach:
  1. Create `TenantMiddleware` that extracts festivalId from path/header and verifies user access
  2. Store tenant context in NestJS request object (`req.user` + `req.festivalId`)
  3. Use guards to enforce presence

### Endpoint Mutations Not Protected

**Only GET endpoints implemented:**
- Files: `apps/api/src/festival/festival.controller.ts` implements GET getFestival and listTags
- Issue: No POST/PUT/DELETE for creating/updating festivals or tags; when added, they must check ownership/permissions
- Impact: Once admin endpoints are built, risk of unprotected mutations (anyone can create festival, delete others' tags)
- Fix approach: When adding mutation endpoints, always require auth + tenant context + ownership check

### No Server-Side Input Validation Beyond Zod

**Validation gaps:**
- Files: `packages/contracts/src/schemas.ts` has Zod schemas, but no NestJS Pipes shown using them
- Issue: Requests are validated at schema level (ts-rest decorator), but business logic validation missing
  - E.g., festival.slug must be unique, but no db-level check shown in service
  - Tag creation must verify tag doesn't already exist in that festival (business logic)
- Impact: Duplicate data, inconsistent state if race conditions occur
- Fix approach:
  1. Add NestJS ValidationPipe to app bootstrap
  2. In service layer, add duplicate-key exception handling with user-friendly errors
  3. Use database constraints (UNIQUE on festival.slug, on (festival_id, tag.slug)) as final guard

### Cashless URL Not Validated for Domain Restriction

**ADR-011 compliance gap:**
- Files: `packages/db/src/schema/festival.ts` line 16: `cashlessUrl: text()` — no validation
- Issue: URL should be validated to a whitelisted domain or at least HTTPS-only; ADR-011 says WebView/iframe should be restricted to "configured domain" but no validation layer shown
- Impact: Admin could set a URL to malicious site; app would load it in WebView without protection
- Fix approach:
  1. Add Zod validator in `packages/contracts/src/schemas.ts`: festival schema should validate `cashlessUrl` is HTTPS and domain matches configured whitelist
  2. Document per-festival cashless domain config requirement in CLAUDE.md
  3. Store domain in festival record so app can validate at runtime

---

## Security Considerations

### All Endpoints Currently Public

**Immediate risk:**
- Files: All controllers (`apps/api/src/*/`) lack auth guards
- Issue: No authentication required for any endpoint; public access until better-auth integrated
- Impact: 
  - Festival data readable by anyone
  - Tag data readable by anyone
  - Once write endpoints added, anyone can create/delete data
  - Rate limiting absent; endpoints vulnerable to scraping/DoS
- Mitigation: Mark all endpoints as @Public explicitly (or require auth by default) once AuthGuard integrated
- Fix approach:
  1. Add AuthGuard to AppModule as global guard
  2. Mark public endpoints (e.g., /health) with @Public() decorator
  3. Add rate limiting middleware (e.g., @nestjs/throttler)

### Environment Secrets Marked Optional

**Risk:**
- Files: `apps/api/src/config/env.ts` lines 6-7: BETTER_AUTH_SECRET and BETTER_AUTH_URL marked `.optional()`
- Issue: Auth cannot function without these; making them optional masks misconfiguration
- Impact: App starts but auth fails silently; unclear error messages in production
- Fix approach: Remove `.optional()` when integrating better-auth; make auth secrets required; add startup validation that throws if auth config missing

### No CORS Configuration

**Potential security gap:**
- Files: `apps/api/src/main.ts` — no `enableCors()` call visible
- Issue: If CORS is misconfigured or absent, either:
  1. Browser requests from apps/admin blocked (if CORS too restrictive)
  2. Requests from any origin allowed (if CORS too permissive)
- Impact: Frontend can't call API, or API open to cross-origin attacks
- Fix approach: Add NestJS `enableCors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' })` with explicit whitelist

### No Request ID / Distributed Tracing

**Observability gap:**
- Files: No middleware for request tracing
- Issue: When errors occur in production, can't trace requests through logs (e.g., which user, which festival)
- Impact: Debugging multi-tenant issues slow; can't audit who accessed what
- Fix approach:
  1. Add NestJS middleware that generates request ID (UUID or timestamp+hash)
  2. Attach to all logs via context
  3. Return request ID in error responses for user support

### No Rate Limiting

**Denial-of-service risk:**
- Files: No throttling middleware
- Issue: Public endpoints (GET /festivals/:slug) can be hammered without limit
- Impact: Scrapers can download entire festival database; service degradation
- Fix approach: Add `@nestjs/throttler` with sensible limits (e.g., 100 req/min per IP for public endpoints, 1000 req/min for auth)

---

## Multi-Tenancy Risks

### User-Global Relationships Not Yet Defined

**Gap in ADR-014 data model:**
- Files: `packages/db/src/schema/` missing tables for friends (global), followed artists (global), global news, global settings
- Issue: ADR-014 specifies two data classes:
  - User-global: account, profile, friends, followed artists, global news
  - Festival-scoped: timetable, map, news, marketplace, presence
  - Current schema only has festival-scoped entities
- Impact: Can't implement Friends feature or global user context
- Fix approach: Create `user.ts` with user table, and `friendship.ts` with friendship/follower tables (no festivalId)

### Presence/Location Schema Missing

**ADR-014 specifies presence as festival-scoped, not user-global:**
- Files: `packages/db/src/schema/` missing `presence.ts`, `location.ts`
- Issue: "Crew" = friends who are attending this festival; presence/standort only exist during event
- Current state: No schema for tracking "who is here now" per festival
- Impact: "Crew" / "wer ist hier" features can't be built
- Data privacy risk: Location is sensitive; needs TTL and retention policy
- Fix approach:
  1. Create `packages/db/src/schema/presence.ts` with schema:
     - `id, userId (ref user), festivalId (ref festival), location (geometry?), lastSeen (ts), visibility (friends|none), createdAt, expiresAt`
  2. Add TTL policy (e.g., delete presence 1 week after festival ends)
  3. Document DSGVO compliance in ADR-014

### No Audit Trail for Multi-Tenant Operations

**Compliance & debugging gap:**
- Files: No audit/activity log schema
- Issue: Can't track "who created this tag, when, why"
- Impact: Can't debug data integrity issues; no audit trail for support/legal
- Fix approach: Add optional `packages/db/src/schema/audit.ts` with schema:
  - `id, userId, festivalId, action (create|update|delete), entity (tag, festival), entityId, before, after, createdAt`
  - Populate via database triggers or Drizzle hooks

### No Per-Request Tenant Validation

**Critical gap:**
- Files: All festival-scoped endpoints missing check that user has access to the requested festival
- Issue: Controller accepts `festivalId` from path but doesn't verify user is authorized
  - Example: listTags(`festivalId`) — any user can request any festival's tags by guessing festivalId
- Impact: Data isolation broken; user can enumerate all festivals and read all their data
- Fix approach: Create `TenantGuard` that:
  1. Extracts userId from auth context
  2. Verifies user has an active session/registration for that festival
  3. Throws 403 if not authorized
  4. Stores tenant in request context for downstream services

---

## Performance & Scaling Risks

### No Database Connection Pooling Configured

**ADR-005 mentions pooling but not implemented:**
- Files: `packages/db/src/client.ts` — unclear if pooled vs. direct URL used
- Issue: ADR-005 says "gepoolte URL für serverless/Edge-Zugriffe; Drizzle-Migrationen nutzen die direkte, nicht-gepoolte URL"
  - No env var separates pooled/direct URLs
  - No comment documents strategy
- Impact: Serverless deploys may exhaust connections; migrations might fail due to pooling
- Fix approach:
  1. Create env vars: `DATABASE_URL` (pooled, for app) and `DATABASE_URL_DIRECT` (direct, for migrations)
  2. Export both from client, use pooled for queries, direct for migrations
  3. Document in `.env.example` and CLAUDE.md

### No N+1 Query Optimization Visible

**Potential performance issue:**
- Files: `apps/api/src/festival/festival.service.ts` line 32-35: listTags does LEFT JOIN to fetch translations
  - Currently returns all translations per tag, then filters in JavaScript
  - If a festival has 1000 tags × 10 locales, transfers 10k rows
- Issue: No pagination shown; no limit on result size
- Impact: Large festivals slow; memory spike for big result sets
- Fix approach:
  1. Add pagination to listTags contract (limit, offset or cursor-based)
  2. Use database-side filtering: `WHERE locale IN (?, ...)` to only fetch requested locale

### No Database Indexes Strategy

**Schema defined but no indexes**
- Files: `packages/db/src/schema/` tables have unique constraints but no covering indexes
- Issue: Queries like `WHERE festivalId = ? AND slug = ?` need index on (festivalId, slug) for performance
- Impact: As data grows, queries slow down
- Fix approach: Document index strategy in `packages/db/README.md` and ensure Drizzle migrations create covering indexes

---

## Offline-First & Real-Time Risks (ADR-007)

### Mutation Queue Not Implemented

**Critical for offline feature:**
- Files: `apps/mobile/` doesn't exist, but ADR-007 specifies "kleine Mutation-Queue, die bei Reconnect abgearbeitet wird"
- Issue: No queue for offline writes (favorites, marketplace edits); can't sync when reconnected
- Impact: Offline writes are lost if app closed before sync
- Fix approach: When building apps/mobile, use SQLite-backed queue (e.g., Watermelon DB or custom) + TanStack Mutation to process queue on reconnect

### Conflict Resolution Strategy Undefined

**When offline changes conflict with server:**
- Issue: ADR-007 says "pragmatischer Layered-Cache" but doesn't specify merge strategy
  - If user favorites a tag while offline, then server deletes that tag, what happens?
  - If user edits marketplace listing offline, then another user updates it, whose changes win?
- Impact: Silent data loss or confusing UX
- Fix approach: Document conflict resolution policy:
  1. Last-write-wins (simple, user loses edits)
  2. Client-wins (user keeps local edits, server version discarded)
  3. Merge (smart resolution per entity type)
  - Recommend: "Client-wins for user-owned data, Server-wins for read-mostly data"

### No Sync / Reconnect Strategy

**Missing in offline stack:**
- Issue: TanStack Query with persistence + mutation queue mentioned but no sync orchestration visible
- Impact: After reconnect, unclear which queries to refetch, which mutations to retry
- Fix approach: Document sync strategy when building apps/mobile:
  1. On reconnect, prioritize mutation queue playback
  2. Then refetch stale queries
  3. Show user toast if conflicts occur

---

## Internationalization Risks (ADR-012)

### Translation Fallback Logic Not Tested

**Implementation exists but untested:**
- Files: `apps/api/src/festival/festival.service.ts` line 80: uses `resolveLocalized(titles, locale, festival.defaultLocale)` helper from contracts
- Issue: Helper is imported but implementation unclear; no test coverage
- Impact: If fallback logic breaks, users see missing/wrong translations silently
- Fix approach: Add unit tests for `resolveLocalized()` in `packages/contracts/` covering:
  - Requested locale exists → return it
  - Requested locale missing → fallback to default
  - Neither exists → return empty string or error

### No RTL Layout Support

**Required by ADR-012:**
- Issue: ADR says "Layout von Anfang an RTL-fähig halten" but no React Native styling or CSS shown
- Impact: When Arabic/Hebrew locales added, app breaks or looks bad
- Fix approach (when mobile app built):
  1. Use React Native `I18nManager.forceRTL(isRTL)` in main.ts
  2. Use flexbox `flexDirection: 'column-reverse'` pattern or `react-native-bidi-utils`
  3. In Next.js admin, use CSS Logical Properties (`margin-inline-start` not `margin-left`)

### Missing Per-Festival Locale Validation

**Risk in API:**
- Files: `apps/api/src/festival/festival.service.ts` line 48: `listTags(festivalId, requested?: Locale)` accepts any locale
- Issue: No check that `requested` is in `festival.supportedLocales`
  - If user requests /api/v1/festivals/123/tags?locale=ar but festival only supports de,en, should fail gracefully
- Impact: Confusing UX; might return default locale without indication
- Fix approach: In listTags, validate requested locale is in supportedLocales; return 400 or fall back silently but consistently

### No Admin Translation UI

**ADR-012 specifies translation tables but no admin interface:**
- Issue: Festivals need to add/edit translations but no admin endpoint defined
- Impact: Content created in one locale only; multi-lingual support incomplete
- Fix approach: When building apps/admin, add screens for:
  1. Festival settings → supported locales, default locale
  2. Content (tags, news) → translation editor showing which locales complete, which missing

### Dynamic Content Translation Tables Missing

**Schema incomplete:**
- Files: `packages/db/src/schema/` has tag_translation but missing tables for news, timetable, vendors, marketplace, activities (all mentioned in docs/concept as translatable)
- Issue: Only tag has translation schema; other entities need same pattern
- Impact: Can't ship multi-lingual content for full app; schema needs expanding
- Fix approach: Create translation tables following tag pattern for all content entities:
  - `news_translation(newsId, locale, title, body)`
  - `timetable_event_translation(eventId, locale, name, description)`
  - etc.

---

## Type Safety & Validation Risks

### Database Types Not Exported

**Gap between DB schema and contracts:**
- Files: `packages/db/src/schema/` defines tables but no TypeScript type exports
- Issue: `packages/contracts/src/schemas.ts` manually redeclares types (Festival, Tag) instead of deriving from DB schema
- Impact: Schema changes aren't reflected in API contracts automatically; risk of drift
- Fix approach:
  1. Export Drizzle schema types from `packages/db/dist/schema/index.d.ts`
  2. In `packages/contracts`, derive Zod schemas from those types using Drizzle type inference
  3. Single source of truth: database schema

### Error Response Types Inconsistent

**Different shapes across endpoints:**
- Files: `packages/contracts/src/router.ts` lines 9, 27: some endpoints use `{ message: string }` for errors
- Issue: No consistent error schema across API
  - Some might return `{ error: { code, message } }`, others `{ message }`, others status-only
- Impact: Frontend can't parse errors consistently; error handling fragile
- Fix approach: Define error schema in contracts:
  ```typescript
  export const errorSchema = z.object({
    code: z.enum(['NOT_FOUND', 'UNAUTHORIZED', ...]),
    message: z.string(),
    traceId: z.string().optional(),
  });
  ```
  Use in all endpoint error responses.

### No Request/Response Validation Middleware

**Zod schemas unused:**
- Files: Contracts define schemas but no NestJS Pipes shown validating requests
- Issue: Type safety at API level incomplete; if frontend sends wrong type, server accepts it
- Impact: Runtime errors in business logic; no early validation
- Fix approach: Apply NestJS ValidationPipe globally in main.ts or per-controller

### No Type Guards for Auth Context

**When better-auth integrated, need strong typing:**
- Issue: Once AuthGuard sets `req.user`, downstream services need assurance it's typed
- Impact: Using `req.user.id` could fail if user not logged in (guard should prevent, but type system doesn't enforce)
- Fix approach: Define NestJS request type with auth context:
  ```typescript
  declare global {
    namespace Express {
      interface Request {
        user?: { id: string; email: string };
        festivalId?: string;
      }
    }
  }
  ```

---

## Testing Gaps

### Zero Test Coverage

**No tests written:**
- Files: `apps/api/src/` has no .test.ts or .spec.ts files
- Issue: No unit tests for services, controllers, or contracts
- Impact: Refactors risk breaking functionality; can't verify multi-tenancy isolation; can't test offline sync strategies
- Fix approach:
  1. Add vitest config + fixtures for DB (in-memory test DB per test)
  2. Write tests for critical paths:
     - FestivalService.listTags() with multiple locales + fallback
     - Multi-tenant isolation (user from festival A can't read festival B data)
     - Auth flows once implemented
  3. Aim for 70%+ coverage on services/guards

### No Integration Tests

**No test database or fixtures:**
- Issue: Services tested in isolation but not with real DB; no seed data
- Impact: Can't verify end-to-end flows; deployment could break
- Fix approach: Create `packages/db/test/fixtures.ts` with:
  - `createTestDatabase()` — in-memory Postgres or SQLite
  - Seed helpers: `seedFestival()`, `seedUser()`, `seedTag()`
- Use in vitest `beforeEach` to reset DB

### No API E2E Tests

**No contract compliance verification:**
- Issue: Once better-auth integrated, need tests verifying:
  1. Auth endpoints work (sign-in, sign-out, refresh)
  2. Protected endpoints reject unauthenticated requests
  3. Multi-tenant endpoints reject cross-tenant access
  4. Error responses match contract
- Fix approach: Reserve Playwright/Maestro when web/mobile apps exist; for now, add NestJS testing module tests

### No Load/Stress Testing

**Unknown performance limits:**
- Issue: No tests for scalability; unknown max concurrent users, queries/sec, etc.
- Impact: Festival deployment could collapse under load without warning
- Fix approach: Document load testing strategy (k6, Artillery) in CLAUDE.md; recommend testing before live events

---

## Configuration & Deployment Risks

### No Migration Documentation

**Drizzle migrations exist but process unclear:**
- Files: `packages/db/drizzle/` has migration files but no README
- Issue: Developers don't know:
  1. When to run `pnpm db:migrate` vs. `pnpm db:push`
  2. How to create new migrations
  3. How to handle schema in CI/CD
- Impact: Migrations fail silently or aren't applied; data loss possible
- Fix approach: Create `packages/db/README.md` with:
  ```bash
  # Development: push schema changes
  pnpm db:push
  
  # Production: generate migration, review, then apply
  pnpm db:generate
  # Commit .sql file to git
  # In deployment:
  pnpm db:migrate
  ```

### No Seed Data

**Can't test without fixtures:**
- Issue: No way to create initial festivals, tags, or users for testing
- Impact: Manual setup required; can't reproduce bugs consistently
- Fix approach: Create `packages/db/scripts/seed.ts` that:
  1. Creates test festivals (Berlin Techno Fest, etc.)
  2. Creates test users
  3. Registers users for festivals
  4. Runs in dev and CI

### No Graceful Shutdown

**Database connections may not close properly:**
- Files: `apps/api/src/main.ts` line 12: `await app.listen()` but no shutdown hook
- Issue: NestJS app doesn't close DB connections when receives SIGTERM
- Impact: Railway/Docker deployments can hang; DB connection leaks
- Fix approach: Add in main.ts:
  ```typescript
  app.enableShutdownHooks();
  await app.listen(env.PORT);
  process.on('SIGTERM', () => app.close());
  ```

### No Health Check Beyond /health

**Missing readiness/liveness probes:**
- Files: `apps/api/src/health/health.controller.ts` implements only basic /health
- Issue: Kubernetes/Docker needs readiness probe (is DB connected?) not just liveness (is app running?)
- Impact: Deploy might start serving traffic before DB is connected
- Fix approach: Add `/health/ready` endpoint that checks DB connection

### Missing .nvmrc and Node Version Enforcement

**ADR specifies Node >=22 but no enforcement:**
- Issue: No `.nvmrc` file; developers might use Node 18 and hit compatibility issues
- Impact: "Works on my machine but not in CI"
- Fix approach: Create `.nvmrc` with `22` (latest LTS); add to CI

---

## Dependency & Version Risks

### zod v3 Pinned, Migration Path Unclear

**ADR-006 constraint:**
- Files: `packages/contracts/package.json` pins `zod: ^3.25.76`
- Issue: ADR says "Upgrade auf zod 4, sobald ts-rest v4 mit zod-4-Support erscheint" but:
  1. ts-rest v4 release date unknown
  2. No tracking issue created
  3. zod 4 has breaking changes not documented
- Impact: Tech debt; eventually need major migration
- Fix approach: Create GitHub issue tracking zod/ts-rest upgrade; set quarterly review

### Drizzle ORM Not Pinned to Minor

**`drizzle-orm: ^0.45.2` allows breaking changes:**
- Issue: Drizzle follows semver but 0.x versions can have breaking changes in minor versions
- Impact: `pnpm install` on different day might pull incompatible version
- Fix approach: Pin to exact version `drizzle-orm: 0.45.2` until v1.0

### TypeScript 6 vs. 7 Ecosystem Compat

**ADR-013 decision but ongoing risk:**
- Files: `package.json` pins `typescript: 6.0.3`
- Issue: typescript-eslint pending TS 7 support; ts 7 native compiler (`tsgo`) is production-ready but tooling lags
- Impact: Can't upgrade to TS 7 yet; TypeScript 6 will EOL eventually
- Fix approach: Review quarterly; upgrade to TS 7 once typescript-eslint v8 stable

---

## Fragile Areas Needing Protection

### Festival Uniqueness Constraint

**Risk: non-unique slugs:**
- Files: `packages/db/src/schema/festival.ts` line 13: `slug: text().notNull().unique()`
- Issue: Slug is globally unique, not per-tenant. First user to claim `tech-fest` owns it forever across all instances
- Impact: Tenant isolation broken at schema level; business logic risk
- Consideration: Is this intentional (global namespace) or should slugs be per-region/per-year?
- Fix approach: Clarify in ADR-014: are festival slugs global or should include year/region? E.g., `2024-berlin-tech-fest`?

### Tag Uniqueness Per Festival

**Correctly scoped but mutation validation needed:**
- Files: `packages/db/src/schema/tag.ts` line 23: unique constraint on (festivalId, slug)
- Issue: When POST /festivals/:festivalId/tags is implemented, must check duplicate before insert
- Fix approach: In FestivalService.createTag(), query existing tag first; return 400 if exists

### Tag Translation Coverage

**No enforcement of translation completeness:**
- Issue: If a tag exists but translation missing for festival.defaultLocale, resolveLocalized() returns empty
- Impact: Admins might forget to fill in default-locale translation; users see blank tag names
- Fix approach: Add validation: at least defaultLocale translation must exist; return 400 on create if missing

---

## Missing Validation & Error Handling

### No Validation Error Messages

**Zod errors returned as-is:**
- Issue: If user sends POST with invalid data, Zod throws; error message is technical, not user-friendly
- Example: `"Expected string, received number"` — user doesn't understand
- Fix approach: Create error formatter that translates Zod errors to user-facing messages per locale

### No Logging Strategy

**No logging infrastructure visible:**
- Files: `apps/api/src/` has no logger setup (Winston, Pino, etc.)
- Issue: Can't debug production issues; no audit trail
- Fix approach: Add Winston or Pino; configure JSON structured logs for parsing in observability tool (e.g., DataDog)

### Silent Failures on Data Drift

**Schema validation only, not business logic:**
- Issue: If a tag is deleted but a user's favorites still reference it (foreign key constraint exists), query might return null silently
- Impact: UI shows incomplete data without error indication
- Fix approach: Test edge cases:
  1. Fetch favorites, some tags deleted → return only existing tags
  2. Fetch user's marketplace listings, festival ended → show archived state, not error
  - Document expected behavior per entity

---

## Design & Integration Gaps

### No Cashless Integration Proof of Concept

**ADR-011 specified but not implemented:**
- Issue: ADR says WebView/iframe embedding cashless URL but no sample implementation
- Missing: URL validation, domain whitelist, sandbox attributes
- Impact: When mobile/admin built, cashless section might be insecure
- Fix approach: Create sample implementation in `apps/admin` showing iframe with sandbox="allow-same-origin allow-scripts"

### No Admin Theming Editor

**ADR-015 specifies festival branding (CI tokens) but no UI:**
- Files: Festival schema has no fields for CI colors (design went away in simplification)
- Issue: Admins can't customize app colors per festival
- Impact: All festivals look identical; feature incomplete
- Fix approach: Decide:
  1. Is festival theming in MVP? If yes, add to schema + admin UI
  2. If no, document as post-MVP; remove from design

### No MapLibre Integration Shown

**ADR-008 specifies MapLibre for geplan but missing:**
- Files: No map component in `packages/ui/`; no map service in backend
- Issue: Can't build map feature without infrastructure
- Impact: Map feature blocked
- Fix approach: When building features, add `packages/db/src/schema/map.ts` for map data storage; reserve implementation for later phase

---

## Development Workflow Gaps

### No Pre-Commit Hooks

**CLAUDE.md says "Lint/Format/Typecheck automatisch nach Änderungen" but not configured:**
- Issue: No `husky` + `lint-staged` setup; developers might commit bad code
- Impact: CI/CD catches issues late; PR review cluttered with lint comments
- Fix approach: Add to root:
  ```json
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  }
  ```

### No VS Code Settings

**No `.vscode/settings.json`:**
- Issue: Developers use different formatters, tab sizes, etc.; PRs have style noise
- Fix approach: Create `.vscode/settings.json`:
  ```json
  {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }
  }
  ```

### No API Documentation Portal

**No Swagger/OpenAPI UI:**
- Issue: Frontend developers can't explore API without reading ts-rest contracts
- Impact: Onboarding slow; endpoint discovery requires code reading
- Fix approach: Add `@nestjs/swagger` with ts-rest integration to generate OpenAPI and serve /api/docs

---

## Summary of Critical Blockers

| Blocker | Impact | Priority |
|---------|--------|----------|
| No user schema or auth implementation | Can't log in; multi-tenancy worthless | CRITICAL |
| Missing `apps/mobile/` and `apps/admin/` | Frontend dev blocked | CRITICAL |
| No test framework or test code | Can't verify correctness; risky deployments | CRITICAL |
| No .env.example | Dev setup fails; unclear requirements | HIGH |
| No migrations documentation | DB changes lost; data loss risk | HIGH |
| No rate limiting or CORS | Security vulnerabilities; API open to abuse | HIGH |
| No tenant context validation | Multi-tenancy violated; data isolation broken | HIGH |
| No error handling/logging | Can't debug production issues | MEDIUM |
| No i18n configuration | Multi-language features blocked | MEDIUM |
| No UI package implementation | Frontend has no design tokens/components | MEDIUM |

---

*Concerns audit: 2026-07-29*
