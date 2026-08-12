---
status: complete
phase: 06-profile-friends-placeholders
source: [06-VERIFICATION.md]
started: 2026-08-12T10:25:00Z
updated: 2026-08-12T14:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. WR-01 — Dunkelmodus-Schalter auf einem System-Dark-Gerät
expected: Gerät auf dunkles Systemschema stellen, App öffnen (dunkel), in Mehr → Darstellung den Schalter AUSschalten, App force-quitten und neu starten. Die App wird hell und bleibt nach dem Relaunch hell; der Schalter springt nicht mehr auf AN zurück.
result: pass

### 2. CR-01 — Logout→Login-Cache-Probe mit zwei Konten
expected: Als Konto A einloggen, Profil und Friends öffnen, abmelden, als Konto B einloggen — am besten mit abgeschaltetem Netz direkt nach dem zweiten Login. Profil, Friends und Home zeigen ausschließlich Daten von Konto B; keine E-Mail, kein Handle, keine Festivals von Konto A.
result: pass

### 3. WR-04 — SoonToast mit iOS-VoiceOver
expected: iOS-Build mit eingeschaltetem VoiceOver, eine Platzhalter-Zeile antippen (Payment methods, Language, Share handle, Show QR oder die Friends-Suche). VoiceOver spricht den Hinweistext des Toasts.
result: pass

### 4. Backstop — maximal lange Identitätswerte
expected: Identitätszeile, Vibe-Chips und Stat-Kacheln mit Extremwerten ansehen (pronoun 20 Zeichen, gender 30 Zeichen, langer Katalogwert). Zeilen bleiben lesbar, das dreispaltige Kachelraster bricht nicht, Chips umbrechen statt zu überlaufen.
result: pass

