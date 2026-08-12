# Phase 2: OTP Auth & Festival Backend API - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-01
**Phase:** 2-otp-auth-festival-backend-api
**Areas discussed:** Email delivery, Session lifetime, Festival test data, Festival browse fields

---

## Email delivery (OTP)

| Option | Description | Selected |
|--------|-------------|----------|
| Dev-Transport jetzt, Resend später | Provider abstraction with dev transport (console/Mailpit); RESEND_API_KEY path implemented but env-optional; no account/domain setup needed | ✓ |
| Resend jetzt scharf schalten | Set up Resend account + domain verification now; real mails from Phase 2 | |

**User's choice:** Dev-Transport jetzt, Resend später
**Notes:** Phase 2 delivers a live dev API with no mobile client yet (Phase 3); OTP exercised via curl/tests, so console/Mailpit suffices. Resend path wired but dormant until env key set.

---

## Session lifetime

| Option | Description | Selected |
|--------|-------------|----------|
| 90 Tage, gleitend | expiresIn 90d, updateAge ~1d; effectively permanent under regular use, OTP re-auth after 90d inactivity | ✓ |
| 30 Tage, gleitend | Safer on lost device, more frequent re-login for occasional users | |
| 365 Tage, gleitend | Max comfort ("once-a-year festival"), longer risk window on lost/stolen device | |

**User's choice:** 90 Tage, gleitend
**Notes:** Sliding session, no refresh-token grant (Pitfall 10). Expiry → route back to OTP sign-in.

---

## Festival test data

| Option | Description | Selected |
|--------|-------------|----------|
| Wiederverwendbares Seed-Skript | Idempotent seed with ≥2 festivals incl. tags/locales; covers SEC-02 test + Phase 5 demo data | ✓ (modified) |
| Einmaliges manuelles Insert | Faster, not reproducible/CI-capable | |

**User's choice:** Reusable seed script — but **with only ONE festival for now**, whose data the user defines themselves.
**Notes:** User provided the seed festival data directly: slug `frequency-2026`, name "Frequency 2026", defaultLocale `de`, supportedLocales `de`+`en`, no cashlessUrl, no tags. The SEC-02 two-festival requirement is resolved by having the isolation **test** provision its own two throwaway fixtures (Claude's technical call), keeping the dev seed single and clean.

---

## Festival browse fields (`GET /festivals`)

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal jetzt, Datum/Ort in Phase 5 | Return existing fields (name/slug/locales); contract stays extensible; date/place belongs to FEST-01/Phase 5 | ✓ |
| Datum/Ort jetzt ergänzen | Extend festival table with date/place now; requires migration + timezone/place-structure decisions | |

**User's choice:** Minimal jetzt — return all currently-seeded festivals, no pagination.
**Notes:** "am Anfang wird es hier noch nicht viele Festivals geben" → no pagination needed now; date/place deferred to Phase 5.

---

## Claude's Discretion

Technical decisions the user deferred (consistent with the Phase 1 "sensible defaults, show me in the plan" directive):
- Login-first public-vs-protected tagging pass (SEC-01) + endpoint × auth-annotation table.
- `bodyParser:false` + `AuthModule.forRoot({ auth, bodyParser })` wiring; Plan C catch-all fallback.
- `/api/v1` vs `/api/auth` global-prefix collision resolution.
- username-availability (advisory) vs complete-profile (`23505` → 409) TOCTOU handling.
- SEC-02 isolation-test fixture provisioning (own 2 festivals).
- Module/file layout, seed script location, OTP provider-abstraction shape.

## Deferred Ideas

- Real Resend delivery (account/domain/DNS) → Phase 3+ (env flip).
- OTP rate-limit tuning for festival-scale shared-IP → before first live festival (Pitfall 8).
- Festival date/place master-data fields → Phase 5 (FEST-01).
- Pagination on `GET /festivals` → when festival count justifies it.
- FestivalStaff/PlatformAdmin/organization plugin → admin milestone.
- Expo auth client / SecureStore / trustedOrigins / deep-link guard / splash gating → Phase 3/4.
