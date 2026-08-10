---
phase: 5
slug: festival-selection-home
audited: 2026-08-10
baseline: 05-UI-SPEC.md (approved design contract, gsd-ui-checker 2026-08-05)
audit_mode: code-only (React Native/Expo — no browser-screenshotable surface; port probe 3000/5173/8080 dead, 8081 = NestJS API)
scores:
  copywriting: 3
  visuals: 3
  color: 3
  typography: 3
  spacing: 4
  experience_design: 3
overall: 19
max: 24
blockers: 0
warnings: 9
status: warnings
---

# Phase 5 — UI Review

**Audited:** 2026-08-10
**Baseline:** `05-UI-SPEC.md` (approved) + `05-CONTEXT.md` locked decisions D-01..D-08
**Screenshots:** not captured — Expo native app, no dev web server (code-only audit per orchestrator config)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | EN contract strings verbatim; DE catalog deviates from binding tab-label rows ("Start"/"Freunde" vs contract "Home"/"Friends") |
| 2. Visuals | 3/4 | Festival-home key-fact rows (accent calendar/map-pin icons) not built — single muted caption line instead; hero CTA glow missing |
| 3. Color | 3/4 | 100% token-sourced, zero hardcoded colors; but accent used on ~5 elements beyond the spec's exact allowlist AND missing on the two mandated key-fact icons |
| 4. Typography | 3/4 | Locked type scale honored exactly (sizes, eyebrow tracking); but role weights are faux-rendered — loaded 500/600 font files never referenced, no Jakarta 700 file loaded |
| 5. Spacing | 4/4 | Every spec spacing/radius value verified in code (screenPad 18, sp-5/6/7/9, sectionGap 28, nav 64/14, scrollBottomPad 104, hitMin 44) |
| 6. Experience Design | 3/4 | Exemplary state coverage (4-state unions, optimistic save w/ concurrent-safe rollback); save-error banner has no live region and is segment-scoped |

**Overall: 19/24** — no BLOCKERs; 9 WARNINGs, 5 minor notes.

---

## Top 3 Priority Fixes

1. **Festival-home key-fact rows missing** (`app/(festival)/f/[festivalSlug].tsx:167-170`) — The UI-SPEC mandates two key-fact rows with accent icons (`calendar-clock`, `map-pin` in `colors.primary`, `sp-4` icon-to-text gap — Spacing table row 1 + Color accent allowlist item 4). Implemented is a single icon-less `bodySm`/`textMuted` caption line (`"{dates} · {place}"`). The identity block loses its designed secondary anchor and the accent's only allocation on this screen. **Fix:** replace the caption `<Text>` with two flex-rows: `<CalendarClock size={16} color={colors.primary}/>` + dates text, `<MapPin size={16} color={colors.primary}/>` + place text (place row omitted when null), `gap: spacingScale['sp-4']`.
2. **Type-weight fidelity: role weights are synthesized, not loaded** (`lib/fonts.ts:18-19` + every Phase 5 component) — All components resolve `fontFamily` to `PlusJakartaSans_400Regular` or `Outfit_700Bold` and then apply numeric `fontWeight` from `typeRoles`. `useAppFonts` registers `Outfit_600SemiBold`, `PlusJakartaSans_500Medium`, `PlusJakartaSans_600SemiBold` but **nothing references them**, and no Jakarta 700 file is loaded at all. Result on device: `title3`/`micro` (Jakarta bold 700) render as faux-bold of the 400 file; `label`/`bodyStrong` (600) get synthetic or ignored intermediate weight; `title2` (Outfit semibold 600) renders from the 700 file. The "LOCKED per ADR-015" brand type system is approximated, not matched. **Fix:** add a role→registered-family resolver (e.g. `resolveFontForRole(role, fontsReady)` returning `Outfit_600SemiBold` for title2, `PlusJakartaSans_600SemiBold` for label, a newly loaded `PlusJakartaSans_700Bold` for title3/micro) and stop passing `fontWeight` alongside an exact-weight family.
3. **DE catalog deviates from the binding Copywriting Contract tab rows** (`locales/de/messages.po:159-160, 171-172`) — Contract declares DE "Home" and "Friends" as *unchanged from mockup `GLOBAL_NAV` (verbatim, binding)*; the shipped catalog has `Home → "Start"` and `Friends → "Freunde"`. ("Profil" and "bald verfügbar" match.) These may well be deliberate improvements from the later translation pass (deferred-items 05-06), but they contradict a verbatim-transcribed contract row. **Fix:** either revert the two msgstr to the contract values, or amend 05-UI-SPEC.md's Copywriting Contract rows with a documented decision so the contract and catalog agree before Phase 6 reuses these labels.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Verified verbatim against the contract (all EN source rows):** eyebrow "Your next festival" (`home.tsx:169`), hero CTA "Open festival" (`FestivalCard.tsx:123`), "My festivals"/"All" rail (`home.tsx:185,189`), Home empty state title/body/CTA (`home.tsx:152-160`), segments "Mine"/"All" (`festivals.tsx:324-325`), badge "Saved"/affordance "Save" (`FestivalCard.tsx:93,106`), Meine empty ("No saved festivals yet" / "Switch to 'All' and save one with a tap." / "Switch to All", `festivals.tsx:364-371`), Alle empty ("No festivals yet" / "New festivals will show up here.", `festivals.tsx:380-383`), tiles Timetable/Map/Cashless/News + "Soon" (`[festivalSlug].tsx:174-177`), Back a11y label (`[festivalSlug].tsx:118`), disabled-tab a11y suffix "— coming soon" (`FloatingNav.tsx:148`). No generic "Submit/OK/Click here" labels anywhere. Voice rules held (sentence case, no emoji, ≤1 "!" — zero "!" found).

