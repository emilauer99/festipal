---
phase: 6
slug: profile-friends-placeholders
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-11
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (node environment — `apps/mobile/vitest.config.ts`) |
| **Config file** | `apps/mobile/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @quiks/mobile test` |
| **Full suite command** | `pnpm test` (Turbo, all packages) |
| **Estimated runtime** | Quick run ~10 s wall (Vitest-Dauer 2,9 s bei 14 Dateien / 148 Tests, gemessen 2026-08-11 vor Phasenbeginn). Full suite nicht gemessen — `apps/api` verlangt die laufende lokale Docker-Postgres-Instanz. |

*Scope caveat (from `06-RESEARCH.md`): the mobile Vitest runner is node-env and covers `lib/` only — screen/route/native behaviour is NOT unit-testable here and must fall to lint/typecheck gates or on-device UAT.*

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @quiks/mobile test`
- **After every plan wave:** Run `pnpm lint && pnpm typecheck && pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 s nach jedem Task-Commit (Mobile-Suite); `apps/api`-Integrationssignal aus `06-02-03` liegt bei ~1–2 min, weil es gegen die echte Datenbank läuft

---

## Per-Task Verification Map

*Die Spalte „Automated Command" nennt das jeweils aussagekräftigste Kommando; die vollständige Kette steht im `<verify><automated>`-Block des jeweiligen Plans. `static` = Grep-/Lint-/Typecheck-Gate (das einzig verfügbare automatisierte Signal für Screen-Code in dieser node-env-Umgebung), `unit` = Vitest über `lib/`, `integration` = Test gegen die lokale Docker-Postgres-Instanz, `manual` = Geräteabnahme oder Entscheidungs-Gate.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | HOME-03, PROF-01, FRND-01 | T-06-01 / T-06-02 | `profil` ist im `Stack.Protected`-Block registriert; unauthentifiziert ist die Route nicht erreichbar, `/me` bleibt sessiongebunden | static + unit | `pnpm --filter @quiks/mobile typecheck && pnpm --filter @quiks/mobile lint && pnpm --filter @quiks/mobile test && grep -q 'name="profil"' apps/mobile/app/_layout.tsx` | ✅ | ⬜ pending |
| 06-01-02 | 01 | 1 | HOME-03 | T-06-04 | Kein Unmatched-Route-Screen beim Push und kein Deep-Link-Artefakt (Repo-Lehre Phase 5) | manual | — (Geräteabnahme, siehe Manual-Only) | — | ⬜ pending |
| 06-02-01 | 02 | 1 | PROF-01 | T-06-05 / T-06-06 | Sichtbares Gate vor der one-way-Erweiterung um personenbezogene Felder | manual | — (`checkpoint:decision`, blocking) | — | ⬜ pending |
| 06-02-02 | 02 | 1 | PROF-01 | T-06-05 / T-06-07 / T-06-10 | Jede `getProfile(`-Aufrufstelle übergibt `session.user.id`; genau zwei Fundstellen der öffentlichen Projektion in `router.ts`; Längen-Caps serverseitig | static | `[ "$(grep -rn 'getProfile(' apps/api/src \| grep -v 'async getProfile(' \| grep -vc 'session.user.id')" = "0" ] && [ "$(grep -c 'visitorProfilePublicSchema' packages/contracts/src/router.ts)" = "2" ]` | ✅ | ⬜ pending |
| 06-02-03 | 02 | 1 | PROF-01 | T-06-08 / T-06-09 | Migration liegt als committete Datei vor, kein `db:push`; Round-Trip gegen die echte DB beweist die angewendete Migration und den Grenzwert-Reject | integration | `ls packages/db/drizzle/0004_*.sql && pnpm --filter @quiks/api test` | ✅ (`apps/api/test/me-endpoints.spec.ts`) | ⬜ pending |
| 06-03-01 | 03 | 1 | PROF-01 | T-06-11 / T-06-12 | Unbekannter Override-Wert fällt auf `system`; Speicherfehler beim ersten Frame werden geschluckt statt zu werfen | unit | `pnpm --filter @quiks/mobile test -- theme` | ✅ TDD (in-task erzeugt: `theme-override-storage.test.ts`) | ⬜ pending |
| 06-03-02 | 03 | 1 | PROF-01 | T-06-13 / T-06-14 | Unparsbares oder in der Zukunft liegendes `birthDate` ergibt keinen Alterswert; das Geburtsdatum wird nie gerätelokal persistiert | unit | `pnpm --filter @quiks/mobile test -- profile` | ✅ TDD (in-task erzeugt: `profile-age.test.ts`, `profile-meta-line.test.ts`) | ⬜ pending |
| 06-04-01 | 04 | 2 | PROF-01, FRND-01 | T-06-17 | Zeilenbausteine rendern reinen Text, kein numerisches `fontWeight`, keine Rohfarben | static | `pnpm --filter @quiks/mobile lint && pnpm --filter @quiks/mobile typecheck && pnpm --filter @quiks/mobile test` | ✅ | ⬜ pending |
| 06-04-02 | 04 | 2 | PROF-01, FRND-01 | T-06-15 / T-06-16 / T-06-18 | Hinweis verdeckt die FloatingNav nicht, räumt seinen Timer und ist für Screenreader angekündigt | static | `grep -q '<ToastProvider' apps/mobile/app/_layout.tsx && grep -q 'accessibilityLiveRegion' apps/mobile/components/SoonToast.tsx` | ✅ | ⬜ pending |
| 06-05-01 | 05 | 3 | HOME-03 | T-06-20 / T-06-22 | Externer Link nur über die Modul-Konstante `SAFENOW_URL`; tote Schalter sind wirklich `disabled` | static | `grep -q "https://safenow.app" 'apps/mobile/app/(tabs)/mehr.tsx' && [ -z "$(grep -n 'openURL(' 'apps/mobile/app/(tabs)/mehr.tsx' \| grep -v 'SAFENOW_URL')" ]` | ✅ | ⬜ pending |
| 06-05-02 | 05 | 3 | HOME-03 | T-06-19 / T-06-21 | Die drei Abmelde-Härtungen wandern unverändert mit; keine Abmelde-Affordanz bleibt im Festivals-Header | static | `[ "$(grep -c 'LogOut' 'apps/mobile/app/(tabs)/festivals.tsx')" = "0" ] && grep -q 'forceUnauthenticated' 'apps/mobile/app/(tabs)/mehr.tsx' && grep -q 'clearActiveFestivalSlug' 'apps/mobile/app/(tabs)/mehr.tsx'` | ✅ | ⬜ pending |
| 06-06-01 | 06 | 3 | FRND-01, HOME-03 | T-06-26 / T-06-27 | Kein funktionsfähig wirkendes Suchfeld, kein Posteingang-Eindruck ohne Voraussetzungssatz | static | `pnpm --filter @quiks/mobile lint && pnpm --filter @quiks/mobile typecheck && pnpm --filter @quiks/mobile test` | ✅ | ⬜ pending |
| 06-06-02 | 06 | 3 | FRND-01 | T-06-24 / T-06-25 | Nur der EIGENE Handle aus `/me`; kein Festival-State, kein echter QR-Code-Generator | static | `grep -q 'getMe' 'apps/mobile/app/(tabs)/friends.tsx' && ! grep -inE "qrcode\|react-native-qr" 'apps/mobile/app/(tabs)/friends.tsx'` | ✅ | ⬜ pending |
| 06-07-01 | 07 | 3 | PROF-01 | — (Doku-/Markenregel, D-07) | Kein Dokument formuliert die Sunset-Regel nach der Änderung noch enger als ADR-023 — inklusive der Kurzfassung in der Wurzel-`CLAUDE.md` | static | `grep -q 'gradientSunset' apps/mobile/components/AvatarSunsetRing.tsx && grep -niq 'avatar' docs/brand/quiks-ci-v1.md && [ -z "$(grep -i 'sunset' CLAUDE.md \| grep -vi 'avatar')" ]` | ✅ | ⬜ pending |
| 06-07-02 | 07 | 3 | PROF-01 | T-06-28 / T-06-30 / T-06-32 | Werte stammen ausschließlich aus der sessiongebundenen `/me`-Antwort; keine erfundenen Beispieldaten; Name/Handle einzeilig mit Truncation | static + unit | `pnpm --filter @quiks/mobile test -- type-tracking && grep -q 'AvatarSunsetRing' apps/mobile/app/profil.tsx && grep -q 'festivalKeys' apps/mobile/app/profil.tsx` | ✅ | ⬜ pending |
| 06-08-01 | 08 | 4 | PROF-01 | T-06-SC | `[ASSUMED]`-Paket wird vor der Installation gegen die Registry geprüft; nie auto-approvable | manual | — (`checkpoint:human-verify`, blocking-human) | — | ⬜ pending |
| 06-08-02 | 08 | 4 | PROF-01 | T-06-33 / T-06-34 / T-06-35 | Keine Zeitzonenverschiebung beim Geburtsdatum (kein `toISOString` im Screen); Freitext-Caps greifen | static | `pnpm install --frozen-lockfile && pnpm --filter @quiks/mobile test && ! grep -q 'toISOString' 'apps/mobile/app/(profile-setup)/complete-profile.tsx' && grep -q 'birthDate' 'apps/mobile/app/(profile-setup)/complete-profile.tsx'` | ✅ | ⬜ pending |
| 06-09-01 | 09 | 5 | HOME-03, PROF-01, FRND-01 | T-06-36 / T-06-38 | SafeNow-Distanzierung in BEIDEN Katalogen; kein nutzergenerierter Inhalt als Meldung | static | `pnpm --filter @quiks/mobile compile && [ "$(grep -ci 'SafeNow' apps/mobile/locales/de/messages.po)" -ge 2 ] && [ "$(grep -ci 'SafeNow' apps/mobile/locales/en/messages.po)" -ge 2 ]` | ✅ | ⬜ pending |
| 06-09-02 | 09 | 5 | HOME-03, PROF-01, FRND-01 | T-06-37 | Kein grünes Gate aus dem Turbo-Cache; Bündelung beweist die Auflösbarkeit des nativen Moduls | static + unit | `pnpm install --frozen-lockfile && pnpm lint --force && pnpm typecheck --force && pnpm test --force && pnpm --filter @quiks/mobile build` | ✅ | ⬜ pending |
| 06-09-03 | 09 | 5 | HOME-03, PROF-01, FRND-01 | T-06-39 | Gerätegebundene Prüfungen sind als solche geführt und nicht als automatisiertes Kriterium getarnt | manual | — (`checkpoint:human-verify`, blocking; 18 Schritte) | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling-Kontinuität (aus der Karte abgelesen):** die längste Kette ohne automatisiertes Signal ist 2 Tasks (`06-01-02` → `06-02-01`); danach greift `06-02-02`. Die manuellen Tasks `06-08-01` und `06-09-03` stehen jeweils direkt neben einem automatisierten Task derselben Welle.

