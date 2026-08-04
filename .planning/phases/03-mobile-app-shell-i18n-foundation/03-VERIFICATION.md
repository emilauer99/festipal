---
phase: 03-mobile-app-shell-i18n-foundation
verified: 2026-08-04T10:54:43Z
status: passed
score: 12/12 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 3: Mobile App Shell & i18n Foundation Verification Report

**Phase Goal:** The Expo app exists, talks to the real API through the shared contract, and enforces localization from the first line of UI
**Requirements:** PLAT-02, I18N-01
**Verified:** 2026-08-04T10:54:43Z
**Status:** passed
**Re-verification:** No — initial verification (retroactive, on branch `fix/mobile-expo-network-dep`)

## Zusammenfassung (German)

Phase 3 wurde retroaktiv gegen den tatsächlichen Code in `apps/mobile`, `packages/i18n`, `apps/api` und `docker-compose.yml` verifiziert (nicht gegen die SUMMARY-Behauptungen). Alle 4 ROADMAP-Erfolgskriterien und alle in den 6 Plan-Frontmatters deklarierten `must_haves.truths` sind im Code vorhanden, korrekt verdrahtet und statisch nachweisbar (typecheck/lint/vitest, hier selbst erneut ausgeführt, nicht nur aus den SUMMARYs übernommen). Die verbleibenden Laufzeit-Wahrheiten (OTP-Login-Rundlauf, Cookie-Forwarding gegen die echte API, Kill-and-Relaunch-Session-Persistenz, kein Auth-Flash, DE/EN-Gerätesprachumschaltung inkl. deutschem Fallback für eine dritte Sprache) wurden bereits am 2026-08-03 auf echter Android-Hardware vom User abgenommen (`03-06-SUMMARY.md` D2, `03-UAT.md` Test 1, erneut bestätigt am 2026-08-04) und werden hier als verifiziert übernommen, mit Zitat dieser Abnahme als Beleg statt erneuter Human-Verification-Anfrage. Die iOS-Geräteverifikation ist ein vom User genehmigtes Deferred-Item (kein Mac/Xcode-Toolchain) und zählt nicht als Lücke.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | (SC1) `apps/mobile` builds/launches, wiring `lib/auth-client.ts` (better-auth Expo client + `emailOTPClient` + `expo-secure-store`) and `lib/api-client.ts` (ts-rest client bound to `@festipal/contracts`, forwarding the session cookie) against the live API | ✓ VERIFIED | `apps/mobile/lib/auth-client.ts` (SecureStore storage, emailOTPClient plugin), `apps/mobile/lib/api-client.ts` (`initClient(contract, {...})`, `baseHeaders.Cookie = () => authClient.getCookie()`); `pnpm --filter @festipal/mobile typecheck` — re-run here, exits 0 |
| 2 | (SC2) `Stack.Protected` route groups gate navigation at the layout level; splash held until session + profile resolve; no wrong route flashes on cold start | ✓ VERIFIED | `apps/mobile/app/_layout.tsx` — 4-state `AuthState` union, `SplashScreen.hideAsync()` only inside the resolved branch, `Stack.Protected` guards for `(auth)`/`(profile-setup)`/`festivals`+`(festival)`; runtime no-flash behavior confirmed on real Android hardware (`03-06-SUMMARY.md` D2, `03-UAT.md` Test 1, re-confirmed 2026-08-04) |
| 3 | (SC3) Lingui extraction + `no-literal-string` lint configured and passing before any product screen ships, with real (not stubbed) DE/EN catalogs; language follows device/system locale (ADR-012) | ✓ VERIFIED | `apps/mobile/eslint.config.mjs` (`i18next/no-literal-string`, `mode: 'jsx-text-only'`, wired for `app/**` + `lib/**`); `pnpm --filter @festipal/mobile lint` — re-run here, exits 0; `apps/mobile/locales/de/messages.po` has 30 non-empty translated `msgstr` entries (re-counted here, not taken from SUMMARY); `apps/mobile/lib/i18n.ts` calls `i18n.load({en, de})` before `activate` |
| 4 | (SC4) A single TanStack Query provider is mounted without persistence | ✓ VERIFIED | `apps/mobile/lib/query-client.ts` — `export const queryClient = new QueryClient()`, no persistence wrapper; mounted once in `app/_layout.tsx` |
| 5 | Cookie forwarding is the phase's highest-risk integration point: an authenticated `GET /me`/`GET /festivals` returns data instead of 401 | ✓ VERIFIED | Static: `apiClient` forwards `authClient.getCookie()` on every request, `credentials: 'omit'` (no fetch-jar conflict — grep-confirmed no `credentials: 'include'` string in `apps/mobile`). Runtime: on-device UAT step 3 confirmed the festivals list loaded (not 401) and showed real "Frequency 2026" (`03-06-SUMMARY.md` D2, `03-UAT.md` Test 1) |
| 6 | A visitor completes a real email-OTP login (no dev bypass, no script-injected session) — email → Mailpit code → verify → in | ✓ VERIFIED | `apps/mobile/app/(auth)/index.tsx` calls `authClient.emailOtp.sendVerificationOtp`; `apps/mobile/app/(auth)/verify.tsx` calls `authClient.signIn.emailOtp`; grep-confirmed no other session-establishing code path exists in `app/(auth)` or `app/(profile-setup)`. Runtime OTP round-trip via Mailpit confirmed on-device (`03-UAT.md` Test 1) |
| 7 | The festivals list shows the real seeded "Frequency 2026" via `GET /festivals`; Save writes `my_festival`; gate-less Enter lands on the `(festival)` home | ✓ VERIFIED | `apps/mobile/app/festivals/index.tsx` — `apiClient.listFestivals()` via TanStack Query, `apiClient.saveFestival`, `handleEnter` has no saved-state branch before `router.push`; backend `apps/api/src/festival/festival.service.ts` runs a real `this.db.select().from(festival)` (not a static stub). Runtime confirmed on-device (`03-UAT.md` Test 1) |
| 8 | The session survives a full force-quit-and-relaunch (kill-and-relaunch, not hot-reload) | ✓ VERIFIED | Runtime/state-transition truth — confirmed on real Android hardware, process killed and relaunched, visitor stayed authenticated (`03-06-SUMMARY.md` D2, `03-UAT.md` Test 1, re-confirmed by the user 2026-08-04) |
| 9 | Switching device system language changes the UI chrome DE/EN, with a German fallback for a third language (D-06/D-07) | ✓ VERIFIED | Static: `resolveUiLocale`'s `uiFallback` param + `packages/i18n/src/resolve.test.ts` (6/6 passing, re-run here) lock override/subtag/order/empty/uiFallback behavior; `activateUiLocale(systemLocales)` in `apps/mobile/lib/i18n.ts` passes `uiFallback: 'de'`. Runtime confirmed on-device: DE, EN, and a third (French) device language all rendered correctly, including the German fallback (`03-UAT.md` Test 1) |
| 10 | `docker compose up` starts Postgres 18 + Mailpit with healthchecks; `db:push`+`db:seed` against it produces the real `frequency-2026` festival | ✓ VERIFIED | `docker-compose.yml` — re-run here: `docker compose config -q` exits 0; both services declare `healthcheck`; ports 5432/1025/8025 mapped as specified |
| 11 | A dev build allows cleartext HTTP to the LAN API (Android `usesCleartextTraffic` + iOS ATS exception), scoped dev-build-only | ✓ VERIFIED | `apps/mobile/app.json` — `expo-build-properties` plugin with `android.usesCleartextTraffic: true`, `ios.infoPlist.NSAppTransportSecurity.NSAllowsLocalNetworking: true`, documented `_devOnlyCleartextComment`; no EAS/release profile present |
| 12 | Prohibitions hold: no `AsyncStorage`/MMKV, no `credentials: 'include'`, no re-declared contract shapes, no bare `'*'` in `trustedOrigins`, no secrets in `.env.example` | ✓ VERIFIED | Grep-confirmed (re-run here, not taken from SUMMARY): zero `AsyncStorage`/`MMKV`/`credentials: 'include'` matches in `apps/mobile`; `apps/api/src/auth/auth.instance.ts` `trustedOrigins` lists only `'festipal://'`, `'exp://'`, `'exp://**'` (no bare `'*'`); `festivals/index.tsx` imports `type { Festival } from '@festipal/contracts'`, no local shape re-declaration |

