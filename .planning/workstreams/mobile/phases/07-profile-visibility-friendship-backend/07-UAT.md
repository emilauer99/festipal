---
status: testing
phase: 07-profile-visibility-friendship-backend
source: [07-VERIFICATION.md]
started: 2026-08-12T17:40:00Z
updated: 2026-08-12T17:40:00Z
---

## Current Test

number: 1
name: Ablehnen ist von nie-gefragt nicht unterscheidbar (VIS-01)
expected: |
  Kein Antwortfeld, Statuswert oder Fehlercode erlaubt es einem Anfragenden zu erkennen, ob
  seine Anfrage abgelehnt wurde oder ob er nie eine gesendet hat. Ablehnen darf die ablehnende
  Person der abgelehnten gegenüber niemals exponieren.
awaiting: user response

## Tests

### 1. Ablehnen ist von nie-gefragt nicht unterscheidbar (VIS-01)
expected: Kein Antwortfeld, Statuswert oder Fehlercode erlaubt einem Anfragenden, "meine Anfrage wurde abgelehnt" von "ich habe nie eine gesendet" zu unterscheiden.
evidence: Nicht-autoritative LLM-Einschätzung PASS — `decline`/`withdraw` antworten immer `200 {result:'removed'}` ohne 404-Zweig (`friendship.controller.ts`); `accept` kollabiert "kein Request" und "eigener Request" auf dieselbe 404-Message; `relation` nach einem Decline ist `none`, also identisch zu "nie gesendet".
why_human: Per Plan 07-05 bewusst ohne `check_*`-Deskriptor geführt, damit die Aussage als flagged-unverified disponiert und nie stillschweigend grün wird. Die Einschätzung oben ist NICHT autoritativ.
result: [pending]

### 2. Freundschaft wächst nicht zu einem 1:1-Nachrichtenkanal (VIS-02, ADR-020)
expected: Kein Endpunkt, Feld oder Schema aus dieser Phase schafft einen Direktnachrichten-Pfad zwischen zwei Besuchern. ADR-020 führt das als dauerhaften Ausschluss, nicht als Vertagung.
evidence: Nicht-autoritative LLM-Einschätzung PASS — kein Message-/Chat-Endpunkt im Contract; mechanisch gestützt durch das DM-Segment-Inventar in `projection-uniqueness.spec.ts` (13 verbotene Pfadsegmente, über alle Routen geprüft).
why_human: Siehe Test 1 — judgment-tier, bewusst nicht mechanisierbar geführt.
result: [pending]

### 3. Keine vorgetäuschte Schutzkontrolle (VIS-01, FRND-09 vertagt)
expected: Nichts im Code — kein Feld, Flag, keine Fehlermeldung und kein Schemaname — suggeriert, es gäbe eine Kontrolle darüber, wer einen finden oder kontaktieren darf. v1.1 liefert Username-Auffindbarkeit und Anfragen von Fremden ohne Block, Report, Cooldown, Opt-out oder Rate-Limit (D-05, D-11, D-13).
evidence: Nicht-autoritative LLM-Einschätzung PASS — `grep 'searchable'` über contracts/db/api-Quellen = 0 Treffer; `visitorSearchQuerySchema` trägt exakt `{q}`; keine Cooldown-/Block-/Report-Felder, -Flags oder -Fehlermeldungen.
why_human: Siehe Test 1. Zusätzlich ist das die Aussage mit der grössten Produktkonsequenz — sie beschreibt, was Nutzerinnen in v1.1 NICHT an Schutz haben.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
