---
phase: 05-festival-selection-home
plan: 04
subsystem: ui
tags: [react-native, expo, design-system, lingui, festival-card, segmented-control]

# Dependency graph
requires:
  - phase: 05-02
    provides: radiiScale + translucent color roles (borderSubtle/fillQuiet/fillBrandQuiet) in packages/ui/src/tokens.ts
  - phase: 05-03
    provides: formatDateRange (null-safe date-range caption helper), the existing "Save" Lingui msgid in festivals/index.tsx
provides:
  - FestivalCard owned primitive (flat list + hero variants, saved-badge/Save-affordance split, sibling non-nested press targets, saving/busy state)
  - SegmentedControl owned primitive (options/value/onChange pill)
affects: [05-05, 05-06, 05-07, 05-08]

# Actuals (#2632)
actuals:
  tokens: 2700
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Non-nested sibling Pressables inside a plain-View card shell (enter layer + Save/Badge) to make press-target ambiguity structurally impossible, not propagation-stopping-dependent"
    - "Owned primitives resolve fontFamily via resolveFontFamily(FONT_BODY|FONT_DISPLAY, useFontsReady()) per the existing AvatarTile/ComingSoonTile convention, regardless of the typeRole's nominal font weight"

key-files:
  created:
    - apps/mobile/components/FestivalCard.tsx
    - apps/mobile/components/SegmentedControl.tsx
  modified:
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "FestivalCard's enter Pressable wraps BOTH the name and caption text (not just the name) so tapping anywhere in that text block enters the festival; the Save Pressable/Saved Badge sits as a sibling in the same flex-row, never nested inside the enter layer (REVIEW 05-04 MEDIUM)."
  - "Hero variant's full-width 'Festival öffnen' CTA is rendered as a sibling below the bordered card (inside an unstyled wrapping View), not inside the card's own border/padding — matches UI-SPEC's 'rendered below the card' wording literally."
  - "Copy ('Save'/'Saved'/'Open festival') lives inside FestivalCard via <Trans> macros (component-owned, fixed copy) rather than as caller-supplied props — mirrors how the existing festivals/index.tsx renderRow already owns its own '<Trans>Save</Trans>' msgid; SegmentedControl's labels, by contrast, are caller-supplied since Meine/Alle wording is instance-specific."
  - "SegmentedControl selected item = fillBrandQuiet background + textPrimary label; unselected = transparent + textSecondary — per UI-SPEC's explicit color-table override of the mockup source's textMuted-for-unselected."
  - "Track uses a raw 3px padding constant (not a spacingScale step) to match festipal-ds.js's SegmentedControl pixel-for-pixel (ADR-015 fidelity) since the ported sp-* ramp has no exact 3px step."

patterns-established:
  - "Owned-primitive card/control components accept a shared @festipal/contracts type directly (never redeclare the API shape) and take a `locale` prop for any date formatting, keeping the component pure/presentational (no data fetching, no business logic)."

requirements-completed: [FEST-01, FEST-02]

coverage:
  - id: D1
    description: "FestivalCard renders the flat (non-photo) list variant with a null-safe dates·place caption, name truncation, and a mutually-exclusive saved-badge/Save-affordance pair whose press targets are non-nested siblings"
    requirement: "FEST-01"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (i18next/no-literal-string clean)"
        status: pass
    human_judgment: true
    rationale: "On-device confirmation that a Save tap fires only onSave (never onEnter) and that the busy/disabled Save state blocks a rapid second tap is explicitly deferred to the consuming screens in 05-05/05-06 per this plan's own <verify> — no rendering surface exists yet to drive it from this plan alone."
  - id: D2
    description: "FestivalCard hero variant renders a title2 name plus a full-width 'Festival öffnen'/'Open festival' primary CTA below the card, wired to onEnter"
    requirement: "FEST-01"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck"
        status: pass
    human_judgment: true
    rationale: "Visual placement/sizing of the hero CTA is only meaningfully checkable once composed into the Home screen (05-06) — no host screen exists in this plan to screenshot against."
  - id: D3
    description: "SegmentedControl exposes options/value/onChange with a fillBrandQuiet-tinted selected pill and textSecondary unselected labels, never inventing a selection for an unknown value or throwing on an empty options array"
    requirement: "FEST-02"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint"
        status: pass
    human_judgment: true
    rationale: "No automated test exercises the empty-options/unknown-value edge cases yet (pure presentational component with no test file added this plan); visual selected-state treatment is only checkable once composed into the Festivals screen (05-07)."

