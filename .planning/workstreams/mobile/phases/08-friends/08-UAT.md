---
status: complete
phase: 08-friends
source: [08-VERIFICATION.md, quick/260813-o08-friends-tab-ux-refinements-phase-8-follo/260813-o08-SUMMARY.md]
started: 2026-08-13T14:30:00Z
updated: "2026-08-13T18:05:00Z"
---

## Preconditions

- **Native rebuild required before test 1.** `expo-camera` is a new native module and is NOT in
  the currently installed APK. Stop Metro, then: `cd apps/mobile && npx expo run:android`
  (from `apps/mobile`, never the repo root).

- Two real accounts. OTP sign-in codes are readable in Mailpit at `http://localhost:8025`.
- The API must be running on port 8081 against the local Docker Postgres.

## Runde 2 — Quick-Task 260813-o08 (Friends-Tab UX-Refinements)

Tests 1–8 wurden am 2026-08-13 vollständig bestanden und bleiben unangetastet. Tests 9–14
decken die nach der UAT gelandeten Änderungen aus `quick/260813-o08` ab (Commits `0aa5563`,
`c3384ff`, `c0ca870`).

- **Kein nativer Rebuild nötig** — der Quick-Task hat nur JS/TS geändert (keine neuen nativen
  Module). Ein Metro-Reload (`r` im Metro-Fenster) reicht.
- Für Test 14 wieder zwei echte Accounts + Mailpit (`http://localhost:8025`) und die API auf 8081.

## Current Test

[testing complete]

## Tests

### 1. Scan a friend's QR code (FRND-04 scan half — REQUIRES NATIVE REBUILD FIRST)

expected: Permission dialog only on switching to Scan; one decode → one lookup → one confirmation card; Add reaches B; foreign QR rejected with copy and no navigation; preview off on "Mein Code"; denied-permission callout complete with Settings + "Enter handle instead" (search focused); manifest lists Camera, not Microphone. Only when this passes may FRND-04 be checked in REQUIREMENTS.md.
result: pass

### 2. Requests lifecycle with two accounts (FRND-05)

expected: Both sub-groups render at once (one populated, one showing its precondition copy); the badge shows the incoming count and disappears at 0; Accept/Decline/Withdraw each remove the row without a manual refresh and without a confirm dialog; in the concurrent-answer race (B withdraws while A accepts) the inline failure copy shows and the list reloads with no ghost row.
result: pass

### 3. Crew list, friend detail and unfriend (FRND-06 / FRND-08)

expected: Umlaut-correct ordering ("Ärzte" before "Berta"); tapping a row opens the modal with the ringed 88px avatar, the identity line omitted when empty, and a locale-formatted "Friends since" date; unfriend confirms, then BOTH sides lose the row without refresh; the person is immediately re-findable via search showing "Hinzufügen" (no cooldown).
result: pass

### 4. Full relation mapping on device (deferred from the 08-01 tracer checkpoint)

expected: With accounts in all five states each search-hit row shows the right trailing element — Add / Annehmen / static "Angefragt" / static "Freunde" chip **in German** / nothing at all for yourself. Chips ignore taps. The pending pill visibly dims. A failed Add/Accept shows the inline error, with the 404 case reading "Diese Person gibt's nicht mehr." (This covers the WR-01 and WR-02 fixes, which no device has seen yet.)
result: pass

### 5. D-03 mode swap and search states

expected: Any character in the field unmounts the quiks-code card, Requests and Crew, leaving only the results area; clearing the field restores all three; a single character shows the hint without firing a request; the five result states (empty / loading / error+retry / populated / long-text) all render in the one slot.
result: pass

### 6. Backstop: confirmation card across all five Relation values

expected: Scanning codes of accounts in each of the five relation states yields the correct action set each time — the same D-04 mapping as the search row, and nothing at all for your own code. Never an always-"Add" card.
result: pass

### 7. Backstop: denied callout at the longest catalog value, DE and EN

expected: With the device language set to German and then English, the denied-permission callout shows its heading, rationale and both stacked actions in full, without clipping — content-sized inside the scroll container.
result: pass

### 8. Judgment-tier prohibition sign-off

expected: While running tests 1–5, confirm all three hold — no request is ever sent without an explicit tap on that specific person; open requests carry no urgency framing (bare count, no timestamps, no alarm colour); the crew list has no ordering other than alphabetical (no proximity or engagement signal).
result: pass

### 9. Inline-Suchtreffer statt Block-Swap, gedeckelt bei 10 (D1)

expected: Trefferblock rendert direkt unter dem Suchfeld; quiks-Code-Karte, "Deine Crew" und "Anfragen" bleiben gleichzeitig sichtbar/scrollbar darunter (D-03-Blockverdrängung rückgängig); maximal 10 Trefferzeilen, auch wenn der Server bis zu 20 liefert.
result: pass

### 10. Clear-(X)-Button im Suchfeld (D2)

expected: Das X-Icon erscheint nur, sobald Text im Feld steht; ein Tap leert das Feld, gibt ihm den Fokus zurück (Tastatur bleibt offen) und der Trefferblock verschwindet.
result: pass

### 11. Anfragen hinter "Deine Crew" (D3)

expected: In der Scroll-Reihenfolge steht "Anfragen" UNTER "Deine Crew", nicht darüber.
result: pass

### 12. Kompakte Request-Rows + kleinere Sub-Headings (D4)

expected: Anfragen-Zeilen sind sichtbar kompakter als Crew-Zeilen (kleinerer Avatar, weniger Padding); Aktionen liegen nebeneinander als 36pt-Pill "Annehmen" + 36pt Icon-Button (Ablehnen/Zurückziehen ohne Textlabel); beide sind trotz Größe zuverlässig einzeln treffbar (kein Fehlgriff auf den Nachbarn); "An dich"/"Von dir" rendern deutlich kleiner als "Anfragen"/"Deine Crew".
result: pass

### 13. QR-Button-Beschriftung (D5)

expected: Der Button auf der quiks-Code-Karte liest "QR zeigen/scannen" (DE) bzw. "Show or scan QR" (EN).
result: pass
source: automated
coverage_id: D5

### 14. Scan → Auto-Return, nur bei Erfolg (D6)

expected: Nach erfolgreichem Add/Annehmen über die Scan-Bestätigungskarte springt die App automatisch zurück auf den Friends-Tab. Gegenprobe im Flugmodus: derselbe Tap bleibt auf dem Scan-Screen stehen und zeigt die Fehlerzeile (kein Rücksprung). Nach Schließen des QR-Screens läuft die Kamera nicht weiter.
result: pass

## Summary

total: 14
passed: 14
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
