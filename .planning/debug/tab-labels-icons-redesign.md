---
status: diagnosed
trigger: "UAT G-09-7: pass, aber ich will die tab labels umbenennen, so: Live, Quiks, Crew, Timetable, Karte. Siehe screen designs für die richtigen icons"
created: 2026-08-14T14:30:00Z
updated: 2026-08-14T14:50:00Z
---

## Current Focus

hypothesis: CONFIRMED — all five festival tab labels+icons live in exactly one component (apps/mobile/components/FloatingNav.tsx, festival variant) + the Lingui catalogs in apps/mobile/locales/. The design source exists in-repo (docs/concept/designs/quiks-v2/quiks-screens.template.html:2035, navF array) and specifies the icons per position.
test: complete — full change map produced (see Resolution)
expecting: n/a
next_action: Return ROOT CAUSE FOUND to orchestrator (goal: find_root_cause_only — no fix applied).

## Symptoms

expected: The five festival tabs are labeled (DE): Live, Quiks, Crew, Timetable, Karte — each with the icon shown in the screen designs.
actual: Current tab bar uses the Phase-09 labels/icons; user wants them replaced (UAT Test 7 itself passed — labels fit, ellipsize works).
errors: None — design-fidelity change request, not a malfunction.
reproduction: Test 7 in .planning/workstreams/mobile/phases/09-festival-navigation-shell/09-UAT.md — tab bar visible in any festival context.
started: Reported during Phase 09 UAT on 2026-08-14; user decision referencing their screen designs.

## Eliminated

## Evidence

- timestamp: 2026-08-14T14:35:00Z
  checked: apps/mobile/components/FloatingNav.tsx + apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx
  found: |
    Festival tab bar = FloatingNav variant 'festival'. Icons in FESTIVAL_TAB_ICON (FloatingNav.tsx:75-81),
    icon set = lucide-react-native: index→LayoutDashboard, activities→Sparkles, friends→Users,
    timetable→CalendarClock, map→MapPin. Labels via Lingui t-macro record festivalTabLabel
    (FloatingNav.tsx:157-163): index→t`Dashboard`, activities→t`Activities`, friends→t`Friends`,
    timetable→t`Timetable`, map→t`Map`. accessibilityLabel === label (line 211). Tab order fixed by
    declaration order in _layout.tsx:164-168 (index, activities, friends, timetable, map).
    Comment at FloatingNav.tsx:66-74 says Dashboard deliberately diverged from "the design's
    audio-lines/Home glyphs" — confirms the screen design's dashboard icon is audio-lines.
  implication: All five labels + icons live in exactly one component; change is localized to FloatingNav.tsx + Lingui catalogs. Positional mapping to Live/Quiks/Crew/Timetable/Karte is 1:1 with declared tab order.

- timestamp: 2026-08-14T14:30:00Z
  checked: .planning/debug/knowledge-base.md (Phase 0)
  found: File does not exist (only three active sessions + resolved/ in .planning/debug). No MemPalace query possible for prior tab-label patterns.
  implication: No known-pattern candidate; proceed with fresh investigation.

- timestamp: 2026-08-14T14:30:00Z
  checked: 09-UAT.md gap G-09-7 + STATE.md phase 09 notes
  found: G-09-7 severity minor, test 7. STATE.md confirms FloatingNav is parametrized (variant 'global' | 'festival', D-01) and the festival navigator is a dedicated Tabs under app/(festival)/f/[festivalSlug]/_layout.tsx.
  implication: Labels/icons most likely defined in that layout file or in FloatingNav itself.

