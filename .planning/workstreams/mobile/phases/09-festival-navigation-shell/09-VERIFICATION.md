---
phase: 09-festival-navigation-shell
verified: 2026-08-14T20:45:00Z
status: passed
score: 12/14 must-haves verified
behavior_unverified: 2 # G-09-2's rendered layout outcome — wiring guard-proven, pixel result device-only
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 12/14
  gaps_closed:

    - "G-09-2: dead ~80dp paper strip between AppHeader glass and content — native-header default moved to the navigators (root/(auth)/(profile-setup)), friend-detail sole explicit exception; guarded by native-header-default.test.ts"
    - "G-09-7: festival tab bar renamed to Live · quiks · Crew · Timetable · Karte with the AudioLines glyph; guarded by festival-tab-naming.test.ts; ADR-014 change note + NAV-01/NAV-02 updated"
    - "Prior device-UAT resolution: WINDOWS #40/#43/#44/#45/#46 device checks PASSED in 09-UAT.md (tests 1, 3-6, 8) — the two prior PRESENT_BEHAVIOR_UNVERIFIED truths (festival Friends tab client rendering, cashless sandbox runtime) are now device-verified"
  gaps_remaining: []
  regressions: []
behavior_unverified_items:

  - truth: "G-09-2 outcome: on every screen the content starts directly under the header glass — the resting gap is the designed narrow spacing, not the device-measured ~99dp strip; no route name ghosts through the glass; no white bar on welcome/email/code"
    test: "Device run per 09-07 Task 1 <human-check> (WINDOWS #47): light+dark, start tab + festival dashboard resting gap, all 9 tabs scroll under the glass, log out and inspect welcome/email/code, open friend-detail card (close button must survive), push screens, notch + max font scale"
    expected: "Narrow designed gap everywhere; no blank native bar; friend-detail still closable; no route-name text behind the glass"
    why_human: "The wiring guard (33/33, re-run by the verifier) proves headerShown:false is the navigator default in ALL 7 _layout.tsx files and friend-detail re-enables its own — but the rendered gap is pure native layout math with no node-env equivalent; the welcome-screen point is exactly where emulator and phone findings diverged before (plan demands explicit re-check)"

  - truth: "G-09-7 rendered result: the five festival tab labels render as Live · quiks · Crew · Timetable · Karte (EN: Map) with the AudioLines glyph, single-line/ellipsized at narrowest width and max font scale, and NO state dot on the Live tab"
    test: "Device run per 09-07 Task 2 <human-check> (WINDOWS #48): open a festival in DE and EN, check the five labels + glyph, verify global Friends tab / Profil push title / 'Freunde hier' eyebrow are unchanged, narrow-width truncation, no red dot"
    expected: "New names in the festival, old names everywhere else, eyebrow unchanged, no live-dot indicator"
    why_human: "Catalog values and FloatingNav wiring are fully test-pinned (verifier re-ran festival-tab-naming.test.ts, pass); the visual render, truncation behavior, and glyph appearance need eyes on a device"