---

## Wave 0 Requirements

- [x] Kein Wave-0-Task nötig: kein `<verify><automated>` dieser Phase trägt ein `MISSING`-Signal.
- [x] Runner vorhanden — vitest 4.1.x node-env (`apps/mobile/vitest.config.ts`), 14 Testdateien in `apps/mobile/lib/__tests__/` laufen grün.
- [x] Integrationsfixture vorhanden — `apps/api/test/me-endpoints.spec.ts` samt `createTestApp`/`createTestDatabase` aus `apps/api/test/setup.ts`; `06-02-03` erweitert sie, statt neu zu bauen.
- [ ] Die drei NEUEN `lib/`-Testdateien (`theme-override-storage.test.ts`, `profile-age.test.ts`, `profile-meta-line.test.ts`) entstehen innerhalb von `06-03` als TDD-Task (rot zuerst) — kein separater Wave-0-Schritt, aber bis Plan `06-03` läuft, existieren sie nicht.

*Existing infrastructure (vitest, node-env, `apps/mobile/lib/__tests__/`) covers all `lib/`-level phase requirements; screen-level behaviour needs the Manual-Only table below.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vier echte Tabs in der Reihenfolge Start · Festivals · Friends · Mehr; Push Mehr → Profil ohne Unmatched-Route | HOME-03 | Der node-env-Runner rendert keine RN-Komponenten; Routenregistrierung ist strukturell unsichtbar. Repo-Lehre aus Phase 5: der Unmatched-Route-Bug war nur am Gerät (Device-Log + `expo start -c`) auffindbar. | `06-01` Task 2 `<how-to-verify>` — aus `apps/mobile` bauen, niemals aus dem Repo-Root |
| Freigabe der one-way-Schemaerweiterung (D-12/D-12a) | PROF-01 | Entscheidungs-Gate, kein prüfbares Verhalten — die Tür wird vor dem Durchschreiten sichtbar gemacht. | `06-02` Task 1 — `proceed-as-locked` oder `defer-identity-fields` wählen |
| Legitimität von `@react-native-community/datetimepicker` vor der Installation | PROF-01 | Paket ist `[ASSUMED]`; Legitimität ist nicht automatisiert entscheidbar und der Checkpoint ist nie auto-approvable (`workflow.auto_advance` gilt nicht). | `06-08` Task 1 — Eintrag auf `npmjs.com/package/@react-native-community/datetimepicker` prüfen |
| Friends-Screen: liest sich die Leere absichtsvoll oder kaputt? | FRND-01 | Ästhetisch-semantisches Urteil über sechs leere Sektionen — kein Assert möglich. Hauptrisiko der Phase (D-11). | `06-09` Task 3, Schritt 4 — je Block kurz notieren; besonders der Chats-Block |
| Dunkler Modus: sofortige Wirkung, Persistenz über Force-Quit, Rückfall auf die Geräteeinstellung | HOME-03 | MMKV-Persistenz über einen echten Prozessneustart und die Auflösung des Systemschemas sind nur am Gerät beobachtbar. | `06-09` Task 3, Schritte 6–8 inkl. Gegenprobe „Gerät hell, Schalter aus" |
| SafeNow-Karte: Distanzierungssatz vollständig, nicht abgeschnitten, in beiden Sprachen; Link öffnet den Browser | I18N-01 | Truncation und Zeilenumbruch sind rein visuell; der Katalog-Grep beweist nur die Existenz, nicht die Sichtbarkeit. | `06-09` Task 3, Schritt 8 |
| Abmelden: native Rückfrage, Abbrechen hält die Session, Bestätigen landet auf dem Willkommensbildschirm | HOME-03 | Nativer `Alert` plus Auth-Zustandswechsel über die Root-Guard — außerhalb des node-env-Runners. | `06-09` Task 3, Schritte 9–10 |
| Sunset-Ring mit erkennbarem Spalt, in beiden Farbmodi | PROF-01 | Rein visuell; der Token-Test prüft Werte, nicht die gerenderte Fläche. | `06-09` Task 3, Schritt 11 |
| Identitätsfelder am Gerät: optionales Absenden, Picker-Eingabe, Reihenfolge Pronomen · Alter · Geschlecht, Auslassverhalten bei nur einem Wert | PROF-01 | Nativer Date-Picker und die Zusammensetzung der Zeile im echten Layout; die Altersableitung ist zwar `lib/`-getestet, der Grenzfall „Geburtstag dieses Jahr noch nicht" wird zusätzlich am Gerät gegengeprüft. | `06-09` Task 3, Schritte 15–17 (drei neue Konten) |
| Englischer Durchgang: keine deutschen Reste, keine sichtbaren Meldungsschlüssel | I18N-01 | Rendering in Gerätesprache; die strikte Kompilierung beweist Vollständigkeit, nicht die Darstellung. | `06-09` Task 3, Schritt 18 |

*Repo lesson: RN routing and native behaviour must be verified on-device (device log + `expo start -c`) — a green node-env Vitest run is not evidence for route registration or navigation.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s (Mobile-Suite; `06-02-03` als Integrationstest ausgenommen)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
