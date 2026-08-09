---
status: diagnosed
trigger: "G-05-5b-r2 (UAT round 2, test 2): entering an UNSAVED festival from Alle, force-quitting, and relaunching lands on the Frequency Festival home instead of Start/Home."
created: 2026-08-09T00:00:00Z
updated: 2026-08-09T00:00:00Z
mode: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED — the G-05-5b persist gate is monotonic: entering an unsaved festival never clears a previously-persisted SAVED slug, so a stale saved slug (frequency-2026) is restored on cold-start.
test: static code trace of persist / clear / restore call sites against the exact symptom ("lands on Frequency", not on the just-entered unsaved festival)
expecting: if the persist were unconditional (task's initial hypothesis) the user would restore the UNSAVED festival they entered; instead they restore a DIFFERENT saved festival → persist is gated but never cleared on unsaved entry
next_action: hand off to gap-closure plan — clear the persisted slug on unsaved entry (reverse the explicit "never clears" decision at festivals.tsx:219-222)

## Symptoms

expected: After entering an UNSAVED festival (from the Alle segment), force-quit + relaunch must cold-start on Start/Home. It must NOT reopen a festival. Only a festival that is SAVED *and was the last one entered* should be restored.
actual: "Immer wenn ich die app quitte und dann relaunche lande ich am Frequency Festival Home Screen" — every relaunch lands on the Frequency Festival home, even after entering an unsaved festival.
errors: none
reproduction: 05-UAT.md round 2 test 2 — save frequency-2026 and enter it once (Home hero → persists slug), then enter a DIFFERENT unsaved festival from Alle, force-quit, relaunch.
started: UAT round 2 (regression of G-05-5b, "fixed" by gap-closure plan 05-09 Task 2, commit 8462a41)

## Eliminated

- hypothesis: "The persist-on-navigation path writes the restore key on EVERY festival entry regardless of saved status" (the task's stated initial hypothesis)
  evidence: festivals.tsx:223 gates the write behind `if (saved)`. Decisively: the user lands on **Frequency Festival**, a DIFFERENT festival, not the unsaved festival they just entered. An unconditional write would have persisted the unsaved slug and restored THAT festival's home. Restoring a different (saved) festival proves the unsaved entry wrote nothing.
  timestamp: 2026-08-09

- hypothesis: "The saved/favorited check is missing from the persist path"
  evidence: The check is present and correct at festivals.tsx:214-225 (`handleEnter(slug, saved)`, `if (saved) saveActiveFestivalSlug(slug)`) and home.tsx:76-91 (home cards are always saved). The gate works; it is the ABSENCE of a clear-on-unsaved-entry that is the defect.
  timestamp: 2026-08-09

## Evidence

- timestamp: 2026-08-09
  checked: all persist/read/clear call sites — `grep saveActiveFestivalSlug|getActiveFestivalSlug|clearActiveFestivalSlug`
  found: saveActiveFestivalSlug is called at festivals.tsx:223 (gated `if (saved)`) and home.tsx:85 (always-saved cards). clearActiveFestivalSlug is called ONLY at festivals.tsx:108 (logout) and (festival)/f/[festivalSlug].tsx:95-96 (persisted slug 404'd). There is NO clear on an unsaved festival entry.
  implication: The persisted `active-festival-slug` is a monotonic "last SAVED festival ever entered" value. Nothing in the unsaved-entry flow updates or clears it.

- timestamp: 2026-08-09
  checked: apps/mobile/app/(tabs)/festivals.tsx:214-225 handleEnter
  found: The code comment explicitly documents the defect as intended behavior — line 220-222: "An unsaved entry is never persisted (and never clears an already-persisted saved slug, so the last saved-and-opened festival is kept)."
  implication: The 05-09 fix DELIBERATELY chose "keep the last saved-and-opened festival" semantics. That directly contradicts the UAT truth ("after entering an UNSAVED festival, land on Start/Home"). This is a specification mismatch baked into the fix, not an accidental bug.

- timestamp: 2026-08-09
  checked: apps/mobile/app/_layout.tsx:232-253 cold-start redirect effect
  found: After auth resolves and no pending deep-link exists, it reads `getActiveFestivalSlug()` (synchronous MMKV) and, if any slug is present, `router.replace('/f/${slug}')` UNCONDITIONALLY (lines 246-249). It never re-validates that the slug still corresponds to the last-entered festival or is still in the saved set.
  implication: Any lingering persisted slug wins the cold start. Combined with the sticky persist, a saved festival entered at any earlier point (frequency-2026, the Home hero) restores forever, regardless of later unsaved-festival entries.

- timestamp: 2026-08-09
  checked: contrast with UAT test 3 (WR-01 race probe — FAILED save must not restore) which PASSED
  found: In WR-01 the row is unsaved and the save FAILS, so `savedIds` never includes it (optimistic insert rolled back at onError) → at Enter time `saved=false` → nothing persisted, and no prior SAVED-and-entered slug was present in that leg → cold-start restores nothing → Start/Home (pass). In test 2 a genuinely saved festival (frequency-2026, entered earlier from Home) had already stuck its slug into MMKV; the later unsaved entry did not clear it → restore → fail.
  implication: The pass/fail contrast is fully explained by the sticky-persist root cause: WR-01 never had a saved slug to leave behind; test 2 did.

## Resolution

root_cause: |
  The G-05-5b gap-closure fix (plan 05-09, commit 8462a41) implemented the "only restore a SAVED festival" requirement as "only PERSIST when saved" (apps/mobile/app/(tabs)/festivals.tsx:223, `if (saved) saveActiveFestivalSlug(slug)`). This makes the persisted `active-festival-slug` a monotonic, sticky "last SAVED festival ever entered" value: entering an UNSAVED festival neither writes a new slug NOR clears the existing one (the code comment at festivals.tsx:220-222 documents this as intentional). The cold-start read in apps/mobile/app/_layout.tsx:246-249 then restores whatever slug is persisted, unconditionally. So once a saved festival (frequency-2026, the Home hero) has been entered, its slug persists forever; entering an unsaved festival afterward does not change the restore target, and every relaunch reopens the Frequency Festival home instead of Start/Home. The required semantics are "the restore target reflects the LAST entered festival, restored only if that festival was saved" — which requires CLEARING the persisted slug when an unsaved festival is entered. That clear never happens on the unsaved-entry path (clearActiveFestivalSlug is wired only to logout and to a 404'd slug).
fix: (not applied — find_root_cause_only mode; deferred to gap-closure plan)
verification: (not applied)
files_changed: []
oracle_type: specified (UAT test 2 truth statement is the explicit oracle)

reasoning_checkpoint:
  hypothesis: "Entering an unsaved festival leaves a previously-persisted saved slug intact, and the unconditional cold-start restore reopens that saved festival — because the persist path is gated on saved but there is no clear-on-unsaved-entry."
  confirming_evidence:
    - "festivals.tsx:223 gates the write; festivals.tsx:220-222 comment states it never clears the old slug."
    - "clear is wired only to logout (festivals.tsx:108) and 404 (festivalSlug.tsx:95-96) — never to an unsaved entry."
    - "_layout.tsx:246-249 restores any persisted slug unconditionally, no re-validation."
    - "Symptom lands on Frequency (a DIFFERENT saved festival), not the unsaved festival entered — proves the unsaved entry wrote nothing yet a stale saved slug remained."
  falsification_test: "If the persist were unconditional, the user would restore the UNSAVED festival they just entered, not Frequency. They restore Frequency → hypothesis stands."
  fix_rationale: "Clearing the persisted slug on unsaved entry makes the restore target reflect the last actual navigation, satisfying the UAT truth (unsaved entry → Home)."
  blind_spots: "Exact device MMKV state across the test sequence is reconstructed, not directly observed; a genuine full state reset before test 2 could also produce Home, but the user reports it 'always' happens, consistent with a persistently-stuck saved slug."
  candidate_causes:
    - "code: persist gate has no matching clear-on-unsaved-entry (festivals.tsx handleEnter)"
    - "code: cold-start restore does not re-validate the persisted slug against the saved set (_layout.tsx)"
    - "data: stale MMKV slug from an earlier saved-festival entry survives across sessions (test-state)"
  and_gate: "yes — the failure needs BOTH a previously-persisted saved slug (data) AND the missing clear-on-unsaved-entry (code) to reproduce. Neither alone lands on Frequency: no prior slug → Home (test 3); a clear-on-unsaved-entry → the stale slug would be wiped. The primary FIXABLE cause is the missing clear."