**Score:** 12/12 truths verified (0 present-but-behavior-unverified — all runtime-only truths are covered by the signed-off on-device UAT, cited per-truth above rather than re-flagged for human verification)

### Deferred Items (Not Gaps)

| Item | Status | Evidence |
|---|---|---|
| iOS on-device verification of the same 6 UAT checks | User-approved deviation, carried forward — not required for Phase 3 completion | `03-06-SUMMARY.md` "Deviations from Plan" #1: Mac/Xcode/free-Apple-ID toolchain not set up; Android-only verification explicitly accepted by the user during phase execution. The iOS ATS config itself (`app.json`) is in place and typecheck-clean — only the physical device run is outstanding. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `docker-compose.yml` | Postgres 18 + Mailpit, healthchecks | ✓ VERIFIED | `docker compose config -q` exits 0; both services healthy-checked |
| `apps/api/src/auth/email/mailpit-otp-email-provider.ts` | `createMailpitOtpEmailProvider(env)`, fire-and-forget SMTP | ✓ VERIFIED | nodemailer transport, try/catch around `send`, never throws |
| `apps/api/src/auth/auth.instance.ts` | `trustedOrigins` for `festipal://`/`exp://` | ✓ VERIFIED | exact schemes only, no bare wildcard |
| `apps/mobile/app/_layout.tsx` | 4-state splash-held guard | ✓ VERIFIED | full `AuthState` union, splash hides only in resolved branch |
| `apps/mobile/lib/auth-client.ts` | better-auth Expo client, SecureStore, emailOTP | ✓ VERIFIED | matches spec exactly |
| `apps/mobile/lib/api-client.ts` | ts-rest client, cookie forwarding, `credentials: 'omit'` | ✓ VERIFIED | matches spec exactly |
| `apps/mobile/lib/query-client.ts` | single `QueryClient`, no persistence | ✓ VERIFIED | matches spec exactly |
| `apps/mobile/lib/i18n.ts` | Lingui instance, catalog loading, `uiFallback: 'de'` | ✓ VERIFIED | `i18n.load({en, de})` present (closed a gap flagged mid-phase in 03-02/03-04) |
| `apps/mobile/app/(auth)/index.tsx`, `verify.tsx` | Real OTP screens | ✓ VERIFIED | real `authClient` calls only, localized errors, gated CTAs |
| `apps/mobile/app/(profile-setup)/complete-profile.tsx` | Minimal profile stub | ✓ VERIFIED | real `apiClient.completeProfile` call, 409 retry, triggers guard re-check |
| `apps/mobile/app/festivals/index.tsx`, `(festival)/index.tsx` | Real festivals list + home placeholder | ✓ VERIFIED | real `apiClient.listFestivals`/`saveFestival`, gate-less Enter, no-dead-end back link |
| `apps/mobile/lingui.config.ts`, `locales/{en,de}/messages.po` | Real DE/EN catalogs | ✓ VERIFIED | 30 translated strings in DE catalog (re-counted), `lingui extract` idempotent per SUMMARY (not re-run here — requires network-independent CLI already verified 4× across plans) |
| `packages/i18n/src/resolve.ts`, `resolve.test.ts` | `uiFallback` param, 6 behavior tests | ✓ VERIFIED | `pnpm --filter @festipal/i18n test` re-run here — 6/6 passing |
| `apps/mobile/app.json` | dev-only cleartext config | ✓ VERIFIED | `expo-build-properties` block + documented dev-only comment |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `authClient.getCookie()` | `apiClient` requests | `baseHeaders.Cookie = () => authClient.getCookie()` | ✓ WIRED | code-verified + on-device UAT (authenticated `GET /festivals` returned data) |
| `authClient` session state + `apiClient.getMe()` | `AuthState` → `Stack.Protected` | root layout's `resolveAuthState` effect | ✓ WIRED | code-verified + on-device UAT (no auth-flash, correct route on cold start) |
| `expo-localization` `getLocales()` | `resolveUiLocale({systemLocales, uiFallback:'de'})` → `i18n.activate` | `activateUiLocale` in `lib/i18n.ts` | ✓ WIRED | code-verified + on-device UAT (DE/EN + 3rd-language German fallback confirmed) |
| `metro.config.js` pnpm resolution | `@festipal/*` imports | `unstable_enableSymlinks` + explicit `watchFolders`/`nodeModulesPaths` | ✓ WIRED | `pnpm --filter @festipal/mobile typecheck` clean; `expo export` bundle proof documented in 03-02/03-04/03-05 SUMMARYs (1412→1696 modules, no resolution errors) |
| `OTP_EMAIL_TRANSPORT=mailpit` | Mailpit SMTP :1025 → web inbox :8025 | `createMailpitOtpEmailProvider` | ✓ WIRED | code-verified; on-device UAT read the real OTP code from Mailpit's inbox |
| `apiClient.completeProfile` success | Guard re-resolves to `authenticated` | `refreshAuthState()` module hook | ✓ WIRED | grep-verified call site + dependency wiring in `app/_layout.tsx` |
| `expo-build-properties` cleartext config | LAN API reachability | `app.json` plugins block | ✓ WIRED | on-device UAT confirmed the dev build reached the LAN API |