- timestamp: 2026-08-14T14:40:00Z
  checked: apps/mobile/locales/{de,en}/messages.po — current five festival tab labels
  found: |
    msgid Dashboard → DE "Dashboard" (de:235-236), EN "Dashboard" (en:235-236)
    msgid Activities → DE "Aktivitäten" (de:56-57), EN "Activities" (en:56-57)
    msgid Friends → DE "Friends" (de:343-344), EN "Friends" (en:343-344) — msgid SHARED by three
      call sites: app/profil.tsx, components/AppHeader.tsx, components/FloatingNav.tsx (de:340-342),
      and inside FloatingNav by BOTH variants (global tab + festival tab).
    msgid Timetable → DE "Timetable" (de:865-866), EN "Timetable" (en:865-866)
    msgid Map → DE "Lageplan" (de:459-460), EN "Map" (en:459-460) — referenced ONLY by FloatingNav.
  implication: Friends→Crew MUST be a NEW msgid at the festival call site (t`Crew`), never a msgstr edit on the shared "Friends" entry — otherwise global tab, AppHeader push title and profil.tsx rename too. Karte is just a DE msgstr change on msgid "Map".

- timestamp: 2026-08-14T14:42:00Z
  checked: docs/concept/designs/quiks-v2/ (README.md + quiks-screens.template.html) — the screen designs
  found: |
    Design files EXIST in-repo. README.md declares quiks-screens.template.html the "maßgebliche
    Textquelle" (readable extraction of the 763KB claude-design bundle docs/quiks_screen_designs.html).
    In-festival screens: 05 Live, 06 Aktivitäten, 06b Crew, 07 Timetable, 08 Karte.
    The in-festival tab bar is defined verbatim at quiks-screens.template.html:2035:
    navF = [ {value:'live', icon:'audio-lines', label:'Live'}, {value:'aktivitaeten', icon:'sparkles',
    label:'Aktivitäten'}, {value:'crew', icon:'users', label:'Crew'}, {value:'timetable',
    icon:'calendar-clock', label:'Timetable'}, {value:'karte', icon:'map-pin', label:'Karte'} ].
    Also present: navLiveDot (lines 1938/2055) — a red dot on the Live tab when elsewhere in the
    festival. NOT part of the user's request.
  implication: Only ONE icon differs from current code: position 1 (Dashboard→Live) needs audio-lines (lucide AudioLines) instead of LayoutDashboard. Sparkles/Users/CalendarClock/MapPin already match the design exactly. Design position 2 is labeled "Aktivitäten" — the user's "Quiks" label has no own design icon; by position it keeps sparkles.

- timestamp: 2026-08-14T14:44:00Z
  checked: AudioLines availability + lint rule + brand-noun precedent
  found: |
    AudioLines is ALREADY imported from lucide-react-native (^1.28.0) in app/profil.tsx:8 (Spotify row,
    :414/:444) — available, no new package/glyph risk.
    eslint (apps/mobile/eslint.config.mjs:31-64): i18next/no-literal-string mode 'jsx-text-only',
    words.exclude contains lowercase 'quiks' (line 60, "brand/proper noun, never translated D-04").
    Two in-repo precedents for standalone brand nouns: (a) literal, NOT Lingui-wrapped — Instagram/
    TikTok rows, profil.tsx:396-411 ("same treatment the quiks wordmark gets"); (b) routed through t
    with identical msgstrs "for catalog ownership" — Cashless tile (09-UI-SPEC.md:156).
  implication: "Quiks" as tab label is untranslated either way; whether it is a literal or a t-macro msgid with identical msgstrs is a planner decision with precedent on both sides. Casing is a REAL ambiguity: brand convention is strictly lowercase "quiks"; the user wrote "Quiks".

