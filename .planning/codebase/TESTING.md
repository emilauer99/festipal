# Testing Patterns

**Analysis Date:** 2026-08-02

## Test Framework

**Runner:**
- Vitest 4.1.10
- Config: `apps/api/vitest.config.ts`
- Globals enabled (no import needed for `describe`, `it`, `expect`)

**Assertion Library:**
- Built-in Vitest / Node assertions
- `expect()` for assertions

**HTTP Testing:**
- Supertest 7.2.2 for HTTP endpoint testing
- Integration tests use real HTTP server via `app.getHttpServer()`

**NestJS Testing:**
- `@nestjs/testing` for app bootstrapping
- `Test.createTestingModule()` to create isolated test modules

**Run Commands:**
```bash
pnpm --filter @festipal/api test      # Run all tests (apps/api)
npm run test                            # From apps/api: run all tests via vitest
npm run test -- --watch               # Watch mode (within apps/api)
npm run test -- --coverage            # Coverage report (if configured)
```

## Test File Organization

**Location:**
- Backend: `apps/api/test/`
- Pattern: one spec file per feature area

**Naming:**
- Pattern: `*.spec.ts`
- Examples: `auth-guard.spec.ts`, `save-idempotency.spec.ts`, `me-endpoints.spec.ts`

**Structure:**
```
apps/api/
├── test/
│   ├── setup.ts                      # Shared test utilities (createTestApp, createTestDatabase)
│   ├── auth-guard.spec.ts            # Feature: auth guard enforcement
│   ├── me-endpoints.spec.ts           # Feature: profile / my festivals endpoints
│   ├── save-idempotency.spec.ts       # Feature: idempotent save behavior
│   ├── festival-isolation.spec.ts     # Feature: multi-tenant isolation
│   └── ... other specs
├── vitest.config.ts
├── src/
│   └── ... source files
└── package.json
```

**Test Setup File:**
- `apps/api/test/setup.ts` exports utility functions (not test suites)
- `createTestApp()`: boots full NestJS app via `@nestjs/testing`
- `createTestDatabase()`: creates real Drizzle client pointed at Neon
- Called by specs in their `beforeAll()` hooks

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('feature name or endpoint', () => {
  let app: INestApplication;
  let db: Database;

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();
    // Perform setup (create fixtures, sign in, etc.)
  });

  afterAll(async () => {
    // Clean up (delete fixtures, close connections)
    await app.close();
  });

  describe('nested context (e.g., "error cases")', () => {
    it('should do something specific', async () => {
      // Arrange
      const payload = { ... };

      // Act
      const res = await request(app.getHttpServer())
        .get('/api/v1/endpoint')
        .send(payload);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ... });
    });
  });
});
```

**Patterns:**
- `beforeAll()` for one-time setup (app boot, fixture creation)
- `afterAll()` for one-time cleanup (close app, delete test data)
- Specs reference variables set in `beforeAll()` (closure)
- No per-test setup/teardown (use `beforeEach`/`afterEach` only when necessary to avoid serial slowdown)

## Mocking

**Framework:** None. Integration tests use real dependencies:
- Real NestJS app via `Test.createTestingModule()`
- Real Postgres (Neon) database
- Real better-auth OTP flow (captured to file)

**No Mocks:**
- Database: queries run against actual Neon pool (integration tests)
- HTTP: full request/response cycle via Supertest
- Authentication: real OTP flow with file-based capture

**Test Utilities (Not Mocks):**
- Helper functions for common operations: `signInWithOtp()`, `readCapturedOtp()`
- Fixture creation: create test users, festivals, profiles directly in DB
- These are utilities, not mocks; they exercise real code paths

## Fixtures and Factories

**Test Data:**
```typescript
// Create a test user/account by signing in with OTP
const testEmail = `me-endpoints-${randomUUID()}@festipal.dev`;
const cookie = await signInWithOtp(app, testEmail);

