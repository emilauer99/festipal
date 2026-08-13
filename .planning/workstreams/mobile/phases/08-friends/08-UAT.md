---
status: testing
phase: 08-friends
source: [08-VERIFICATION.md]
started: 2026-08-13T14:30:00Z
updated: 2026-08-13T14:30:00Z
---

## Preconditions

- **Native rebuild required before test 1.** `expo-camera` is a new native module and is NOT in
  the currently installed APK. Stop Metro, then: `cd apps/mobile && npx expo run:android`
  (from `apps/mobile`, never the repo root).
- Two real accounts. OTP sign-in codes are readable in Mailpit at `http://localhost:8025`.
- The API must be running on port 8081 against the local Docker Postgres.

## Current Test

number: 1
name: Scan a friend's QR code (FRND-04 scan half)
expected: |
  After the native rebuild: switching to "Scannen" triggers the OS permission dialog (no separate
  rationale screen first). Scanning B's code produces exactly ONE confirmation card — not a
  repeated fire for one physical code. Tapping Add sends the request and B receives it. A foreign
  (non-quiks) QR shows "That's not a quiks code." and opens no browser and no navigation. The
  camera preview is off while the "Mein Code" panel is showing. With the permission hard-denied,
  the callout renders complete with a Settings jump and an "Enter handle instead" action that
  lands on the search field with focus. The app's permission list shows Camera but NOT Microphone.
awaiting: user response

## Tests

### 1. Scan a friend's QR code (FRND-04 scan half — REQUIRES NATIVE REBUILD FIRST)
expected: Permission dialog only on switching to Scan; one decode → one lookup → one confirmation card; Add reaches B; foreign QR rejected with copy and no navigation; preview off on "Mein Code"; denied-permission callout complete with Settings + "Enter handle instead" (search focused); manifest lists Camera, not Microphone. Only when this passes may FRND-04 be checked in REQUIREMENTS.md.
result: [pending]

### 2. Requests lifecycle with two accounts (FRND-05)
expected: Both sub-groups render at once (one populated, one showing its precondition copy); the badge shows the incoming count and disappears at 0; Accept/Decline/Withdraw each remove the row without a manual refresh and without a confirm dialog; in the concurrent-answer race (B withdraws while A accepts) the inline failure copy shows and the list reloads with no ghost row.
result: [pending]

### 3. Crew list, friend detail and unfriend (FRND-06 / FRND-08)
expected: Umlaut-correct ordering ("Ärzte" before "Berta"); tapping a row opens the modal with the ringed 88px avatar, the identity line omitted when empty, and a locale-formatted "Friends since" date; unfriend confirms, then BOTH sides lose the row without refresh; the person is immediately re-findable via search showing "Hinzufügen" (no cooldown).
result: [pending]

### 4. Full relation mapping on device (deferred from the 08-01 tracer checkpoint)
expected: With accounts in all five states each search-hit row shows the right trailing element — Add / Annehmen / static "Angefragt" / static "Freunde" chip **in German** / nothing at all for yourself. Chips ignore taps. The pending pill visibly dims. A failed Add/Accept shows the inline error, with the 404 case reading "Diese Person gibt's nicht mehr." (This covers the WR-01 and WR-02 fixes, which no device has seen yet.)
result: [pending]

### 5. D-03 mode swap and search states
expected: Any character in the field unmounts the quiks-code card, Requests and Crew, leaving only the results area; clearing the field restores all three; a single character shows the hint without firing a request; the five result states (empty / loading / error+retry / populated / long-text) all render in the one slot.
result: [pending]

### 6. Backstop: confirmation card across all five Relation values
expected: Scanning codes of accounts in each of the five relation states yields the correct action set each time — the same D-04 mapping as the search row, and nothing at all for your own code. Never an always-"Add" card.
result: [pending]

### 7. Backstop: denied callout at the longest catalog value, DE and EN
expected: With the device language set to German and then English, the denied-permission callout shows its heading, rationale and both stacked actions in full, without clipping — content-sized inside the scroll container.
result: [pending]

### 8. Judgment-tier prohibition sign-off
expected: While running tests 1–5, confirm all three hold — no request is ever sent without an explicit tap on that specific person; open requests carry no urgency framing (bare count, no timestamps, no alarm colour); the crew list has no ordering other than alphabetical (no proximity or engagement signal).
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
