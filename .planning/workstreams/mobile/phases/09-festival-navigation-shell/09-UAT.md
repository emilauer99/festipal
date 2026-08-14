---
status: complete
phase: 09-festival-navigation-shell
source: [09-VERIFICATION.md]
started: 2026-08-14T20:55:00Z
updated: 2026-08-14T22:42:50Z
---

> Runde 2 (Gap-Closure-Nachtest). Runde 1 (8 Tests, 6 pass / 2 issues → G-09-2, G-09-7)
> ist in der Git-History dieses Files dokumentiert; beide Gaps wurden durch Plan 09-07
> code-seitig geschlossen (Commits 6c5d9a7, a114834, c7d45de) und werden hier am Gerät
> nachgeprüft.

## Current Test

[testing complete]

## Tests

### 1. Header-Default am Gerät (G-09-2-Nachtest — WINDOWS #47, 09-07 Task 1)
expected: Ruhe-Abstand unter dem Glas ~18–20dp; kein Routenname hinter dem Glas; keine native Leiste auf Welcome/E-Mail/Code; friend-detail-Modal weiterhin schließbar; Notch + max. Schriftskalierung ok
result: pass

### 2. Festival-Tab-Labels am Gerät (G-09-7-Nachtest — WINDOWS #48, 09-07 Task 2)
expected: Fünf gerenderte Labels DE+EN — Live, quiks (lowercase, ungeübersetzt), Crew, Timetable, Karte (EN Map); AudioLines-Glyph auf Position 1; Crew-Kachel-Eyebrow "Freunde hier" und globaler Friends-Tab unverändert; Labels truncaten sauber bei schmaler Breite; KEIN statischer Live-Punkt am Live-Tab
result: pass

### 3. ADR-014-Änderungsnotiz Gegenlesen (09-07 Task 3)
expected: Die Notiz in docs/DEVELOPMENT_DECISIONS.md (ADR-014-Amendment, 2026-08-14) trennt sauber die aufgehobene UI-Label-Regel ("Crew" als Label erlaubt) von der intakten Datenregel (kein Crew-Datenmodell); NAV-01/NAV-02-Wording in REQUIREMENTS.md passt zu den neuen Labels
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

## Deferred Follow-Ups

- test: 7 (Runde 1)
  idea: "navLiveDot aus den Screen-Designs (roter Punkt am Live-Tab, quiks-screens.template.html:1938/:2055) — erst mit echtem Live-Signal einbauen (NAV-02-Ehrlichkeit), nicht statisch simulieren"
  deferred_at: 2026-08-14