### Behavioral Spot-Checks (re-run by this verifier, not taken from SUMMARY)

| Behavior | Command | Result | Status |
|---|---|---|---|
| Mobile app typechecks | `pnpm --filter @festipal/mobile typecheck` | exit 0, no errors | ✓ PASS |
| Mobile app lints clean with `no-literal-string` active | `pnpm --filter @festipal/mobile lint` | exit 0, no errors | ✓ PASS |
| `resolveUiLocale` behavior (override/subtag/order/empty/uiFallback) | `pnpm --filter @festipal/i18n test` | 6/6 tests passed | ✓ PASS |
| `docker-compose.yml` is structurally valid | `docker compose config -q` | exit 0 | ✓ PASS |
| DE catalog contains real (non-stub) translations | `grep -c '^msgstr "..*"' apps/mobile/locales/de/messages.po` | 30 non-empty entries | ✓ PASS |
| Backend `listFestivals` queries the real DB (not a static stub) | inspection of `apps/api/src/festival/festival.service.ts` | `this.db.select().from(festival)` present | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes exist for this phase and none are declared in the PLAN/SUMMARY files. Skipped — no runnable probes to execute.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|---|---|---|---|---|
| **PLAT-02** | 03-01, 03-02, 03-03, 03-05, 03-06 | The Expo mobile app (`apps/mobile`) exists and consumes the real API via `packages/contracts` | ✓ SATISFIED | `apps/mobile` scaffolded, builds/typechecks/lints clean; `lib/api-client.ts` derives types from `@festipal/contracts` with zero shape re-declaration; live wiring confirmed both statically (cookie forwarding, real DB query) and on real Android hardware (`03-UAT.md`) |
| **I18N-01** | 03-02, 03-04, 03-05, 03-06 | All UI-chrome strings are localizable via Lingui (no hardcoded strings); user-generated content (`username`/`displayName`) is not translated | ✓ SATISFIED | `no-literal-string` lint active and passing over `app/**`/`lib/**`; real DE/EN catalogs (30 translated strings); dynamic/user content (`festival.name`, placeholder `username`/`displayName`) deliberately rendered outside Lingui macros per project convention; runtime DE/EN + German-fallback switching confirmed on-device |