- **WARNING — DE tab labels vs contract:** see Priority Fix 3. `messages.po` "Home"→"Start", "Friends"→"Freunde"; contract rows are marked `[unchanged from mockup GLOBAL_NAV]` i.e. verbatim-binding.
- **WARNING — dev-environment copy in user-facing error states:** "Can't reach the server — make sure your device is on the same Wi-Fi as the dev API." ships on 3 surfaces (`home.tsx:133-136`, `festivals.tsx:346-348`, `[festivalSlug].tsx:138-140`). The UI-SPEC's own backstop rows mandate reusing this Phase-3 copy verbatim, so it is contract-*compliant* — but it is dev-tooling copy that must be rewritten before any production/store build. Flag forward to a later phase's copy pass.
- **Note — off-contract copy authored fresh, in-voice:** 404 state ("Festival not found" / "This festival may have been removed or the link is out of date.", `[festivalSlug].tsx:152-157`) and save-error ("Couldn't save festival — try again.", `festivals.tsx:205`) — both documented in 05-03/05-06 summaries with DE translations. Acceptable additions; consider back-porting into the UI-SPEC Copywriting Contract for future audits.

### Pillar 2: Visuals (3/4)

**Focal points match the Visual Hierarchy section:** Home = hero card + accent CTA, rail explicitly secondary (smaller `title3` cards, no CTA); Festivals = SegmentedControl anchor above the list; festival home = `display2` (34px) name H1 with the tile grid fully de-emphasized (`textMuted` icons/labels, quiet "Soon" badge — deliberately NOT accent, `ComingSoonTile.tsx:60-70`); tab bar = accent tint-pill + 2.4 stroke on the active item, disabled items at 0.4 opacity (`FloatingNav.tsx:87-91,182-184`). Icon-only controls all carry `accessibilityLabel` (logout `festivals.tsx:313`, back `[festivalSlug].tsx:118`, tab items `FloatingNav.tsx:85,148`).

- **WARNING — key-fact rows not built:** see Priority Fix 1. The mandated two-row icon layout collapsed into one caption line; the identity block reads flatter than designed and the eye has no secondary landing point between H1 and tile grid.
- **WARNING — hero CTA glow missing:** Color table specifies "Primary CTA fill **+ glow**" for "Festival öffnen"; `FestivalCard.tsx:198-207` renders a flat `colors.primary` pill with no shadow/glow (`shadowColor`/`elevation` absent). Minor on Android (shadow support limited), but the mockup's signature accent-glow treatment is absent on the single most important CTA.
- **Note:** `FestivalCard` correctly implements the contract's flat non-photo variant (Scope note #1) — card shell `surfaceCard`/`borderSubtle`/`r-card`/`sp-6` padding, header row with name + mutually-exclusive Badge/Save, `numberOfLines={1}` truncation (`FestivalCard.tsx:81,84`). Sibling non-nested press targets exceed the spec's stopPropagation pattern.

### Pillar 3: Color (3/4)

**Token discipline is complete:** zero hardcoded hex/rgba values in any Phase 5 file (grep over `apps/mobile/**/*.tsx` — only Phase-4 files `verify.tsx`, `complete-profile.tsx`, `AvatarTile.tsx` carry documented spec-value literals). All six new roles (`borderSubtle`, `borderBrand`, `fillQuiet`, `fillBrandQuiet`, `glassFill`, `glassBorder`) landed in `packages/ui/src/tokens.ts:144-149` at the exact spec values, with correct light-mode overrides for `borderSubtle`/`fillQuiet` only (`tokens.ts:174-175`, per contract: nav stays dark-glass). Violet (`secondary`) never used — Scope note #12 held. 60/30/10 structure: `bgApp` screens, `surfaceCard` cards/tiles, accent small.

