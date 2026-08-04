---
status: complete
phase: 03-mobile-app-shell-i18n-foundation
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md, 03-06-SUMMARY.md]
started: 2026-08-04T10:44:21Z
updated: 2026-08-04T10:47:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Kernpfad end-to-end auf echtem Android-Gerät
expected: |
  Kalt-Start ohne Auth-Flash → OTP-Login (Code aus Mailpit) mit lokalisierten Fehlern
  → authentifizierte Festival-Liste zeigt „Frequency 2026" → Save → gate-less Enter
  → Festival-Home → Zurück; Session überlebt Force-Quit-and-Relaunch; UI lokalisiert
  DE/EN mit deutschem Fallback für eine dritte Gerätesprache.
  (Konsolidiert die Runtime-Wahrheiten aus 03-03 D1/D2, 03-04 D1/D2/D3, 03-05 D1/D2/D3,
  die laut Phasen-VALIDATION alle explizit an das On-Device-UAT von Plan 06 delegiert wurden.)
result: pass
note: "Bereits am 2026-08-03 auf echtem Android abgenommen (03-06 D2, alle 6 Checks). User bestätigte am 2026-08-04, dass die Abnahme weiterhin gilt."

### 2. docker-compose Postgres 18 + Mailpit; db:push + db:seed erzeugt frequency-2026
expected: docker compose config -q + up -d + db:push + db:seed erzeugen das reale frequency-2026 Festival
result: pass
source: automated
coverage_id: D1-03-01

### 3. Mailpit-OTP-Transport + trustedOrigins; Backend-Suite grün
expected: createOtpEmailProvider mit Mailpit-Branch; trustedOrigins akzeptiert festipal:// und exp://; api typecheck + test 31/31
result: pass
source: automated
coverage_id: D2-03-01

### 4. apps/mobile Expo-Router-Scaffold; Metro löst @festipal/* Workspace-Pakete auf
expected: mobile typecheck + expo export --platform android (1412 Module, keine „Unable to resolve module @festipal")
result: pass
source: automated
coverage_id: D1-03-02

### 5. Reale, nicht-gestubbte DE/EN Lingui-Kataloge; lingui extract idempotent
expected: lingui extract && git diff --exit-code apps/mobile/locales (sauber)
result: pass
source: automated
coverage_id: D3-03-02

### 6. resolveUiLocale (override/subtag/order/empty/uiFallback, D-07) test-gelockt
expected: packages/i18n/src/resolve.test.ts 6/6 grün
result: pass
source: automated
coverage_id: D4-03-02

### 7. Dev-Build erlaubt Cleartext-HTTP zur LAN-API (Android + iOS ATS), dev-only
expected: app.json expo-build-properties (android.usesCleartextTraffic + iOS NSAllowsLocalNetworking + _devOnlyCleartextComment); mobile typecheck
result: pass
source: automated
coverage_id: D1-03-06

### 8. Tracer-Screen rendert Lingui <Trans> + LOCALE_LABELS (03-02 D2)
expected: Erste UI-String im Repo lokalisiert und lint-enforced
result: skipped
reason: "Überholt: app/index.tsx (Tracer-Screen) wurde in 03-03 gelöscht (unbewachter Deep-Link-Leak durch Stack.Protected ersetzt). i18n-Zweck durch reale Screens in 03-04/05 abgedeckt."

## Summary

total: 8
passed: 7
issues: 0
pending: 0
skipped: 1
blocked: 0

## Deferred Follow-Ups

- test: 1
  idea: "iOS On-Device-Verifikation derselben 6 Checks — verschoben, da Mac + Xcode + Apple-ID-Provisioning-Toolchain nicht eingerichtet (user-approved deviation, 03-06). Dev-Cleartext iOS-ATS-Config ist bereits vorhanden und typecheck-clean; nur der physische Geräte-Lauf steht aus."
  deferred_at: 2026-08-04

## Gaps

[none yet]