// Create a visitor profile
await db.insert(visitorProfile).values({
  accountId,
  username: `visitor-${randomUUID().slice(0, 8)}`,
  displayName: 'Test User',
});

// Create a test festival
const [fest] = await db
  .insert(festival)
  .values({
    slug: `test-${randomUUID()}`,
    name: 'Test Festival',
    defaultLocale: 'de',
  })
  .returning();
```

**Location:**
- Fixtures created inline in test files, not in separate factories
- Each test file creates its own fixtures in `beforeAll()`
- Cleanup in `afterAll()` deletes test data

**Pattern (save-idempotency.spec.ts):**
```typescript
beforeAll(async () => {
  // 1. Create app and DB
  app = await createTestApp();
  db = createTestDatabase();

  // 2. Create test visitor (via OTP sign-in)
  cookie = await signInWithOtp(app, testEmail);
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, testEmail));
  accountId = u.id;

  // 3. Complete profile (precondition for saving festivals)
  await db.insert(visitorProfile).values({ accountId, username, displayName });

  // 4. Create test festival
  const [fest] = await db.insert(festival).values({ ... }).returning();
  festivalId = fest.id;
});

afterAll(async () => {
  // Clean up in reverse order
  await db.delete(myFestival).where(eq(myFestival.visitorId, accountId));
  await db.delete(visitorProfile).where(eq(visitorProfile.accountId, accountId));
  await db.delete(festival).where(eq(festival.id, festivalId));
  // Note: NOT deleting user/session rows (better-auth owns them)
  await app.close();
});
```

## Coverage

**Requirements:** None enforced (no coverage thresholds)

**Test Naming Principle:**
- Specs focus on behavior, not coverage % targets
- Each spec file tests one feature area end-to-end

## Test Types

**Integration Tests (Primary):**
- Scope: Full endpoint test (HTTP layer through DB)
- Approach: Boot real NestJS app, make HTTP requests, assert DB changes
- Examples:
  - `auth-guard.spec.ts`: POST to all endpoints as anonymous, expect 401
  - `me-endpoints.spec.ts`: sign in, complete profile, list festivals
  - `save-idempotency.spec.ts`: save same festival twice, verify idempotency

**Security Tests:**
- `auth-guard.spec.ts`: Comprehensive proof that all protected endpoints reject anonymous callers
- `festival-isolation.spec.ts`: Two users cannot see each other's saved festivals (tenant isolation)

**E2E Tests (Not Implemented):**
- Manual smoke tests exist in `test/smoke/*.mjs` (run against live server)
- Automated E2E via Playwright planned for future

## Common Patterns

**HTTP Requests via Supertest:**
```typescript
// Simple GET
const res = await request(app.getHttpServer())
  .get('/api/v1/health')
  .expect(200);

// POST with body
const res = await request(app.getHttpServer())
  .post('/api/v1/me/complete-profile')
  .send({ username: 'test', displayName: 'Test' })
  .expect(200);

// With query params
const res = await request(app.getHttpServer())
  .get('/api/v1/festivals/:id/tags')
  .query({ locale: 'de' })
  .expect(200);

// With headers (e.g., session cookie)
const res = await request(app.getHttpServer())
  .post('/api/v1/festivals/:id/save')
  .set('cookie', sessionCookie)
  .send({})
  .expect(200);

// With Origin (better-auth CSRF check)
const res = await request(app.getHttpServer())
  .post('/api/auth/email-otp/send-verification-otp')
  .set('origin', 'http://localhost:8081')
  .send({ email, type: 'sign-in' })
  .expect(200);
```

**OTP Authentication:**
```typescript
// 1. Send OTP request
await request(app.getHttpServer())
  .post('/api/auth/email-otp/send-verification-otp')
  .set('origin', ORIGIN)
  .send({ email: 'test@example.com', type: 'sign-in' })
  .expect(200);

// 2. Read captured OTP from dev transport file
const otp = await readCapturedOtp('test@example.com');

// 3. Verify OTP and get session cookie
const verifyRes = await request(app.getHttpServer())
  .post('/api/auth/sign-in/email-otp')
  .set('origin', ORIGIN)
  .send({ email: 'test@example.com', otp })
  .expect(200);

const cookie = cookieHeaderFromSetCookie(verifyRes.headers['set-cookie']);
```

**Database Assertions:**
```typescript
// Query directly to verify DB state
const [profile] = await db
  .select()
  .from(visitorProfile)
  .where(eq(visitorProfile.accountId, accountId))
  .limit(1);
expect(profile).toMatchObject({ username: 'test', displayName: 'Test' });

// Verify row count (e.g., idempotency)
const rows = await db
  .select()
  .from(myFestival)
  .where(and(eq(myFestival.visitorId, accountId), eq(myFestival.festivalId, festivalId)));
expect(rows).toHaveLength(1); // Exactly one, not two after second save
```

**Error Responses:**
```typescript
// Missing resource
const res = await request(app.getHttpServer())
  .get('/api/v1/festivals/nonexistent-slug')
  .expect(404);
expect(res.body).toEqual({ message: 'Festival not found' });

// Conflict (e.g., duplicate username)
const res = await request(app.getHttpServer())
  .post('/api/v1/me/complete-profile')
  .send({ username: 'duplicate', displayName: 'Test' })
  .expect(409);
expect(res.body).toEqual({ message: '...' });

// Unauthorized
const res = await request(app.getHttpServer())
  .get('/api/v1/me')
  .expect(401);
```

## Vitest Configuration

**Key Settings (`apps/api/vitest.config.ts`):**
- `environment: 'node'` — Run tests in Node (not browser)
- `globals: true` — No need to import `describe`, `it`, `expect`
- `setupFiles: ['./test/setup.ts']` — Runs before tests (for global setup if needed)
- `passWithNoTests: true` — Allow empty test suites (phase 02 harness pre-wave)
- `fileParallelism: false` — **CRITICAL:** Serialize file execution

**Why Serial Execution?**
Integration tests share external state:
- Single Neon connection pool (concurrent requests can exhaust limits)
- better-auth OTP rate limiter (3 requests/60s per source; parallel specs race)
- Dev OTP capture file (concurrent overwrites lose data)
- Running specs in parallel surfaced `UNDEFINED_VALUE` postgres.js driver errors

**Node Imports:**
- `import 'reflect-metadata'` (for NestJS decorator metadata at runtime)
- `import 'dotenv/config'` (to load `.env` for tests)

## Running Tests

**Local Development:**
```bash
# From repo root
pnpm --filter @festipal/api test

# From apps/api
npm run test

# Watch mode
npm run test -- --watch

# Single file
npm run test -- auth-guard.spec.ts
```

**CI/CD (future):**
- GitHub Actions workflow will run: `pnpm test`
- Turbo will parallelize across packages (but serial within `apps/api`)
- Must pass typecheck, lint, and test before PR merge

## Test-Driven Development Notes

**What NOT to Test:**
- Framework boilerplate (NestJS built-in guards, decorators)
- Third-party library internals (Drizzle generated queries)
- UI rendering (no frontend tests yet)

**What to Test:**
- Business logic and state changes (e.g., idempotency, multi-tenancy)
- Error handling (e.g., 404, 409, 401 status codes)
- Security gates (e.g., auth guard on all protected endpoints)
- DB invariants (e.g., unique username, foreign key constraints)

**High-Value Tests:**
- `auth-guard.spec.ts`: Comprehensive proof that AuthGuard works (SEC-01)
- `festival-isolation.spec.ts`: Two users' saved festivals don't bleed (SEC-02)
- `save-idempotency.spec.ts`: Duplicate saves are safe (business logic)
- `me-endpoints.spec.ts`: Profile completion and festival listing work correctly

---

*Testing analysis: 2026-08-02*
