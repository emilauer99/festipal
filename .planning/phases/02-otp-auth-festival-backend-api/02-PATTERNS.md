# Phase 2: OTP Auth & Festival Backend API - Pattern Map

**Mapped:** 2026-08-01
**Files analyzed:** 21 (new/modified)
**Analogs found:** 18 / 21

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/api/src/auth/auth.instance.ts` | config/service | request-response (sync bootstrap) | `apps/api/src/config/env.ts` (sync loader pattern) | partial (new domain, no direct analog) |
| `apps/api/src/auth/auth.module.ts` | provider/module | request-response | `apps/api/src/db/db.module.ts` (`@Global()` module wrapping external client) | role-match |
| `apps/api/src/auth/email/otp-email-provider.ts` | service (interface) | event-driven (fire-and-forget) | none | no analog |
| `apps/api/src/auth/email/dev-otp-email-provider.ts` | service | event-driven | none | no analog |
| `apps/api/src/auth/email/resend-otp-email-provider.ts` | service | event-driven | none | no analog |
| `apps/api/src/me/me.controller.ts` | controller | request-response | `apps/api/src/festival/festival.controller.ts` | exact |
| `apps/api/src/me/me.service.ts` | service | CRUD | `apps/api/src/festival/festival.service.ts` | exact |
| `apps/api/src/me/me.module.ts` | config | — | `apps/api/src/festival/festival.module.ts` | exact |
| `apps/api/src/festival/festival.controller.ts` (extend: listFestivals, saveFestival) | controller | request-response / CRUD | itself (existing `getFestival`/`listTags` handlers) | exact |
| `apps/api/src/festival/festival.service.ts` (extend: listAll, save, listMyFestivals) | service | CRUD | itself (existing `getBySlug`/`listTags`) | exact |
| `apps/api/src/app.module.ts` (extend: import AuthModule, MeModule) | config | — | itself | exact |
| `apps/api/src/main.ts` (extend: `bodyParser: false`) | config | request-response | itself | exact |
| `apps/api/src/config/env.ts` (extend: BETTER_AUTH_SECRET required, RESEND_API_KEY, session config, memoized `env` export) | config | — | itself | exact |
| `packages/contracts/src/router.ts` (extend: getMe, completeProfile, usernameAvailability, listFestivals, saveFestival, listMyFestivals) | route/config | request-response | itself (`getFestival`, `listTags` entries) | exact |
| `packages/contracts/src/schemas.ts` (extend: me/complete-profile/save response shapes) | model/config | transform | itself (`festivalSchema`, `tagSchema`, `visitorProfilePublicSchema`) | exact |
| `packages/db/scripts/seed.ts` | utility (batch) | batch/file-I/O | none in `packages/db` (new script dir) — mirrors `packages/db/src/client.ts` for connection + `festival.ts`/`festival-locale` schema for the insert target | partial |
| `packages/db/package.json` (add `db:seed` script, `tsx` devDependency) | config | — | root `packages/api` build/test scripts (pattern, not file) | n/a |
| `apps/api/test/auth-guard.spec.ts` | test | request-response | none (Wave 0 — no test framework yet) | no analog |
| `apps/api/test/festival-isolation.spec.ts` | test | CRUD | none (Wave 0) | no analog |
| `apps/api/test/username-race.spec.ts` | test | CRUD | none (Wave 0) | no analog |
| `apps/api/test/bodyparser-smoke.spec.ts` | test | request-response | none (Wave 0) | no analog |

## Pattern Assignments

### `apps/api/src/me/me.controller.ts` (controller, request-response)

**Analog:** `apps/api/src/festival/festival.controller.ts` (full file, 29 lines — read in one pass)

**Imports pattern** (lines 1-5):
```typescript
import { Controller } from '@nestjs/common';
import { contract } from '@festipal/contracts';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

import { FestivalService } from './festival.service';
```
For `me.controller.ts`, add the session decorator import per RESEARCH.md Pattern 2:
```typescript
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
```

**Core request-response pattern** (lines 7-28):
```typescript
@Controller()
export class FestivalController {
  constructor(private readonly festivals: FestivalService) {}

