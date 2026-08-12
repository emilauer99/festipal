---
status: testing
phase: 06-profile-friends-placeholders
source: [06-VERIFICATION.md]
started: 2026-08-12T10:25:00Z
updated: 2026-08-12T10:25:00Z
---

## Current Test

number: 1
name: WR-01 — Dunkelmodus-Schalter auf einem System-Dark-Gerät
expected: |
  Die App wird hell und BLEIBT nach dem Relaunch hell (Override 'light' persistiert);
  der Schalter springt nicht mehr auf AN zurück.
awaiting: user response

## Tests

### 1. WR-01 — Dunkelmodus-Schalter auf einem System-Dark-Gerät
expected: Gerät auf dunkles Systemschema stellen, App öffnen (dunkel), in Mehr → Darstellung den Schalter AUSschalten, App force-quitten und neu starten. Die App wird hell und bleibt nach dem Relaunch hell; der Schalter springt nicht mehr auf AN zurück.
result: [pending]

### 2. CR-01 — Logout→Login-Cache-Probe mit zwei Konten
expected: Als Konto A einloggen, Profil und Friends öffnen, abmelden, als Konto B einloggen — am besten mit abgeschaltetem Netz direkt nach dem zweiten Login. Profil, Friends und Home zeigen ausschließlich Daten von Konto B; keine E-Mail, kein Handle, keine Festivals von Konto A.
result: [pending]

### 3. WR-04 — SoonToast mit iOS-VoiceOver
expected: iOS-Build mit eingeschaltetem VoiceOver, eine Platzhalter-Zeile antippen (Payment methods, Language, Share handle, Show QR oder die Friends-Suche). VoiceOver spricht den Hinweistext des Toasts.
result: [pending]

### 4. Backstop — maximal lange Identitätswerte
expected: Identitätszeile, Vibe-Chips und Stat-Kacheln mit Extremwerten ansehen (pronoun 20 Zeichen, gender 30 Zeichen, langer Katalogwert). Zeilen bleiben lesbar, das dreispaltige Kachelraster bricht nicht, Chips umbrechen statt zu überlaufen.
result: [pending]

### 5. Prohibition-Review (judgment-tier)
expected: Vier Urteile menschlich bestätigen — (a) die SafeNow-Karte liest sich nicht als Partnerschaft, der Distanzierungssatz steht in DE und EN vollständig; (b) kein Friends-Block suggeriert eine funktionierende Fläche, keine erfundenen Personen, keine Scham- oder Dringlichkeits-Copy; (c) die Profil-Ausblick-Blöcke zeigen keine erfundenen Messwerte; (d) nichts suggeriert, der gerätelokale Avatar sei kontogesichert. Der Verifier hat alle vier gegen die tatsächliche Copy im Code und in beiden Katalogen geprüft und als eingehalten beurteilt — dieses Urteil ist ausdrücklich NICHT autoritativ.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

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
