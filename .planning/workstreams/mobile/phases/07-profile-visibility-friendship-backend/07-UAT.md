---
status: complete
phase: 07-profile-visibility-friendship-backend
source: [07-VERIFICATION.md]
started: 2026-08-12T17:40:00Z
updated: 2026-08-12T19:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Ablehnen ist von nie-gefragt nicht unterscheidbar (VIS-01)
expected: Kein Antwortfeld, Statuswert oder Fehlercode erlaubt einem Anfragenden, "meine Anfrage wurde abgelehnt" von "ich habe nie eine gesendet" zu unterscheiden.
evidence: Nicht-autoritative LLM-Einschätzung PASS — `decline`/`withdraw` antworten immer `200 {result:'removed'}` ohne 404-Zweig (`friendship.controller.ts`); `accept` kollabiert "kein Request" und "eigener Request" auf dieselbe 404-Message; `relation` nach einem Decline ist `none`, also identisch zu "nie gesendet".
why_human: Per Plan 07-05 bewusst ohne `check_*`-Deskriptor geführt, damit die Aussage als flagged-unverified disponiert und nie stillschweigend grün wird. Die Einschätzung oben ist NICHT autoritativ.
human_evidence: Live gegen die Dev-API nachgestellt (3 Accounts, OTP via Mailpit). A→B Anfrage, B lehnt ab. Danach ist A's Sicht auf B (abgelehnt) feldgleich mit A's Sicht auf C (nie kontaktiert) — HTTP 200/200, `relation` "none"/"none", identische Feldnamen; A's `/me/friend-requests` und `/me/friends` leer, Suchtreffer identisch. Gegenprobe: `decline` ohne existierende Anfrage antwortet ebenfalls `200 {"result":"removed"}`.
result: pass

### 2. Freundschaft wächst nicht zu einem 1:1-Nachrichtenkanal (VIS-02, ADR-020)
expected: Kein Endpunkt, Feld oder Schema aus dieser Phase schafft einen Direktnachrichten-Pfad zwischen zwei Besuchern. ADR-020 führt das als dauerhaften Ausschluss, nicht als Vertagung.
evidence: Nicht-autoritative LLM-Einschätzung PASS — kein Message-/Chat-Endpunkt im Contract; mechanisch gestützt durch das DM-Segment-Inventar in `projection-uniqueness.spec.ts` (13 verbotene Pfadsegmente, über alle Routen geprüft).
why_human: Siehe Test 1 — judgment-tier, bewusst nicht mechanisierbar geführt.
human_evidence: Vollständige Routenliste des Contracts geprüft (18 Routen, kein Nachrichten-Pfad); `DIRECT_MESSAGE_SEGMENTS` in `projection-uniqueness.spec.ts` prüft 13 verbotene Segmente gegen jede Route, eine künftige DM-Route bricht den Test; keine Nachrichten-Tabelle in `packages/db/src`. Die Freundschaft exponiert nur Listen plus die sechs Profilfelder, keines davon transportiert freien Text.
result: pass

### 3. Keine vorgetäuschte Schutzkontrolle (VIS-01, FRND-09 vertagt)
expected: Nichts im Code — kein Feld, Flag, keine Fehlermeldung und kein Schemaname — suggeriert, es gäbe eine Kontrolle darüber, wer einen finden oder kontaktieren darf. v1.1 liefert Username-Auffindbarkeit und Anfragen von Fremden ohne Block, Report, Cooldown, Opt-out oder Rate-Limit (D-05, D-11, D-13).
evidence: Nicht-autoritative LLM-Einschätzung PASS — `grep 'searchable'` über contracts/db/api-Quellen = 0 Treffer; `visitorSearchQuerySchema` trägt exakt `{q}`; keine Cooldown-/Block-/Report-Felder, -Flags oder -Fehlermeldungen.
why_human: Siehe Test 1. Zusätzlich ist das die Aussage mit der grössten Produktkonsequenz — sie beschreibt, was Nutzerinnen in v1.1 NICHT an Schutz haben.
human_evidence: `visitorSearchQuerySchema` trägt exakt `{q}`; Grep über contracts/api/db findet 0 Treffer für `searchable`/`discoverable`/`optOut`/`hidden`/`block`/`report`/`mute`/`cooldown`/`rateLimit`/`throttle` als Feld, Flag oder Fehlermeldung — nur Kommentare, die die Abwesenheit dokumentieren. Einziges Gegenbeispiel dem Nutzer vorgelegt und von ihm abgenommen: `visitor_profile.socialsVisibility` (Enum everyone|friends, Default friends, `visitor-profile.ts:66`) ist ein Feld- und Schemaname mit Sichtbarkeits-Vokabular, aber Reserved Field (D-03) — kein Endpunkt liest oder schreibt ihn, er steht in keiner der beiden Projektionen und betrifft Social-Links, nicht Auffindbarkeit/Kontaktierbarkeit.
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