- timestamp: 2026-08-14T14:46:00Z
  checked: Blast radius — tests, a11y, docs, prior decisions
  found: |
    TESTS: zero matches for tab label strings or FESTIVAL_TAB_ICON/LayoutDashboard/CalendarClock/
    Sparkles in any __tests__/test dir (apps/mobile suite is node-env lib/-only; no RN component
    harness — STATE.md). No snapshot risk. Verification of this change is on-device UAT only.
    A11Y: accessibilityLabel === label (FloatingNav.tsx:211) — renames propagate automatically.
    PLACEHOLDER COPY (DE): activities heading "Aktivitäten kommen noch" (de:61), map heading
    "Noch kein Lageplan" (de:528) + body (de:846) still say Aktivitäten/Lageplan after the rename.
    DOCS: REQUIREMENTS.md:48 (NAV-01 enumerates "Dashboard · Aktivitäten · Friends · Timetable ·
    Lageplan"); _layout.tsx:155-156 comment enumerates the same; FloatingNav.tsx:66-74 comment
    justifies the now-obsolete LayoutDashboard divergence; 09-UI-SPEC.md:263-296 documents the
    deliberate divergence ("drops the design's Crew/Live labels", :26; audio-lines replacement
    rationale :288-291) — historical artifact, no retro-edit needed.
    ADR CONFLICT: ADR-014 (docs/DEVELOPMENT_DECISIONS.md:259) — "als UI-Label entfällt 'Crew'
    (heißt 'Friends')", reaffirmed :288. The user's request reverses this. Related surface:
    Dashboard Crew-tile eyebrow is deliberately "Freunde hier"/"Friends here", "never 'Crew' as a
    UI string" (09-UI-SPEC.md:157).
    LINGUI WORKFLOW: apps/mobile scripts "extract" (lingui extract) + "compile" (lingui compile
    --strict); compiled messages.js sits next to each .po. packages/i18n holds only locale
    resolution, NO catalogs — the change is app-local.
  implication: Change is fully localized to FloatingNav.tsx + apps/mobile catalogs + doc touch-ups; no route renames needed (labels are display-only; route names index/activities/friends/timetable/map and deep links untouched). ADR-014 needs an amendment note recording the user's 2026-08-14 UAT decision.

## Resolution

root_cause: |
  Not a malfunction — a design-fidelity gap created deliberately in Phase 09: 09-UI-SPEC.md
  (":26 drops the design's Crew/Live labels", ":288-291 replaces audio-lines with LayoutDashboard")
  chose "Dashboard/Aktivitäten/Friends/Timetable/Lageplan" over the design's
  "Live/Aktivitäten/Crew/Timetable/Karte" (quiks-screens.template.html:2035), partly per ADR-014's
  "no Crew as UI label" rule. The user's UAT decision reverses that divergence (with one further
  rename: Aktivitäten→Quiks). Everything to change lives in exactly one component —
  apps/mobile/components/FloatingNav.tsx (FESTIVAL_TAB_ICON :75-81, festivalTabLabel :157-163) —
  plus the Lingui catalogs apps/mobile/locales/{de,en}/messages.po.
fix: |
  (diagnose-only — change map for the gap-closure plan)
  1. FloatingNav.tsx: FESTIVAL_TAB_ICON.index LayoutDashboard→AudioLines (already imported elsewhere,
     lucide-react-native ^1.28.0); festivalTabLabel: t`Dashboard`→t`Live`, t`Activities`→"Quiks"
     (treatment+casing = flagged decision), t`Friends`→t`Crew` (NEW msgid — shared "Friends" msgid
     must stay untouched), t`Map` stays. Update stale comments :66-74.
  2. Catalogs: pnpm extract + compile; DE msgstrs Live/Crew verbatim, msgid "Map" DE msgstr
     "Lageplan"→"Karte"; obsolete msgids Dashboard/Activities drop out.
  3. Docs: REQUIREMENTS.md:48 NAV-01 wording; ADR-014 amendment note (Crew now a UI label per user
     decision 2026-08-14); _layout.tsx:155 comment.
  4. Flagged, not guessed: Quiks casing/Lingui treatment; Crew-tile eyebrow "Freunde hier";
     DE placeholder copy (Aktivitäten/Lageplan); design's navLiveDot (out of scope).
verification: n/a (find_root_cause_only)
files_changed: []