  @TsRestHandler(contract.getFestival)
  getFestival() {
    return tsRestHandler(contract.getFestival, async ({ params }) => {
      const found = await this.festivals.getBySlug(params.slug);
      if (!found) {
        return { status: 404, body: { message: 'Festival not found' } };
      }
      return { status: 200, body: found };
    });
  }
}
```
Copy this exact shape for `getMe`, `completeProfile`, `usernameAvailability`, `listMyFestivals` — one `@TsRestHandler(contract.X)` method per endpoint, service call inside the `tsRestHandler` callback, `{ status, body }` return tuple (never throw for expected "not found"/"conflict" cases — see error-handling pattern below). Add `@Session() session: UserSession` as a controller-method parameter (outside the `tsRestHandler` callback) per RESEARCH.md Pattern 2, then close over `session.user.id` inside the callback.

**Error handling pattern** — service returns `null`/discriminated result, controller maps to status code (no try/catch in the controller layer; the 404 branch in `getFestival` above is the canonical shape). For the `completeProfile` 409 case, mirror this same `{status, body}` branching style using the service's `{status: 'ok' | 'conflict'}` result shape (see `me.service.ts` analog below).

---

### `apps/api/src/me/me.service.ts` (service, CRUD)

**Analog:** `apps/api/src/festival/festival.service.ts` (full file, 84 lines — read in one pass)

**Imports pattern** (lines 1-18):
```typescript
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { festival, festivalLocale, tag, tagTranslation, type Database } from '@festipal/db';
import { resolveLocalized, type Festival, type Locale, type LocalizedText, type Tag } from '@festipal/contracts';

import { DB } from '../db/db.module';
```
For `me.service.ts`: import `visitorProfile`, `myFestival`, `festival` from `@festipal/db`, `PostgresError` from `postgres` (RESEARCH.md Pattern 3).

**DI + tenant-scoped query pattern** (lines 20-30, 47-65):
```typescript
@Injectable()
export class FestivalService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async getBySlug(slug: string): Promise<Festival | null> {
    const [row] = await this.db.select().from(festival).where(eq(festival.slug, slug)).limit(1);
    if (!row) return null;
    ...
  }

  async listTags(festivalId: string, requested?: Locale): Promise<Tag[]> {
    ...
    .where(eq(tag.festivalId, festivalId));
    ...
  }
}
```
This `where(eq(<table>.<scopeColumn>, <scopeValue>))` shape is the template for SEC-02: `listMyFestivals(visitorId)` must `where(eq(myFestival.visitorId, visitorId))` — scope value comes from `session.user.id`, **never** a request param (see RESEARCH.md "Cross-tenant denial query shape").

**Conflict-mapping pattern (Pitfall 11, `23505` → `409`)** — no direct analog in this codebase (first mutating endpoint with a uniqueness constraint); use RESEARCH.md's Pattern 3 verbatim:
```typescript
async completeProfile(accountId: string, input: { username: string; displayName: string; avatar?: string }) {
  try {
    const [row] = await this.db.insert(visitorProfile).values({ accountId, ...input }).returning();
    return { status: 'ok' as const, profile: row };
  } catch (err) {
    const cause = (err as { cause?: unknown }).cause;
    if (cause instanceof PostgresError && cause.code === '23505') {
      return { status: 'conflict' as const };
    }
    throw err;
  }
}
```

---

### `apps/api/src/me/me.module.ts` / `apps/api/src/festival/festival.module.ts` (extend) (config)

**Analog:** `apps/api/src/festival/festival.module.ts` (full file, 11 lines)
```typescript
import { Module } from '@nestjs/common';

import { FestivalController } from './festival.controller';
import { FestivalService } from './festival.service';

@Module({
  controllers: [FestivalController],
  providers: [FestivalService],
})
export class FestivalModule {}
```
Copy verbatim for `MeModule` (controller + service pair, named exports, no barrel).

---

### `apps/api/src/auth/auth.module.ts` (provider/module, request-response)

**Analog:** `apps/api/src/db/db.module.ts` (full file, 21 lines) — closest existing "wrap an externally-constructed client as a Global NestJS module" pattern:
```typescript
import { Global, Module } from '@nestjs/common';
import { createDatabase, type Database } from '@festipal/db';

import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

export const DB = Symbol('DB');