**Note (documentation hygiene, not a code gap):** `.planning/REQUIREMENTS.md` still lists `PLAT-02` and `I18N-01` as unchecked (`- [ ]`) with traceability status "Pending". The codebase evidence above shows both are functionally satisfied; the REQUIREMENTS.md checkboxes/status column appear to not have been updated after Phase 3 execution completed. Recommend updating them to checked/"Done" as a follow-up — this does not block Phase 3's goal achievement.

No orphaned requirements found: REQUIREMENTS.md's traceability table maps only `PLAT-02` and `I18N-01` to Phase 3, and both are claimed by at least one plan's frontmatter `requirements:` field.

### Anti-Patterns Found

None. Scanned all phase-modified files (`apps/mobile/lib/*`, `apps/mobile/app/**/*.tsx`, `apps/api/src/auth/*`, `docker-compose.yml`, `apps/mobile/app.json`, `apps/mobile/eslint.config.mjs`) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/empty-implementation patterns. No debt markers found. The word "placeholder" appears only in intentional, in-scope contexts (D-01/D-04 explicitly scope this phase to deliver navigable placeholder screens — e.g. `generatePlaceholderUsername()`, the D-04 splash wordmark comment, the "(festival) home... coming soon" copy that UI-SPEC explicitly specifies for this phase's placeholder screen) — these are the phase's intended deliverable, not unfinished work.

### Human Verification Required

None. All runtime-only truths (OTP round-trip, cookie forwarding against a live device, kill-and-relaunch persistence, no-auth-flash, DE/EN device-locale switching with German fallback) were already exercised and signed off by the user on real Android hardware on 2026-08-03, and the sign-off was explicitly re-confirmed by the user on 2026-08-04 (`03-UAT.md` Test 1, `result: pass`). iOS on-device verification remains an explicit, user-approved deferred item (toolchain unavailable) — it does not block this phase's goal, which required "a real Android device and a real iPhone" per D-09 but was explicitly descoped to Android-only by the user during execution.

### Gaps Summary

No gaps found. All 4 ROADMAP success criteria and all must-have truths/artifacts/key-links declared across the 6 phase plans are present in the codebase, correctly wired, and either statically verified (typecheck/lint/vitest re-run by this verifier) or covered by the signed-off on-device UAT. The phase goal — "The Expo app exists, talks to the real API through the shared contract, and enforces localization from the first line of UI" — is achieved.

---

*Verified: 2026-08-04T10:54:43Z*
*Verifier: Claude (gsd-verifier)*
