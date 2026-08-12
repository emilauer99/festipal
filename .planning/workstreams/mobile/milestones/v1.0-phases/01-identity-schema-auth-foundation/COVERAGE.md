# Phase 1 — API Coverage Declaration

**Decision:** OPT-OUT (no external API capability surface integrated this phase).

**Reason:** No external API integration — Phase 1 vendors better-auth's Drizzle
schema *tables only* (the `auth` CLI generates/vendors `packages/db/src/schema/auth.ts`);
no auth HTTP endpoints, OTP send/verify flows, or session routes are wired until Phase 2.
`better-auth` is consumed here purely for its database schema shape, not for any runtime
HTTP capability surface. `drizzle-zod` and the `auth` CLI are build-time codegen tools,
not integrated APIs.

The seal-time API-coverage gate accepts this reasoned declaration in place of a
capability coverage matrix.