human_verification:

  - test: "09-07 Task 1 device check (WINDOWS #47) — see behavior_unverified item 1"
    expected: "Resting gap narrow, no route name behind glass, no bar on auth screens, friend-detail closable, notch + max font scale clean"
    why_human: "Rendered native layout has no node-env equivalent"

  - test: "09-07 Task 2 device check (WINDOWS #48) — see behavior_unverified item 2"
    expected: "Live · quiks · Crew · Timetable · Karte (EN Map), AudioLines glyph, untouched Friends/eyebrow surfaces, truncation holds, no state dot on Live"
    why_human: "Visual rendering of the pinned labels/glyph"

  - test: "09-07 Task 3 read-through: read the ADR-014 change note once — does it state WHAT is lifted (only the label rule for this one tab) and WHAT stays in force (no presence, no location, no retention)?"
    expected: "A later reader cannot conclude the data rule fell with the label. NOTE: verifier's non-authoritative read — the note explicitly separates 'Was aufgehoben ist' from 'Was ausdruecklich in Kraft bleibt' and restates the intersection definition — reads as PASS, but the plan classifies this as human judgment. Not logged in WINDOWS.md (SUMMARY claims three unrun-verify entries, only #47/#48 exist)."
    why_human: "Documentation-quality judgment on prose intent"

  - test: "Judgment-tier prohibitions (verification: manual, NON-AUTHORITATIVE code verdict rendered): (a) NAV-02 — the rename claims no capability: no navLiveDot, no content, no counts added; (b) NAV-01/FRND-07 — 'Crew' label adds no presence signal"
    expected: "Upheld on device as in code. Code evidence strong: commit a114834's footprint is exactly FloatingNav + catalogs + a layout comment + the guard test (no content file touched); FloatingNav contains no dot/badge element; the ADR note preserves the data rule verbatim"
    why_human: "Manual-tier prohibitions get a non-authoritative code-level verdict only; final resolution belongs to the end-of-phase human checkpoint (folded into device checks #47/#48)"
---

# Phase 9: Festival Navigation Shell — Verification Report (Re-verification)

**Phase Goal:** Inside a festival there is a real five-tab bar, its two content tabs are honest placeholders, the Friends tab shows friends who saved this festival, and the global first tab is finally named `start` everywhere.
**Verified:** 2026-08-14T20:45:00Z
**Status:** human_needed
**Re-verification:** Yes — after UAT gap closure (plan 09-07, gaps G-09-2 and G-09-7). Supersedes the 2026-08-14T10:35:00Z report.

## What Changed Since the Previous Verification

1. The full device UAT ran (`09-UAT.md`): **6 of 8 passed** — including the two truths the previous report held as PRESENT_BEHAVIOR_UNVERIFIED (festival Friends tab with three real accounts, test 4; cashless sandbox after native rebuild, test 6). Both are now device-verified.
2. The 2 UAT issues became gaps G-09-2 (major, dead ~80dp strip) and G-09-7 (minor, tab rename change request) and were closed by plan 09-07 in commits `6c5d9a7`, `a114834`, `c7d45de` — all three verified present on the branch with footprints matching the claims.

## Goal Achievement

### Observable Truths — Roadmap Success Criteria (regression-checked)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| SC1 | Entering a festival lands on a five-tab bar, every tab a real registered route | ✓ VERIFIED | 5 route files + `_layout.tsx` present; 5 `Tabs.Screen` in order `index/activities/friends/timetable/map` unchanged by the rename (`_layout.tsx:168-172`, commit a114834 touched only the comment); device UAT 09-03 round 2 + UAT test 8 |
| SC2 | Timetable/Karte/quiks tabs are honest placeholders naming their real precondition | ✓ VERIFIED | **Device UAT test 1 PASSED** (was human-pending); `PlaceholderScreen` copy sources unchanged; DE catalog copy follows the rename — `No site map yet`→`Noch keine Karte`, body names Karte not Lageplan, `Activities are on the way`→`quiks kommen noch`, brand named exactly once (pinned by festival-tab-naming.test.ts, re-run pass) |
| SC3 | Festival Friends tab shows exactly the intersection, never a presence signal | ✓ VERIFIED | Server: `festival-friends-isolation.spec.ts` live-proven 8/8 (prior verification). Client: **device UAT test 4 PASSED with three real accounts** (three empty states, intersection-only, tap-through, error+retry, Crew tile parity). `friends.tsx` untouched by 09-07 (commit footprints) |
| SC4 | First global tab is `start` in route, msgid and UI; deep links resolve | ✓ VERIFIED | `(tabs)/start.tsx` present, no `home.tsx`; FloatingNav global table `start: t\`Start\`` unchanged; device-verified in 09-01 UAT (prior, unregressed) |