duration: ~15min
completed: 2026-08-06
status: complete
---

# Phase 5 Plan 4: FestivalCard + SegmentedControl Summary

**Flat non-photo FestivalCard (list + hero variants, sibling non-nested Save/enter Pressables, saving/busy guard) and an options/value/onChange SegmentedControl pill, both owned RN primitives on shared tokens.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 locale catalogs updated)

## Accomplishments

- `FestivalCard` — flat (non-photo) card shell as a plain `View`; a full-card enter `Pressable` (name + null-safe `formatDateRange` caption) sits as a SIBLING to either a "Gespeichert"/"Saved" `Badge` or a quiet Save `Pressable`, so the two press targets never nest and a Save tap can only ever fire `onSave`.
- `saving` prop disables the Save affordance (`accessibilityState`, reduced opacity) and its handler no-ops while true, closing the duplicate rapid-tap gap flagged in cross-AI review.
- Hero variant renders a larger `title2` name and a full-width primary "Festival öffnen"/"Open festival" CTA (icon `arrow-right`) below the card, also calling `onEnter`.
- `SegmentedControl` — `options`/`value`/`onChange` pill primitive mirroring `festipal-ds.js`'s prop shape exactly; selected item gets a `fillBrandQuiet` tint + `textPrimary` label, unselected uses `textSecondary`; a press on the active value is a no-op, an empty `options` array renders without throwing, and an unmatched `value` never invents a selection.
- Extracted and translated the two new Lingui msgids ("Open festival"/"Festival öffnen", "Saved"/"Gespeichert"); reused the existing "Save" msgid from `festivals/index.tsx` verbatim — 0 missing translations.

## Task Commits

Each task was committed atomically:

1. **Task 1: FestivalCard (flat list + hero variants, saved/unsaved)** - `8c433c7` (feat)
2. **Task 2: SegmentedControl (Meine/Alle owned pill primitive)** - `a886210` (feat)

## Files Created/Modified

- `apps/mobile/components/FestivalCard.tsx` - Flat non-photo FestivalCard primitive, list + hero variants
- `apps/mobile/components/SegmentedControl.tsx` - options/value/onChange pill primitive
- `apps/mobile/locales/de/messages.po` - Added "Open festival"/"Saved" German translations
- `apps/mobile/locales/en/messages.po` - Extracted "Open festival"/"Saved" source strings

## Decisions Made

- FestivalCard's enter `Pressable` wraps both the name and caption text (not just the name), so any tap on that whole text block enters — the Save/Badge sibling occupies its own slot in the row and never overlaps it.
- The hero CTA is rendered below the bordered card (in an unstyled wrapper `View`), not inside the card's own padding, per the UI-SPEC's literal "rendered below the card" phrasing.
- Save/Saved/Open-festival copy is owned by `FestivalCard` itself via `<Trans>` (fixed, non-parameterized copy), while `SegmentedControl` takes already-localized `label`s from the caller (per-instance wording) — matches the plan's explicit "reuse the existing Save msgid" instruction most directly.
- SegmentedControl's selected/unselected text colors follow the UI-SPEC's `textPrimary`/`textSecondary` color-table entries, which deliberately diverge from the `festipal-ds.js` mockup source's `text-primary`/`text-muted` pairing.
- Track padding kept as a raw 3px constant (not a `spacingScale` step) for source-file pixel fidelity, since the ported ramp has no exact 3px value.

## Deviations from Plan

None - plan executed exactly as written. Both must_haves truths (Save/Enter never cross-fire, null-safe caption, mutually-exclusive Badge/Save, hero CTA, exact `options`/`value`/`onChange` prop names, no hardcoded copy in `SegmentedControl`) are satisfied as specified; no architectural changes, no missing-critical-functionality gaps found.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both primitives are ready for 05-05/05-06 (Home screen) and 05-07 (Festivals screen) to compose against — pure presentational, no data fetching, `Festival` type consumed directly from `@festipal/contracts`.
- On-device manual verification that Save fires only `onSave` (never `onEnter`) and that the busy Save state blocks a repeat tap is explicitly deferred to those consuming screens per this plan's own `<verify>` — tracked as this plan's only human-judgment coverage item, not a gap in this plan's own scope.

---
*Phase: 05-festival-selection-home*
*Completed: 2026-08-06*

## Self-Check: PASSED

- FOUND: apps/mobile/components/FestivalCard.tsx
- FOUND: apps/mobile/components/SegmentedControl.tsx
- FOUND: commit 8c433c7 (Task 1)
- FOUND: commit a886210 (Task 2)