@Global()
@Module({
  providers: [
    { provide: DB, useFactory: (env: Env): Database => createDatabase(env.DATABASE_URL), inject: [ENV] },
  ],
  exports: [DB],
})
export class DbModule {}
```
`AuthModule` differs structurally (it imports `BetterAuthModule.forRoot({ auth, bodyParser })` from `@thallesp/nestjs-better-auth` rather than declaring its own provider/symbol) — see RESEARCH.md Pattern 1 for the exact wiring; the `@Global()` + single-external-client-wrapped-as-module *shape* is what to carry over from `db.module.ts`, not the DI-symbol mechanics.

**`app.module.ts` wiring pattern** (full file, 12 lines):
```typescript
import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { FestivalModule } from './festival/festival.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ConfigModule, DbModule, FestivalModule],
  controllers: [HealthController],
})
export class AppModule {}
```
Add `AuthModule` and `MeModule` to the `imports` array in the same additive style.

---

### `apps/api/src/config/env.ts` (extend) (config)

**Analog:** itself (full file, 20 lines):
```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(8081),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}
```
Extend the `envSchema` object with `RESEND_API_KEY: z.string().optional()` and any session-config env vars; per RESEARCH.md "New: `loadEnv()` gains a third call site this phase", also add `export const env = loadEnv();` as a memoized singleton so `auth/auth.instance.ts` doesn't add a fourth raw `loadEnv()` call site (there would already be 3: `main.ts`, `config.module.ts`, `auth.instance.ts` — collapse to one evaluation).

**`config.module.ts` analog** (full file, 13 lines) — same `@Global()` + symbol-provider shape as `db.module.ts`, already covered above; no change needed to this file itself beyond consuming the new schema fields transparently.

---

### `packages/contracts/src/router.ts` (extend) (route/config, request-response)

**Analog:** itself (full file, 43 lines):
```typescript
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { localeSchema } from './locale';
import { festivalSchema, tagSchema } from './schemas';

const c = initContract();
const errorSchema = z.object({ message: z.string() });

