# Testing Patterns

**Analysis Date:** 2026-07-29

## Status

**Current:** No test files or test infrastructure present. This is a greenfield scaffold (2026-07-28).

**Planned:** Vitest (unit) + Playwright (web E2E) + Maestro/Detox (app E2E) per `docs/DEVELOPMENT_DECISIONS.md` ADR tech stack section.

---

## Test Framework (Planned)

**Unit Tests:**
- Runner: **Vitest** (not yet installed)
- Assertion library: Vitest built-in (`expect()`)
- Config location: `vitest.config.ts` (to be created per app/package)

**Web E2E Tests:**
- Framework: **Playwright** (not yet installed)
- Scope: Admin web (`apps/admin`) + Backend (`apps/api`)
- Config: `playwright.config.ts` (root-level or per-app)

**Mobile App E2E Tests:**
- Framework: **Maestro** or **Detox** (not yet installed)
- Scope: React Native app (`apps/mobile`)
- Run via EAS CI/CD or local device/simulator

---

## Expected Test Commands (Once Implemented)

Based on root `package.json` Turborepo tasks defined in `turbo.json`:

```bash
pnpm test                    # Run all unit tests via Vitest (all packages/apps)
pnpm test:watch              # Watch mode (once Vitest config added per app)
pnpm test:coverage           # Coverage report (once configured)

# Web E2E (once Playwright setup complete)
pnpm test:e2e:web           # Playwright tests for admin + API endpoints

# App E2E (once Maestro/Detox setup complete)
pnpm test:e2e:mobile        # Device/simulator tests via Maestro or Detox
```

**Note:** Root `package.json` currently has NO test scripts. Individual apps will define their own Vitest/Playwright configs.

---

## Test File Organization (To Be Established)

**Convention (not yet enforced):**
- Co-located: `*.test.ts` / `*.spec.ts` alongside source files
- OR: mirror directory in `__tests__/` or `tests/` folder (team preference TBD)
- Example paths (not yet present):
  ```
  apps/api/src/festival/festival.service.ts
  apps/api/src/festival/festival.service.test.ts        # co-located

  packages/contracts/src/schemas.ts
  packages/contracts/src/schemas.test.ts                # co-located

  apps/admin/src/hooks/useRoomStore.test.ts
  apps/admin/tests/e2e/booking-flow.spec.ts             # centralized E2E
  ```

---

## Expected Test Structure (Planning Phase)

### Unit Test Example (Vitest Pattern — Not Yet Written)

```typescript
// packages/contracts/src/locale.test.ts (planned)
import { describe, it, expect } from 'vitest';
import { resolveLocalized, DEFAULT_LOCALE } from './locale';

describe('resolveLocalized', () => {
  it('returns requested locale if available', () => {
    const text = { de: 'Deutsch', en: 'English' };
    const result = resolveLocalized(text, 'en', 'de');
    expect(result).toBe('English');
  });

  it('falls back to festival default if requested locale missing', () => {
    const text = { de: 'Deutsch' };
    const result = resolveLocalized(text, 'en', 'de');
    expect(result).toBe('Deutsch');
  });

  it('returns first available if neither requested nor default present', () => {
    const text = { fr: 'Français' };
    const result = resolveLocalized(text, 'en', 'de');
    expect(result).toBe('Français');
  });
});
```

### Backend Integration Test Example (NestJS + Vitest — Not Yet Written)

```typescript
// apps/api/src/festival/festival.service.test.ts (planned)
import { describe, it, expect, beforeEach } from 'vitest';
import { FestivalService } from './festival.service';

describe('FestivalService', () => {
  let service: FestivalService;
  let mockDb: any; // TODO: Mock Database type

  beforeEach(() => {
    mockDb = { /* setup mock db */ };
    service = new FestivalService(mockDb);
  });

  it('getBySlug returns festival with supported locales', async () => {
    const result = await service.getBySlug('my-festival');
    expect(result).toMatchObject({
      id: expect.any(String),
      slug: 'my-festival',
      supportedLocales: expect.any(Array),
    });
  });

  it('getBySlug returns null for non-existent festival', async () => {
    const result = await service.getBySlug('nonexistent');
    expect(result).toBeNull();
  });
});
```

### Playwright E2E Example (Not Yet Written)

```typescript
// apps/admin/tests/e2e/festival-list.spec.ts (planned)
import { test, expect } from '@playwright/test';

test.describe('Festival Admin - Festival List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/festivals');
  });

  test('displays list of festivals', async ({ page }) => {
    const festivalList = page.locator('[data-testid="festival-list"]');
    await expect(festivalList).toBeVisible();
  });

  test('can filter festivals by name', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search festivals"]');
    await searchInput.fill('Berlin');
    const results = page.locator('[data-testid="festival-item"]');
    await expect(results).toHaveCount(1);
  });
});
```

---

## Mocking (To Be Established)

**Planned approach (not yet implemented):**