### 5. Prohibition-Review (judgment-tier)
expected: Vier Urteile menschlich bestätigen — (a) die SafeNow-Karte liest sich nicht als Partnerschaft, der Distanzierungssatz steht in DE und EN vollständig; (b) kein Friends-Block suggeriert eine funktionierende Fläche, keine erfundenen Personen, keine Scham- oder Dringlichkeits-Copy; (c) die Profil-Ausblick-Blöcke zeigen keine erfundenen Messwerte; (d) nichts suggeriert, der gerätelokale Avatar sei kontogesichert. Der Verifier hat alle vier gegen die tatsächliche Copy im Code und in beiden Katalogen geprüft und als eingehalten beurteilt — dieses Urteil ist ausdrücklich NICHT autoritativ.
result: pass
reported: "alles pass"
note: "(a) und (b) im ersten Durchlauf bestätigt. (c) und (d) scheiterten damals am Profil-Crash (G-06-5), der von Plan 06-10 geschlossen wurde (Intl.PluralRules-Polyfill, gerätverifiziert); im Wiederholungslauf am 2026-08-12 hat der Nutzer alle vier Urteile bestätigt."

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-06-5
  truth: "Die Profilseite öffnet sich; die Profil-Ausblick-Blöcke zeigen keine erfundenen Messwerte und nichts suggeriert, der gerätelokale Avatar sei kontogesichert."
  status: resolved
  resolved_by: 06-10-PLAN.md
  resolved_at: 2026-08-12
  reason: "User reported: a) pass b) pass c) wenn ich auf Profile klicke kommt ein App Error:  ERROR  [TypeError: undefined cannot be used as a constructor.]"
  severity: blocker
  test: 5
  root_cause: "AND-Gate aus Code + Engine: `app/profil.tsx:199-200` ist die einzige Stelle der App, die eine ICU-Plural-Nachricht rendert (`plural()` aus `@lingui/core/macro`, eingeführt von 06-07) — unbedingt im Komponentenkörper, vor jedem Daten-Branch. `@lingui/core@6.6.0` wertet jeden Plural-Token eager über `new Intl.PluralRules(...)` aus (dist/index.mjs:75-84; `plurals` wird VOR dem `rules[value]`-Lookup gebunden, `festivalCount === 0` short-circuited also nicht). Hermes (Expo-Default, kein `jsEngine`-Override in app.json) implementiert `Intl.PluralRules` nicht, und die App registriert keinen Polyfill → Operand ist `undefined` → Hermes wirft wörtlich `TypeError: undefined cannot be used as a constructor.`"
  artifacts:
    - path: "apps/mobile/app/profil.tsx"
      issue: "Zeilen 7, 199-200 — einzige `plural()`-Aufrufstelle der App; läuft unbedingt vor dem viewState-Branch, crasht daher vor jedem Markup"
    - path: "apps/mobile/package.json"
      issue: "kein `@formatjs/intl-pluralrules` — Polyfill für die fehlende Engine-Fähigkeit fehlt"
    - path: "apps/mobile/app.json"
      issue: "kein `jsEngine`-Override — Hermes ist aktiv und kennt Intl.PluralRules nicht"
    - path: "apps/mobile/locales/de/messages.po, apps/mobile/locales/en/messages.po"
      issue: "Zeilen 17-22 tragen die Plural-ICU-Nachrichten; `formats.plural` wird in BEIDEN Sprachen erreicht"
    - path: "apps/mobile/vitest.config.ts"
      issue: "environment: 'node' (volles ICU, PluralRules vorhanden) und auf lib/**/__tests__/** beschränkt — rendert keine Screens, kann diese Fehlerklasse strukturell nicht fangen"
  missing:
    - "`@formatjs/intl-pluralrules` als Dependency in apps/mobile aufnehmen"
    - "`polyfill-force` + de/en-Locale-Daten als Side-Effect-Import am App-Entry laden, VOR dem ersten Render und vor der Aktivierung in lib/i18n.ts (bewusst `/polyfill-force`, nicht `/polyfill` — die Detection-Variante ist auf Android dokumentiert sekundenlangsam)"
    - "Die `plural()`-Aufrufe NICHT entfernen — das würde den Fehler nur maskieren und die in 06-07 bewusst erkaufte Korrektheit (Null ist eine echte Plural-Kategorie) aufgeben; jeder künftige Plural brächte den Crash zurück"
    - "Rückfall-Guard gegen diese Fehlerklasse (Lint-Regel oder Startup-Assertion) — grüner Typecheck und grüne Tests sind hier strukturell blind"
    - "Geräteverifikation: `cd apps/mobile && npx expo run:android` (nie aus dem Repo-Root), `typeof Intl.PluralRules` beim Start loggen — erwartet `undefined`. Druckt es `function`, auf AvatarSunsetRing/AvatarTile schwenken (die einzigen anderen profil-exklusiven Flächen)"
  debug_session: ".planning/debug/profile-screen-undefined-constructor.md"
  diagnosis_caveat: "Statisch mit der projekteigenen Toolchain bewiesen (Babel-Transform über profil.tsx, app-weiter grep, Lingui-dist-Quelltext); die Hermes-Fähigkeitsaussage selbst stützt sich auf Upstream-Doku (facebook/hermes#1462, FormatJS-Polyfill-Doku) und ist NICHT am Gerät verifiziert."

---

Keine offenen Gaps aus der Verifikation — kein Muss-Kriterium ist FAILED.
Die fünf Punkte oben sind Beobachtungen, die diese Umgebung strukturell nicht
erbringen kann: Punkt 1–3 sind natives bzw. sessionübergreifendes Verhalten,
Punkt 4 ist ein Backstop-Layoutfall, Punkt 5 ist ein judgment-tier-Verbot, das
nie stillschweigend grün werden darf.

**Wichtig:** Die Punkte 1 bis 3 prüfen Fixes, die NACH der pauschalen
18-Punkte-Geräteabnahme gelandet sind (`6707cf9`, `8790e1c`, `4f14feb`).
Die Abnahme deckt sie deshalb nicht ab.

**Vor dem Testen:** `cd apps/mobile && npx expo run:android` — 06-08 hat mit
`@react-native-community/datetimepicker` nativen Code eingebracht, ein
OTA-Reload nimmt ihn nicht auf. Nie aus dem Repo-Root bauen.