### Observable Truths — 09-07 Gap-Closure Must-Haves

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Content starts directly under the glass; the ~80dp strip is gone (G-09-2) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Fix present + wired (truth 2); rendered gap is device-only — WINDOWS #47 |
| 2 | No navigator shows a native header by default; the default lives at the navigator; friend-detail is the sole re-enabling exception | ✓ VERIFIED | All 7 `_layout.tsx` under `app/` carry `screenOptions={{ headerShown: false }}` (grep verified: root :491, (auth) :18, (profile-setup) :13, (festival) :15, (tabs) :36, festival Tabs :166); root registrations for profil/friends-qr/friends-find/cashless bare; `friend-detail.tsx:181` `headerShown: true` as first property before `presentation`, close button intact (:185-194); **guard test re-run by verifier: 33/33 pass**; guard walks the directory (no hand list), strips comments, non-vacuum assertions present |
| 3 | No white bar with a route name on welcome/email/code screens | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `(auth)/_layout.tsx` default set (the measured cause removed); the exact point where emulator and phone diverged before — WINDOWS #47 point 4 |
| 4 | Five festival tabs named (DE) Live · quiks · Crew · Timetable · Karte; AudioLines glyph at position 1, other four glyphs unchanged | ✓ VERIFIED | `FloatingNav.tsx:77-83` `FESTIVAL_TAB_ICON` index=`AudioLines` (import :5), Sparkles/Users/CalendarClock/MapPin unchanged; `LayoutDashboard` gone; labels :159-171; catalogs: `Live`→Live, `Crew`→Crew, `Map`→DE Karte/EN Map (test-pinned, re-run pass); compiled gitignored `messages.js` regenerated (contain `Crew`). Visual render = #48 |
| 5 | `quiks` tab label is a lowercase plain literal, NOT through Lingui, identical in both languages | ✓ VERIFIED | `FloatingNav.tsx:167` `activities: 'quiks'` — plain string, no `t` macro, no trailing dot, no coloured character; guard asserts the literal |
| 6 | Shared `Friends` msgid untouched (global tab, push title, profil) | ✓ VERIFIED | `Friends`→`Friends` in BOTH catalogs (test-pinned); global table still `friends: t\`Friends\``; `Crew` is a NEW msgid; commit a114834 touched none of profil.tsx/AppHeader.tsx/friends-find.tsx |
| 7 | Crew tile eyebrow stays "Freunde hier" / "Friends here" | ✓ VERIFIED | `index.tsx:100` `t\`Friends here\`` untouched (not in any 09-07 commit); catalog DE `Freunde hier` / EN `Friends here` test-pinned |
| 8 | No placeholder text names a label the navigation no longer carries | ✓ VERIFIED | DE map copy names Karte, contains no `Lageplan`; DE quiks copy follows the new naming, brand named once (heading only) — all pinned in festival-tab-naming.test.ts, re-run pass; EN source strings deliberately unchanged (Flagged Assumption 2) |
| 9 | The rename changes ONLY labels — no tab gets content, no tile a number, no state dot (navLiveDot NOT built) | ✓ VERIFIED | Commit a114834 footprint: FloatingNav + catalogs + one layout comment + guard test, nothing else; no dot/badge element in FloatingNav (grep clean); `Dashboard`/`Activities` msgids obsolete in both catalogs (test-pinned) |
| 10 | ADR-014 carries a dated change note; NAV-01/NAV-02 enumerate the new five names | ✓ VERIFIED | `docs/DEVELOPMENT_DECISIONS.md:301-315` dated "Änderung (2026-08-14, Phase 09 UAT / Nutzer-Entscheid)" in ADR-023 amendment form — states what is lifted (label rule only) AND what stays (no location/presence/retention, data classes untouched), names the new five-tab row, references 09-UAT.md; original rule text preserved. `REQUIREMENTS.md:48-49` NAV-01/NAV-02 name the new row, both checkmarks intact |