### Database Mocking (Vitest + Drizzle)
- Mock `Database` type from `@festipal/db`
- Return hardcoded test data for queries
- Avoid hitting Neon in unit tests

### HTTP Client Mocking (API Testing)
- Use `vitest.mock()` to stub Axios or fetch
- Mock `ts-rest` client responses
- Test contract adherence without network

### NestJS Module Mocking
- Use NestJS `Test.createTestingModule()` for unit tests
- Mock service dependencies via `provide` override
- Avoid full database initialization in unit tests

**What NOT to Mock:**
- Zod schema validation — test real schemas
- Locale resolution logic — test real implementation
- ts-rest contract definitions — test real contracts
- Core business logic — test real services with mock data

---

## Coverage (To Be Established)

**Target (TBD once implemented):**
- Unit tests: Aim for >80% coverage of business logic
- E2E tests: Cover happy paths + critical error flows
- Coverage report: `pnpm test:coverage` (once Vitest configured)

**Measure with:**
```bash
vitest --coverage   # Once Vitest setup complete
```

---

## Test Types

### Unit Tests

**Scope:**
- Individual functions/methods in isolation
- Pure logic: locale resolution, schema validation, formatters
- NestJS services with mocked dependencies

**Location (TBD):**
- `packages/contracts/src/**/*.test.ts`
- `packages/db/src/**/*.test.ts`
- `apps/api/src/**/*.test.ts`
- `packages/i18n/src/**/*.test.ts`

**Run:** `pnpm test` (once configured)

### Integration Tests

**Scope:**
- NestJS service + database integration
- API endpoint behavior (ts-rest handler + service)
- Authentication/Authorization (better-auth)
- Multi-tenant scoping (festivalId guards)

**Approach (TBD):**
- Use test database (Neon branch or local Postgres)
- Start minimal NestJS app in test runner
- Clear data between tests

**Location (TBD):**
- `apps/api/src/**/*.integration.test.ts` (or in `tests/integration/`)

### E2E Tests

**Web (Playwright):**
- Admin web flows: create festival, edit timetable, manage tags, theme configuration
- Cashless iframe embedding and URL validation
- Multi-locale content display and fallback behavior
- Location: `apps/admin/tests/e2e/**/*.spec.ts`

**Mobile (Maestro/Detox):**
- Offline functionality (map, timetable loaded)
- Festival navigation and tab switching
- Booking/cashless flows (if tested)
- Location: `apps/mobile/e2e/**/*.test.ts` (Detox) or Maestro YAML flows

---

## Assertions & Testing Utilities

**Vitest assertions:**
```typescript
import { expect } from 'vitest';
expect(value).toBe(expected);
expect(array).toHaveLength(3);
expect(object).toMatchObject({ id: expect.any(String) });
expect(promise).rejects.toThrow();
```

**Testing utilities (to be added as needed):**
- Zod schema test helpers (validate + type check)
- NestJS test utilities from `@nestjs/testing`
- Playwright locator assertions
- Factory functions for test data (Faker.js or simple builders)

---

## Async Testing (Expected Patterns)

**Vitest async pattern:**
```typescript
it('loads data asynchronously', async () => {
  const result = await service.getBySlug('festival');
  expect(result).not.toBeNull();
});
```

**Playwright async pattern:**
```typescript
test('navigates to festival', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=My Festival');
  await expect(page).toHaveURL(/\/festival\/\d+/);
});
```

---

## CI/CD Integration (Planned)

**GitHub Actions (via Turborepo tasks in `turbo.json`):**
- PR trigger: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
- Test results reported as GitHub check
- Coverage uploaded to Codecov (optional)
- E2E tests run on merge to `main` or nightly

**Repo rules:** All tests must pass before merging to `main` (enforced by GitHub Branch Protection).

---

## Setup Checklist (For Implementation)

- [ ] Install Vitest and configure per app/package
- [ ] Set up `vitest.config.ts` files with coverage thresholds
- [ ] Add `.test.ts` / `.spec.ts` files alongside source code
- [ ] Mock database/external services for unit tests
- [ ] Set up test database (Neon branch) for integration tests
- [ ] Configure Playwright for admin + API E2E
- [ ] Configure Maestro/Detox for mobile E2E
- [ ] Add test coverage reporting (Codecov, etc.)
- [ ] Wire Turbo `test` task to call `vitest` per package
- [ ] Enable GitHub Actions branch protection requiring tests to pass
- [ ] Document testing workflow in `docs/TESTING_GUIDE.md`

---

## Key Decisions Enforced

**From `docs/GIT_CONVENTIONS.md` § 6 & CLAUDE.md:**
- Test code is production-grade: follows linting, typing, formatting rules
- Breaking tests must be fixed before merge (no test skips on CI)
- Claude Code: run test suite before claiming "done" on a feature branch
- Report test failures honestly — don't hide them in commits

---

*Testing audit: 2026-07-29*