export const contract = c.router(
  {
    health: { method: 'GET', path: '/health', responses: { 200: z.object({ status: z.literal('ok') }) }, summary: 'Liveness probe' },
    getFestival: {
      method: 'GET', path: '/festivals/:slug',
      pathParams: z.object({ slug: z.string() }),
      responses: { 200: festivalSchema, 404: errorSchema },
      summary: 'Fetch a festival (tenant) by slug',
    },
    listTags: {
      method: 'GET', path: '/festivals/:festivalId/tags',
      pathParams: z.object({ festivalId: z.string().uuid() }),
      query: z.object({ locale: localeSchema.optional() }),
      responses: { 200: z.array(tagSchema) },
      summary: 'List a festival's tags, titles resolved to the requested locale',
    },
  },
  { pathPrefix: '/api/v1' },
);
```
Add `getMe`, `completeProfile`, `usernameAvailability`, `listFestivals`, `saveFestival`, `listMyFestivals` entries in this exact `{ method, path, pathParams?, query?, body?, responses, summary }` shape, each keyed under the same `c.router({...}, { pathPrefix: '/api/v1' })` call — do **not** create a second `c.router()`. `completeProfile`'s response map needs a `409: errorSchema` (or dedicated conflict schema) entry per Pitfall 11.

**Do NOT include** better-auth's own OTP routes here (`/api/auth/*` is out of contract scope per CONTEXT.md).

---

### `packages/contracts/src/schemas.ts` (extend) (model/config, transform)

**Analog:** itself (full file, 37 lines):
```typescript
import { visitorProfileSelectSchema } from '@festipal/db/schema';
import { z } from 'zod';

import { localeSchema } from './locale';

export const festivalSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  defaultLocale: localeSchema,
  supportedLocales: z.array(localeSchema),
  cashlessUrl: z.string().url().nullable(),
});
export type Festival = z.infer<typeof festivalSchema>;

export const visitorProfilePublicSchema = visitorProfileSelectSchema.pick({
  accountId: true,
  username: true,
  displayName: true,
  avatar: true,
});
export type VisitorProfilePublic = z.infer<typeof visitorProfilePublicSchema>;
```
`visitorProfilePublicSchema` **already exists** and is the exact base to reuse for `getMe`'s response `profile` field (per RESEARCH.md A4, response shape is `{ accountId, email, profile: VisitorProfilePublic | null }` — confirm/adjust in PLAN.md per Open Question 1). For `completeProfile`'s request body, compose on `visitorProfileInsertSchema` (from `@festipal/db/schema`) via `.pick()`/`.omit()`, mirroring the `.pick()` pattern above — never hand-redeclare (Pitfall 6). For `myFestival`-derived response shapes, compose on `myFestivalSelectSchema` the same way.

---

### `packages/db/scripts/seed.ts` (utility, batch/file-I/O)

**No close analog exists** in `packages/db/src/` (no scripts directory yet) — closest structural references are `packages/db/src/client.ts` (connection factory to reuse) and `packages/db/src/schema/festival.ts` (insert target, not yet read but referenced in RESEARCH.md as exporting `festival`/`festivalLocale`). Use RESEARCH.md's provided code example verbatim (already vetted against the project's `onConflictDoUpdate`/`unique()` constraint on `festival.slug`):
```typescript
// packages/db/scripts/seed.ts
import { createDatabase } from '../src/client';
import { festival, festivalLocale } from '../src/schema';

async function seed() {
  const db = createDatabase(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!);
  const [fest] = await db.insert(festival).values({
    slug: 'frequency-2026', name: 'Frequency 2026', defaultLocale: 'de',
  }).onConflictDoUpdate({ target: festival.slug, set: { name: 'Frequency 2026', defaultLocale: 'de' } }).returning();

  await db.insert(festivalLocale).values([
    { festivalId: fest.id, locale: 'de' },
    { festivalId: fest.id, locale: 'en' },
  ]).onConflictDoNothing();

  console.log(`Seeded festival: ${fest.slug} (${fest.id})`);
}
void seed();
```
`DATABASE_URL_UNPOOLED` preference mirrors `packages/db/drizzle.config.ts`'s existing convention for out-of-request-cycle scripts (ADR-005) — read that file if exact fallback wiring needs confirming at plan time.

---

## Shared Patterns

### `@TsRestHandler` + service-returns-null/discriminated-result + controller-maps-to-status
**Source:** `apps/api/src/festival/festival.controller.ts` lines 11-20
**Apply to:** All new controller files (`me.controller.ts`, extended `festival.controller.ts` handlers)
```typescript
@TsRestHandler(contract.getFestival)
getFestival() {
  return tsRestHandler(contract.getFestival, async ({ params }) => {
    const found = await this.festivals.getBySlug(params.slug);
    if (!found) return { status: 404, body: { message: 'Festival not found' } };
    return { status: 200, body: found };
  });
}
```

### Tenant/caller-scoped query via `where(eq(...))`
**Source:** `apps/api/src/festival/festival.service.ts` line 65 (`.where(eq(tag.festivalId, festivalId))`)
**Apply to:** All new `my_festival`/`visitor_profile`-touching service methods (SEC-02) — scope value must come from `session.user.id` (server-derived), never a client-supplied param, for `listMyFestivals`.

### `@Global()` module wrapping a single externally-constructed client
**Source:** `apps/api/src/db/db.module.ts` (full file)
**Apply to:** `auth/auth.module.ts` (adapted to use `BetterAuthModule.forRoot()` instead of a custom DI symbol per RESEARCH.md Pattern 1).

### Zod schema composition on drizzle-zod bases (never hand-redeclare — Pitfall 6)
**Source:** `packages/contracts/src/schemas.ts` lines 31-37 (`visitorProfilePublicSchema = visitorProfileSelectSchema.pick({...})`)
**Apply to:** All new contract request/response schemas touching `visitor_profile`, `my_festival`, or `festival` shapes.

### Env schema extension + memoized singleton
**Source:** `apps/api/src/config/env.ts` (full file)
**Apply to:** `RESEND_API_KEY`, `BETTER_AUTH_SECRET` (make required, not optional, once auth is wired), session-config env additions; export `env` as `export const env = loadEnv();` to close the 3rd-call-site gap RESEARCH.md flags.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `apps/api/src/auth/email/otp-email-provider.ts` + dev/resend implementations | service | event-driven | First provider-abstraction pattern in this codebase; no prior interface+swappable-impl file exists. Use RESEARCH.md Pattern 1's `sendVerificationOTP` fire-and-forget shape as the template instead. |
| `apps/api/src/auth/auth.instance.ts` | config/service | request-response (sync bootstrap) | First synchronous-outside-NestJS-DI construction in this codebase; use RESEARCH.md Pattern 1 verbatim (`betterAuth({ database: drizzleAdapter(...), plugins: [emailOTP({...})] })`). |
| `apps/api/test/*.spec.ts` (all 4 files) | test | various | Wave 0 gap — no test framework configured anywhere in the monorepo yet (confirmed via RESEARCH.md "Validation Architecture" — `vitest`/`@nestjs/testing`/`supertest` must be added first). No analog test file exists to copy structure from; RESEARCH.md's "Phase Requirements → Test Map" table is the spec to build against. |
| `packages/db/scripts/seed.ts` | utility | batch/file-I/O | No `scripts/` directory precedent in `packages/db`; RESEARCH.md's Code Example is the closest thing to an analog (vetted against actual schema/client). |

## Metadata

**Analog search scope:** `apps/api/src/`, `packages/contracts/src/`, `packages/db/src/`
**Files scanned:** 21 (9 apps/api, 4 packages/contracts, 8 packages/db)
**Pattern extraction date:** 2026-08-01