**Score:** 12/14 truths verified (2 present, behavior-unverified — both are the rendered device outcome of G-09-2/G-09-7, tracked as WINDOWS #47/#48)

### Required Artifacts (09-07)

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `apps/mobile/lib/__tests__/support/source-text.ts` | `readMobileFile`/`stripComments` shared helper | ✓ VERIFIED | Both named exports; `://`-in-string protection implemented and self-tested; not a `*.test.ts` name (imported, not collected) |
| `apps/mobile/lib/__tests__/native-header-default.test.ts` | G-09-2 wiring guard | ✓ VERIFIED | Directory-walked layout list (non-vacuum: fails on empty list, asserts root inclusion), comment-stripped matching, exactly-one-default assertion on root, friend-detail exception assertion; **re-run: pass** |
| `apps/mobile/lib/__tests__/festival-tab-naming.test.ts` | G-09-7 catalog + wiring guard | ✓ VERIFIED | Own `.po` parser skipping `#~`/`msgctxt` (self-tested non-vacuum); pins all five labels, both untouched surfaces, obsolete old msgids, FloatingNav wiring; **re-run: pass** |
| `apps/mobile/app/_layout.tsx` | root navigator default, bare registrations | ✓ VERIFIED | :491; four former per-screen options removed; comments consolidated at the navigator, per-registration comments reference the gap closure |
| `apps/mobile/app/(auth)/_layout.tsx` + `(profile-setup)/_layout.tsx` | navigator defaults | ✓ VERIFIED | One-line `(festival)` form, both with G-09-2 rationale comments |
| `apps/mobile/app/friend-detail.tsx` | explicit `headerShown: true` | ✓ VERIFIED | :181, first property before `presentation`; close-button block unchanged |
| `apps/mobile/components/FloatingNav.tsx` | renamed labels + glyph, one component | ✓ VERIFIED | See truths 4-6; variant parametrization unchanged (regression) |
| `docs/DEVELOPMENT_DECISIONS.md` | ADR-014 change note | ✓ VERIFIED | See truth 10 |

### Key Link Verification (09-07 + regression)

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `app/_layout.tsx` | `AppHeader` | navigator default is what lets `useHeaderClearance()` offset by glass height only | ✓ WIRED | Default at :491, `<AppHeader />` still mounted as Stack sibling :588; no change to AppHeader/useHeaderClearance/paddingTop values (commit footprint) |
| `friend-detail.tsx` | root `_layout.tsx` | in-screen `headerShown: true` overrides the navigator default | ✓ WIRED | :181 in its own `<Stack.Screen options>`; guard asserts ordering |
| `FloatingNav.tsx` | `locales/*/messages.po` | `t` macros generate Live/Crew/Timetable/Map msgids; `quiks` deliberately generates none | ✓ WIRED | Catalog entries exist and are compiled (`Crew` present in gitignored `messages.js`); `Dashboard`/`Activities` obsolete — proof the source macros really changed |
| festival `_layout.tsx` | `FloatingNav variant="festival"` | tabBar render prop | ✓ WIRED | :165 unchanged (regression) |
| `cashless.tsx` | CR-01 sole-gate | `originWhitelist={['*']}` + strict callback | ✓ WIRED | :126, unregressed |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Both 09-07 wiring guards (header default in all 7 layouts, exactly-one-default, friend-detail exception, all catalog values, FloatingNav wiring, untouched surfaces) | `pnpm exec vitest run` (2 named files, apps/mobile) — run in verifier's own process | 33/33 pass, 248 ms | ✓ PASS |
| Full mobile suite + API suite + typecheck | orchestrator run (this session) | mobile 320/320, API 140/140, typecheck clean | ✓ PASS (orchestrator) |
| TDD RED claim | SUMMARY claims 5/13 failing assertions pre-fix | not independently re-derivable post-fix | ℹ️ accepted (guards demonstrably non-vacuous by construction) |
| Device: G-09-2 rendered gap, G-09-7 rendered labels | WINDOWS #47/#48 | not run | ? SKIP → human |

### Probe Execution

No probes declared or present (`scripts/*/tests/probe-*.sh` — none in repo). SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| NAV-01 | 09-03, 09-04, 09-06, 09-07 | five-tab bar inside a festival (now Live · quiks · Crew · Timetable · Karte) | ✓ SATISFIED | SC1 + truths 4-7, 10; device UAT tests 3/6/8 passed; rename render = #48 |
| NAV-02 | 09-03, 09-07 | honest placeholders naming preconditions | ✓ SATISFIED | SC2 + truths 8-9; device UAT test 1 passed; no navLiveDot (prohibition upheld in code) |
| NAV-03 | 09-01 | first global tab is `start` everywhere | ✓ SATISFIED | SC4, device-verified, unregressed |
| FRND-07 | 09-02, 09-05 | intersection only, never presence | ✓ SATISFIED | SC3 — server live-proven 8/8 AND client device-verified (UAT test 4); Crew label adds no data (truth 9, ADR note) |

No orphaned requirements: REQUIREMENTS.md maps exactly these four IDs to Phase 9 (traceability table :95-98).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | none | — | Zero TBD/FIXME/XXX/TODO/HACK markers in all 09-07-modified files (scanned) |

**SUMMARY discrepancy (info):** 09-07-SUMMARY claims "three open unrun-verify entries in WINDOWS.md"; only two exist (#47, #48). The third item — Task 3's ADR-note read-through — was never logged. Covered here as human-verification item 3 so it is not lost; verifier's non-authoritative read of the note is PASS (it explicitly separates the lifted label rule from the intact data rule).

**Deliberately open (unchanged from prior report, not gaps):** WR-03 warm-cache transport-error behavior (conscious product decision); `navLiveDot` deferred follow-up in 09-UAT.md (correctly NOT built — building it statically would violate NAV-02); WINDOWS #40/#42-#46 remain formally "open" in WINDOWS.md although 09-UAT.md records their device checks as passed — bookkeeping lag, not a verification gap (the UAT file is the authoritative record of the pass).

### Human Verification Required

See frontmatter `human_verification` — 4 items, 2 of them device runs:

1. **WINDOWS #47** — 09-07 Task 1 device check: resting gap under the glass (light+dark), no route name behind the glass, no bar on welcome/email/code, friend-detail close button survives, notch + max font scale. No native rebuild needed (no new native module in 09-07).
2. **WINDOWS #48** — 09-07 Task 2 device check: Live · quiks · Crew · Timetable · Karte (EN: Map) + AudioLines glyph; global Friends tab / Profil push title / "Freunde hier" eyebrow unchanged; narrow-width truncation; NO state dot on Live.
3. **Task 3 read-through** of the ADR-014 change note (verifier non-authoritative: PASS) — not in WINDOWS.md.
4. **Judgment-tier prohibitions** (non-authoritative code verdict: PASS, strong evidence) — folded into #47/#48.

### Gaps Summary

Keine Gaps. Beide UAT-Befunde sind im Code nachweislich geschlossen: G-09-2 durch den Navigator-Default in allen sieben `_layout.tsx` (mit friend-detail als getesteter Einzelausnahme), G-09-7 durch den Label-/Glyph-Tausch in genau einer Komponente plus Katalog-Regeneration — beides durch neue, nicht-vakuöse Wiring-Guards festgeschrieben, die der Verifier selbst erneut ausgeführt hat (33/33). Die drei Commits existieren und ihre Datei-Footprints decken sich exakt mit den Behauptungen (insbesondere: die Umbenennung hat keine Inhaltsdatei berührt). Die Geräte-UAT dieser Phase hat zudem fünf der sechs zuvor offenen Device-Checks bestanden, darunter beide vormals PRESENT_BEHAVIOR_UNVERIFIED-Truths. Was aussteht, ist ausschliesslich die Geräte-Nachprüfung der beiden 09-07-Fixes selbst (WINDOWS #47/#48 — der gerenderte Ruheabstand und die gerenderten Labels) plus zwei Urteils-Items. Kein Regressionsbefund an den 14 zuvor verifizierten Truths.

---

_Verified: 2026-08-14T20:45:00Z_
_Verifier: Claude (gsd-verifier), re-verification after gap closure_
