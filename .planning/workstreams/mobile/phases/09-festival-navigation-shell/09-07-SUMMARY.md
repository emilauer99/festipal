---
phase: 09-festival-navigation-shell
plan: 07
subsystem: ui
tags: [expo-router, react-navigation, lingui, i18n, navigation, tab-bar]

# Dependency graph
requires:
  - phase: 09-festival-navigation-shell (09-01..09-06)
    provides: the five-tab festival navigator, app-wide AppHeader, festival Friends tab, Cashless push screen
provides:
  - navigator-level headerShown:false default on every Stack in apps/mobile/app (root, (auth), (profile-setup), matching the pre-existing (tabs)/(festival)/(festival)/f/[festivalSlug] convention)
  - friend-detail.tsx explicit headerShown:true override (the one exception, keeps its close button)
  - festival tab bar renamed to Live · quiks · Crew · Timetable · Karte with the AudioLines glyph at position 1
  - lib/__tests__/support/source-text.ts shared comment-stripping test helper
  - lib/__tests__/native-header-default.test.ts and festival-tab-naming.test.ts wiring guards
  - ADR-014 dated change note re-permitting "Crew" as a UI label
affects: [10-activities-backend, 11-activities]

# Actuals (#2632)
actuals:
  tokens: 9235
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Navigator-level headerShown:false default (screenOptions on the <Stack>/<Tabs> element) instead of per-Stack.Screen options — a new sibling registration inherits the default instead of needing to remember it."
    - "Comment-free source-text guard tests (stripComments) — a wiring guard that pattern-matches source code must strip comments first, or it finds its own explanation instead of the real code."
    - ".po catalog wiring guards via a minimal hand-rolled parser (msgid -> msgstr), skipping obsolete (#~) and msgctxt-scoped entries — catches a shared-msgid collision (e.g. Friends vs. the 'relation chip' Friends) that a raw grep would miss."

key-files:
  created:
    - apps/mobile/lib/__tests__/support/source-text.ts
    - apps/mobile/lib/__tests__/native-header-default.test.ts
    - apps/mobile/lib/__tests__/festival-tab-naming.test.ts
  modified:
    - apps/mobile/app/_layout.tsx
    - apps/mobile/app/(auth)/_layout.tsx
    - apps/mobile/app/(profile-setup)/_layout.tsx
    - apps/mobile/app/friend-detail.tsx
    - apps/mobile/components/FloatingNav.tsx
    - apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po
    - .planning/workstreams/mobile/REQUIREMENTS.md
    - docs/DEVELOPMENT_DECISIONS.md

key-decisions:
  - "Header default moved to the NAVIGATOR (screenOptions), not repeated per Stack.Screen — the same class of bug (a registration forgetting headerShown:false) had already recurred three times across this phase (09-03, 09-04, and now the root/auth/profile-setup registrations); a default at the navigator cannot be forgotten by a future sibling route."
  - "friend-detail.tsx is the one deliberate exception to the new default: it re-enables headerShown:true in its own Stack.Screen options because its close button lives in the native header."
  - "'quiks' as the second festival tab label is a plain string literal, never a Lingui t-macro — it is the brand noun (Brand & Design rule), identical in both languages, lowercase, no trailing dot, no coloured character."
  - "'Crew' is a NEW msgid at the FloatingNav.tsx festival-variant call site, never a msgstr edit on the shared 'Friends' entry — that entry has three other call sites (profil.tsx, AppHeader.tsx, the global tab) that must keep reading 'Friends'."
  - "ADR-014's 'Crew is not a UI label' rule is amended, not deleted: the dated 2026-08-14 change note at the end of ADR-014 states explicitly that only the label rule is lifted — the underlying data class (friends ∩ saved festival, no presence/location) is unchanged."

patterns-established:
  - "Gap-closure plans append a dated 'Änderung (...)' note to the end of the affected ADR (same form as the existing ADR-023 amendment) rather than rewriting the original decision text — history stays readable."

requirements-completed: [NAV-01, NAV-02]

