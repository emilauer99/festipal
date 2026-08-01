---
phase: 01-identity-schema-auth-foundation
reviewed: 2026-07-30T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - packages/db/src/schema/visitor-profile.ts
  - packages/db/src/schema/my-festival.ts
  - packages/db/src/schema/auth-schemas.ts
  - packages/db/src/schema/auth.ts
  - packages/db/src/schema/index.ts
  - packages/db/auth.config.ts
  - packages/db/package.json
  - packages/contracts/src/schemas.ts
  - packages/contracts/package.json
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-07-30
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the identity-schema/auth-foundation phase: the vendored better-auth core tables, the new
`visitor_profile` and `my_festival` tables, their drizzle-zod bases, and the first contracts-layer
composition (`visitorProfilePublicSchema`). Cross-checked the applied Neon migrations
(`0001_groovy_skin.sql`, `0002_skinny_susan_delgado.sql`) against the Drizzle definitions and
verified the runtime client (`src/client.ts`) and drizzle-kit config both set `casing: 'snake_case'`
(consistent column-naming, no runtime/migration drift).

All of the architecture invariants called out for this phase hold:
- `user` (Account) carries no `festivalId` and no `username`/`displayUsername` columns.
- `my_festival.visitorId` correctly FKs to `visitor_profile.accountId` (confirmed both in the
  Drizzle definition and in the generated FK constraint name in the migration SQL), not `user.id`.
- `visitor_profile` username uniqueness is implemented as a `lower(username)` functional unique
  index (TOCTOU-proof at the DB layer), not an app-level check.
- `visitorProfilePublicSchema` is composed via `.pick()` on the drizzle-zod `createSelectSchema`
  base (drift-detection works — a column rename breaks the typecheck) and correctly omits the
  reserved `socials`/`socialsVisibility` fields.
- Full cascade-delete chain from `user` → `session`/`account`/`visitor_profile` → `my_festival` is
  intact; no orphaned-row risk on account deletion.

No blockers found. Two warnings worth addressing before this phase's foundations get built on in
Phase 2, plus two minor informational notes.

## Warnings

### WR-01: `better-auth` listed as a production dependency of `@festipal/db`, but only used by a CLI-generation-only file

**File:** `packages/db/package.json:32`
**Issue:** `better-auth` is declared under `dependencies`, not `devDependencies`. The only place it's
imported anywhere in `packages/db` is `auth.config.ts` (root of the package), whose own doc comment
states it "EXISTS SOLELY to shape the CLI schema output (`auth generate`) ... No HTTP handler, no
guards ... all of that is Phase 2." Confirmed this file is not part of the built surface:
`tsup.config.ts` only builds `src/index.ts` and `src/schema/index.ts`, and neither of those (nor
anything they import) references `better-auth`. `grep`ing `apps/` for any current runtime usage of
`better-auth` or `auth.config` also returns nothing — Phase 2 hasn't wired it in yet.
As written, every consumer of `@festipal/db` (`apps/api`, and transitively anything that installs
this workspace package) pulls `better-auth` into its production `node_modules`/bundle for no
functional reason today.
**Fix:**
```diff
   "dependencies": {
-    "better-auth": "1.6.25",
     "drizzle-orm": "^0.45.2",
     "drizzle-zod": "0.7.1",
     "postgres": "^3.4.9",
     "zod": "^3.25.76"
   },
   "devDependencies": {
     "@festipal/config": "workspace:*",
     "auth": "1.6.25",
+    "better-auth": "1.6.25",
     "drizzle-kit": "^0.31.10",
     "tsup": "^8.5.1",
     "typescript": "6.0.3"
   }
```
If Phase 2 ends up importing `betterAuth()`/plugin config from `packages/db` at runtime (rather than
re-declaring it in `apps/api`), move it back to `dependencies` at that point — but as of this phase
it's a schema-generation-time-only tool dependency and should live in `devDependencies`.

### WR-02: `visitor_profile.username` has no length/format constraint at either the DB or Zod layer

**File:** `packages/db/src/schema/visitor-profile.ts:34`
**Issue:** `username: text().notNull()` has no `CHECK` constraint in Postgres and no `.min()`/`.max()`/
character-allowlist refinement applied to `visitorProfileInsertSchema`. Since `createInsertSchema`
only reflects column-level constraints (`NOT NULL`), the current insert schema accepts an empty
string, whitespace-only strings, or an arbitrarily long string — and because uniqueness is enforced
via a `lower(username)` functional index, an empty username would be permitted for exactly one row
(first writer wins), which is a real (if narrow) edge case for a field that's exposed publicly via
`visitorProfilePublicSchema` and will presumably be used in mentions/URLs/deep-links later.
The header comment on `auth-schemas.ts` documents the intent that Phase 2 composes API-facing shapes
"on top (`.pick`/`.omit`/`.extend`)" of these bases — but `.pick`/`.omit` do not add refinements, so
unless Phase 2 explicitly remembers to layer `.min()/.max()/.regex()` onto a write schema, this gap
carries forward silently. Worth constraining now while the base schema is being defined (or at minimum
tracking explicitly), rather than relying on every future write-schema author to remember it.
**Fix:** Add a DB-level `CHECK` constraint (defence-in-depth, catches any future direct-SQL writers)
and/or a shared Zod refinement co-located with the base schema for reuse by future write schemas:
```ts
export const visitorProfile = pgTable(
  'visitor_profile',
  { /* ...columns... */ },
  (t) => [
    uniqueIndex('visitor_profile_username_lower_unq').on(lower(t.username)),
    check('visitor_profile_username_length_chk', sql`char_length(${t.username}) between 3 and 30`),
  ],
);

// in a shared location the Phase-2 write schema composes from:
export const usernameSchema = z.string().trim().min(3).max(30).regex(/^[a-z0-9_.]+$/i);
```

## Info

### IN-01: `visitor_profile.socials` jsonb column has no `$type<>()` generic

**File:** `packages/db/src/schema/visitor-profile.ts:37`
**Issue:** `socials: jsonb().notNull().default([])` is declared without `.$type<SocialLink[]>()` (or
similar), so `visitorProfileSelectSchema`/`visitorProfileInsertSchema` type this column as `unknown`
with no structural validation. This is explicitly a reserved/unused field for this phase ("no
endpoint reads/writes it yet") and is correctly excluded from `visitorProfilePublicSchema`, so there's
no current API-boundary exposure — but leaving it fully untyped means there's nothing preventing a
future direct write of a malformed shape (e.g. an object instead of an array) once a write path is
added, other than remembering to add the type then.
**Fix:** When the social-links shape is decided, add `.$type<SocialLink[]>()` to the column
definition so drizzle-zod carries the shape through automatically; until then, consider a short
`// TODO(Phase 2): define SocialLink[] shape` note next to the reserved-field comment so it isn't
missed.

### IN-02: `visitor_profile.avatar` has no format constraint

**File:** `packages/db/src/schema/visitor-profile.ts:36`
**Issue:** `avatar: text()` (nullable, no default) has no `.url()`-style validation anywhere in the
schema layer, unlike `festivalSchema.cashlessUrl` in `packages/contracts/src/schemas.ts` which does
use `z.string().url()`. Low priority since there's no write endpoint yet, but worth a consistent
pattern with the rest of the contracts package when the profile-update write schema is added in
Phase 2.
**Fix:** When composing the write-facing schema in Phase 2, extend/refine `avatar` with
`.url().nullable()` rather than inheriting the untyped `text` base as-is.

---

_Reviewed: 2026-07-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