- **WARNING — accent beyond the "exactly these elements, nothing else" allowlist:** the spec reserves `colors.primary` for 4 elements (hero CTA, active tab, Saved badge, key-fact icons). Found additionally: rail "All" see-all link (`home.tsx:252` — 05-07 traced it to the mockup's `--text-link` token, defensible but un-contracted), empty-state CTAs "Browse festivals"/"Switch to All" (`home.tsx:270-277`, `festivals.tsx:423-430`), and 3 Retry buttons. Each individually reasonable (primary-button convention), but collectively ~5 accent-filled elements the contract does not declare. Amend the UI-SPEC allowlist or restyle the see-all link/secondary CTAs quieter.
- **WARNING — accent missing where mandated:** the two key-fact icons (Priority Fix 1) are the allowlist's 4th entry and do not exist.
- **Note:** `colors.danger` appears on error text (`festivals.tsx:419`, `home.tsx:267`, `[festivalSlug].tsx:206`) although the spec lists danger "not used this phase"; this is the contract-endorsed verbatim reuse of the Phase-3 error pattern (backstop rows), so recorded as informational, not a violation.

### Pillar 4: Typography (3/4)

**Distribution audit:** every rendered size traces to a locked `typeRoles` entry — micro 10.5 (tab labels, badges, save affordance, eyebrow), label 12 (segments, see-all), bodySm 13.5 (captions, errors), body 15 (helpers/empty bodies), title3 17 (card names, all button labels, tile labels), title2 21 (hero name, section heads, empty/404 headings), display2 34 (festival-home H1), wordmark 56 (Welcome, Phase 4). No stray sizes, no mono usage (contract: JetBrains Mono excluded this phase — confirmed). The eyebrow is the single uppercase micro (`home.tsx:234-235` — `textTransform: 'uppercase'`, `letterSpacing: size * 0.09` = the `--ls-caps` +.09em, exactly per the contract's one-exception rule); Badge/tab micro correctly NOT uppercase. Families correct per role (title2/display2 → Outfit, rest → Jakarta; hero name uses `displayFont`, list name `bodyFont` — `FestivalCard.tsx:78`).

- **WARNING — weights synthesized, weight files unused:** see Priority Fix 2. `resolveFontFamily(FONT_BODY|FONT_DISPLAY, …)` always returns the 400-Regular Jakarta / 700-Bold Outfit file regardless of the role's weight; the registered 500/600 variants (`lib/fonts.ts:73-80`) are dead weight and Jakarta has no 700 file. On-device rendering of title3/micro/label/bodyStrong/title2 diverges from the locked brand weights (faux-bold / ignored intermediate weights). This is an inherited Phase-4 convention (05-04 SUMMARY documents it), but Phase 5 multiplied its surface area across 6 new components.
- **Minor — lineHeights dropped in components:** `typeRoles` lineHeights are applied in screens (`home.tsx:232,246`, `[festivalSlug].tsx:241`) but omitted in `FestivalCard` (name/nameHero/caption, lines 151-165) and `SegmentedControl`/`ComingSoonTile` text — RN default line heights render instead of the role's 1 / 1.2 / 1.45.

### Pillar 5: Spacing (4/4)

Every contract value verified at its call site: `screenPad` 18 on all three screens + FloatingNav left/right (`home.tsx:222`, `festivals.tsx:401`, `[festivalSlug].tsx:231`, `FloatingNav.tsx:65-66`); `sp-6` 16 card padding (`FestivalCard.tsx:137`); `sp-5` 12 list row gap (`festivals.tsx:406`), rail gap (`home.tsx:254`), tile-grid gap (`[festivalSlug].tsx:252`); `sectionGap` 28 between Home sections (`home.tsx:226`); `sp-7` 20 festival-home top pad (`[festivalSlug].tsx:232`); `sp-9` 32 identity→tiles rhythm (`[festivalSlug].tsx:249`); `navHeight` 64 / `navInset` 14 + `insets.bottom` (`FloatingNav.tsx:67,158`); `scrollBottomPad` 104 on every scrollable (`home.tsx:224`, `festivals.tsx:406`, `[festivalSlug].tsx:233`); `hitMin` 44 on tabs, Save, back, segments, every CTA. `radiiScale` used exactly as contracted (r-card 22 cards, r-md 16 tiles, r-pill everywhere pill-shaped) and correctly added as its own export, not merged into the generic `radii` (`tokens.ts:66-70`). Nothing square-cornered.

- **Minor:** four raw constants outside the ramp — `TRACK_PADDING = 3` (`SegmentedControl.tsx:12`, explicitly documented ADR-015 pixel fidelity — compliant), `RAIL_ITEM_WIDTH = 268` (`home.tsx:21`, traced to mockup line 175 in 05-07 SUMMARY — compliant), activePill inset `4` (`FloatingNav.tsx:187-188` — equals `sp-2`, could reference it), badge `paddingVertical: 2` (`ComingSoonTile.tsx:64` — equals `sp-1`). `scrollBottomPad` (104) on the stacked festival home, which sits *above* the tab-bar shell and has no floating nav — harmless over-padding, not a defect.

### Pillar 6: Experience Design (3/4)

**State coverage matches the probe table fully:** all three data surfaces branch on explicit discriminated unions — Home `loading/error(transport|response)/empty/ready` (`home.tsx:26-30,56-82`), per-segment `SegmentViewState` with distinct Meine/Alle empty states and Alle gated on BOTH queries to avoid a mislabeled-unsaved flash (`festivals.tsx:281-300`), festival home `missingSlug/pending/transport-error/404/200` with cached instant-paint that never masquerades as authority (`[festivalSlug].tsx:100-107`). A non-200 ts-rest result never falls through to an empty state (`home.tsx:64-66`). 404 renders distinct copy and hygienically clears a matching persisted slug (`[festivalSlug].tsx:93-98`). Save is optimistic with dedupe, per-id synchronous in-flight guard, concurrent-save-safe rollback (reconcile-not-restore, WR-01), and `onSettled` invalidation (`festivals.tsx:151-213`); the `saving` prop disables and no-ops the affordance (`FestivalCard.tsx:60-65,100-102`). Back is never a dead-end (`leaveFestival`, cold-start-aware). Disabled tabs are non-navigable *by construction* plus `disabled` + `accessibilityState` + "coming soon" a11y suffix. Logout guards re-entrancy and clears the tenant focus. The formerly-open first-login unmatched-route defect is **resolved** (`.planning/debug/resolved/first-login-unmatched-route.md`, round-3 single-owner `app/index.tsx` with declarative `<Redirect>` + splash frame); the cold-start-restores-unsaved-festival regression was closed by 05-11 and device-confirmed in UAT round 3.

- **WARNING — save-error not announced to assistive tech:** the rollback error `<Text>` (`festivals.tsx:332-334`) has no `accessibilityLiveRegion="polite"` / `accessibilityRole="alert"` — a TalkBack user whose optimistic Saved badge silently reverts gets no notification. One-line fix.
- **WARNING — save-error banner is segment-scoped:** rendered only when `segment === 'alle'` (`festivals.tsx:332`). Correct today (Save affordances only exist in Alle), but the condition silently swallows the error surface if a Save path ever reaches Meine/Home (Home's cards pass `noopSave`, so currently unreachable — fragile coupling worth a comment or removal of the segment guard).
- **Minor:** `ComingSoonTile`'s root `View` sets `accessibilityState={{ disabled: true }}` without `accessible`/`accessibilityRole` — screen readers will read children individually and may never announce the disabled state; the spec permits this ("if made focusable at all") but grouping the tile (`accessible accessibilityRole="button" disabled`-equivalent) would announce intent better.
- **Minor:** live tab items in `FloatingNav` and the `SegmentedControl` items give no pressed feedback (no `android_ripple`/pressed-style opacity) — mockup-silent, but standard RN affordance.

---

## Registry Safety

Not applicable — `components.json` does not exist (React Native/Expo app, no shadcn); UI-SPEC Registry Safety table declares no registries. The one new dependency, `expo-blur ~57.0.2`, is an Expo-maintained npm package installed via `expo install` with lockfile review (05-02 SUMMARY) — outside the registry gate by the spec's own note.

---

## Files Audited

- `apps/mobile/app/(tabs)/home.tsx`
- `apps/mobile/app/(tabs)/festivals.tsx`
- `apps/mobile/app/(tabs)/_layout.tsx`
- `apps/mobile/app/(festival)/f/[festivalSlug].tsx`
- `apps/mobile/app/(auth)/welcome.tsx`
- `apps/mobile/app/index.tsx`
- `apps/mobile/components/FloatingNav.tsx`
- `apps/mobile/components/FestivalCard.tsx`
- `apps/mobile/components/SegmentedControl.tsx`
- `apps/mobile/components/ComingSoonTile.tsx`
- `packages/ui/src/tokens.ts`
- `apps/mobile/lib/fonts.ts`
- `apps/mobile/locales/de/messages.po` (tab-label rows)
- Contract/context: `05-UI-SPEC.md`, `05-CONTEXT.md`, SUMMARYs 05-01..05-11, `deferred-items.md`, debug ledgers (`resolved/first-login-unmatched-route.md`, `cold-start-restores-unsaved-festival.md`)