coverage:
  - id: D1
    description: "Every Navigator layout under apps/mobile/app hides the native header by default (screenOptions headerShown:false), closing the ~80dp resting-gap defect (G-09-2); friend-detail.tsx is the sole exception and keeps its close button."
    requirement: "NAV-01"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/native-header-default.test.ts (13 assertions, TDD RED confirmed first: 5 failing before the fix)"
        status: pass
      - kind: manual_procedural
        ref: "09-07-PLAN.md Task 1 <human-check> (resting gap in light+dark, no route name behind the glass on welcome/email/verify, friend-detail close button, notch + max font scale) — not yet run on device"
        status: unknown
    human_judgment: true
    rationale: "The layout math itself (resting gap, glass masking) is only observable on a real device — this codebase has no RN component test harness (STATE.md); the automated test is a wiring guard proving headerShown:false is set everywhere, not a measurement of the rendered gap. Logged as an open unrun-verify entry in WINDOWS.md."
  - id: D2
    description: "Festival tab bar renamed Dashboard/Aktivitäten/Friends/Timetable/Lageplan -> Live/quiks/Crew/Timetable/Karte with the AudioLines glyph at position 1, matching the user's own screen designs; the shared Friends msgid, the Dashboard Crew-tile eyebrow ('Friends here'), and the navLiveDot are explicitly unaffected."
    requirement: "NAV-01"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/festival-tab-naming.test.ts (20 assertions, TDD RED confirmed first: 13 failing before the fix)"
        status: pass
      - kind: manual_procedural
        ref: "09-07-PLAN.md Task 2 <human-check> (five labels DE+EN, glyph swap, untouched global Friends/eyebrow, narrow-width truncation, no state dot on Live) — not yet run on device"
        status: unknown
    human_judgment: true
    rationale: "Label rendering, glyph swap and truncation at narrow widths/max font scale are visual and can only be confirmed on device. The automated test proves the catalog values and FloatingNav wiring are correct, not how they render. Logged as an open unrun-verify entry in WINDOWS.md."
  - id: D3
    description: "ADR-014 carries a dated 2026-08-14 change note re-permitting 'Crew' as a UI label while keeping the underlying data class/friend-graph rule explicitly unchanged; NAV-01/NAV-02 in REQUIREMENTS.md enumerate the new five-tab names."
    requirement: "NAV-02"
    verification:
      - kind: manual_procedural
        ref: "09-07-PLAN.md Task 3 <human-check> (does the note say what's lifted vs. what stays in force?)"
        status: unknown
    human_judgment: true
    rationale: "Documentation-quality judgment call — whether a future reader could mistakenly conclude the data rule changed too. No automated check applies to prose intent."

duration: 25min
completed: 2026-08-14
status: complete
---

# Phase 09 Plan 07: Header-Default Gap Closure & Festival Tab Rename Summary

**Moved the native-header-hidden default from four individually-forgotten Stack.Screen options to the navigator itself, and renamed the festival tab bar to Live · quiks · Crew · Timetable · Karte to match the user's own screen designs.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3
- **Files modified:** 10 (+ 3 new test files, + 2 gitignored compiled `messages.js` catalogs)

## Accomplishments

- **G-09-2 closed:** `app/_layout.tsx`, `(auth)/_layout.tsx` and `(profile-setup)/_layout.tsx` now set `screenOptions={{ headerShown: false }}` on their navigator, matching the convention `(tabs)/_layout.tsx` and `(festival)/_layout.tsx` already used. This removes the default-visible native header that React Navigation's native-stack rendered for those group registrations — the device-measured ~80dp band the AppHeader glass was hiding instead of making visible (`.planning/debug/header-content-whitespace.md`). `friend-detail.tsx` explicitly re-enables its own header (`headerShown: true`, first property, before `presentation`) because its close button lives there.
- **G-09-7 closed:** `FloatingNav.tsx`'s festival variant now reads Live · quiks · Crew · Timetable · Karte with `AudioLines` at position 1 (replacing the data-less `LayoutDashboard`), per the user's own screen designs (`docs/concept/designs/quiks-v2/quiks-screens.template.html:2035`) and the UAT decisions of 2026-08-14. `Crew` is a brand-new msgid — the shared `Friends` msgid (profil.tsx, AppHeader.tsx, the global tab) is untouched. `quiks` is a plain string literal, never through Lingui.
- Two new wiring-guard test files (`native-header-default.test.ts`, `festival-tab-naming.test.ts`) and a shared `support/source-text.ts` helper (`readMobileFile`/`stripComments`) — both guards were run RED before the fix and GREEN after (TDD).
- German placeholder copy on the map and activities tabs follows the rename (Lageplan → Karte, Aktivitäten → quiks); the English source strings are deliberately unchanged (Flagged Assumption 2).
- ADR-014 carries a dated 2026-08-14 change note re-permitting "Crew" as a UI label while stating explicitly that the underlying data class and friend-graph rule are unchanged; NAV-01/NAV-02 in REQUIREMENTS.md now enumerate the new five names.

## Task Commits

Each task was committed atomically:

1. **Task 1: Native header default at the navigators (G-09-2)** - `6c5d9a7` (fix)
2. **Task 2: Five tab names, one glyph, two catalogs (G-09-7)** - `a114834` (feat)
3. **Task 3: ADR-014 change note + REQUIREMENTS.md** - `c7d45de` (docs)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified

- `apps/mobile/lib/__tests__/support/source-text.ts` - shared `readMobileFile`/`stripComments` test helpers
- `apps/mobile/lib/__tests__/native-header-default.test.ts` - G-09-2 wiring guard (13 assertions)
- `apps/mobile/lib/__tests__/festival-tab-naming.test.ts` - G-09-7 wiring guard (20 assertions, own `.po` parser)
- `apps/mobile/app/_layout.tsx` - root `Stack` gets `screenOptions={{ headerShown: false }}`; the four former per-screen options (profil/friends-qr/friends-find/cashless) removed, comments consolidated
- `apps/mobile/app/(auth)/_layout.tsx` - `screenOptions={{ headerShown: false }}` added
- `apps/mobile/app/(profile-setup)/_layout.tsx` - `screenOptions={{ headerShown: false }}` added
- `apps/mobile/app/friend-detail.tsx` - explicit `headerShown: true` added to its own `Stack.Screen options`
- `apps/mobile/components/FloatingNav.tsx` - festival tab icon/label tables renamed; `AudioLines` import replaces `LayoutDashboard`
- `apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx` - comment updated to the new label order (routes/order unchanged)
- `apps/mobile/locales/de/messages.po`, `apps/mobile/locales/en/messages.po` - new `Live`/`Crew` msgids, DE `Map`/placeholder copy updated, `Dashboard`/`Activities` now obsolete (`#~`)
- `.planning/workstreams/mobile/REQUIREMENTS.md` - NAV-01/NAV-02 wording updated to the new tab names
- `docs/DEVELOPMENT_DECISIONS.md` - dated ADR-014 change note

## Decisions Made

See `key-decisions` in frontmatter. Summary: the header default moved to the navigator level (not repeated per-screen) because the same forgotten-option bug had already recurred three times in this phase; `Crew` is a new msgid rather than a rewrite of the shared `Friends` entry; `quiks` stays a plain literal per the brand rule; ADR-014 is amended with a dated note rather than rewritten.

## Deviations from Plan

None - plan executed exactly as written. Both TDD tasks confirmed RED before the fix (Task 1: 5 failing assertions on `(auth)`/`(profile-setup)`/root layouts and `friend-detail`; Task 2: 13 failing assertions on the new msgids, catalog copy and `FloatingNav.tsx` wiring) and GREEN after.

## Issues Encountered

- The repo has no `@types/node` (deliberate — see `lib/__tests__/node-builtins.d.ts`), which only declares a narrow ambient `node:fs`/`node:path`/`node:url` surface for test files. The initial guard-test drafts used `statSync` and a plain `readdirSync(path)` string-array overload, neither of which is declared; both were fixed to use the `readdirSync(dir, { withFileTypes: true })` + `Dirent` pattern `type-tracking.test.ts` already establishes. Caught by `pnpm typecheck`, fixed before commit — not a deviation from the plan, just iteration to green.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both phase-09 UAT gaps (G-09-2, G-09-7) are code-complete and covered by wiring guards; the `<human-check>` device verification for both tasks (and for Task 3's documentation read-through) has not yet run on a physical device — logged as three open `unrun-verify` entries in `.planning/WINDOWS.md` for the end-of-phase device pass (`human_verify_mode: end-of-phase` per config.json).
- Phase 09 (Festival Navigation Shell) is now feature-complete pending that device UAT; Phase 10 (Activities Backend) context was already gathered in a prior session (`.planning/workstreams/mobile/phases/10-activities-backend/10-CONTEXT.md`).

---
*Phase: 09-festival-navigation-shell*
*Completed: 2026-08-14*

## Self-Check: PASSED

All 14 files (created + modified) confirmed present on disk; all 3 task commit hashes
(`6c5d9a7`, `a114834`, `c7d45de`) confirmed present in `git log`.
