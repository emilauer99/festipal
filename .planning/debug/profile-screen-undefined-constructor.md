---
status: diagnosed
trigger: "Opening the Profile screen in the quiks Expo mobile app (apps/mobile) throws a runtime error and the screen fails. UAT test 5: 'c) wenn ich auf Profile klicke kommt ein App Error:  ERROR  [TypeError: undefined cannot be used as a constructor.]'"
created: 2026-08-12T00:00:00Z
updated: 2026-08-12T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED (static, device-unverified) — `app/profil.tsx` is the only screen in the app that renders an ICU **plural** message; Lingui's runtime constructs `new Intl.PluralRules(...)` for it, and Hermes (the Expo default engine) does not implement `Intl.PluralRules`, so the constructor operand is `undefined`.
test: ran the project's own Babel pipeline over `app/profil.tsx`; grepped the app for every `plural()` / `new X()` site; read `@lingui/core`'s emitted runtime; compared profil.tsx's import set against the screens that demonstrably work (Mehr, Friends)
expecting: exactly one construction site reachable on first render whose operand can be undefined under Hermes
next_action: DIAGNOSE-ONLY MODE — no fix applied. Hand root cause to the gap-closure planner. Device confirmation step documented under Resolution.verification.

reasoning_checkpoint:
  hypothesis: "Rendering app/profil.tsx evaluates two Lingui `plural()` messages unconditionally on first render; @lingui/core's interpolation eagerly runs `new Intl.PluralRules(locales, {type:'cardinal'})`; Hermes has no Intl.PluralRules, so this is `new undefined()`, which Hermes reports verbatim as `TypeError: undefined cannot be used as a constructor.`"
  confirming_evidence:
    - "grep: `plural(` from '@lingui/core/macro' appears in exactly ONE file app-wide — app/profil.tsx:199-200. No other screen renders a plural message."
    - "Ran the project's real Babel config over app/profil.tsx: transform succeeds, macro compiles away to `@lingui/core`, and the ONLY `new` in the emitted output is `new Date` (safe)."
    - "node_modules/@lingui/core/dist/index.mjs:75-84 — `function plural(...)` calls `getMemoized(..., () => new Intl.PluralRules(_locales, {type:'cardinal'}))`. The formatter is constructed BEFORE any rule lookup, so it runs for every plural message regardless of value."
    - "Both plural ICU messages exist in locales/de/messages.po and locales/en/messages.po (lines 17-22) — the catalog carries a plural token, so formats.plural is definitely reached."
    - "No Intl polyfill anywhere: `@formatjs/intl-pluralrules` is absent from apps/mobile/package.json and `PluralRules` appears in ZERO first-party source files."
    - "apps/mobile/app.json declares no `jsEngine` — Expo's default is Hermes."
    - "Hermes ships Collator/DateTimeFormat/NumberFormat/Locale but NOT PluralRules; facebook/hermes issue #1462 ('Intl.PluralRules support') is still an open feature request. FormatJS documents 'React Native uses Hermes which does not support Intl.PluralRules'."
    - "The Hermes error template `<value> cannot be used as a constructor.` (with trailing period) matches the reported string byte-for-byte; the sibling Hermes message 'This function cannot be used as a constructor.' confirms the template exists in that engine."
    - "profil.tsx lines 198-208 compute `metaLine` UNCONDITIONALLY, before the `viewState.kind === 'data'` branch — so the throw happens on the very first render, matching 'the screen never appears'."
  falsification_test: "On device, evaluate `typeof Intl.PluralRules` in the Hermes runtime (or log it at app start). If it is 'function', this hypothesis is dead. Equivalently: temporarily replace the two `plural()` calls with plain interpolated strings — if Profile then opens, the hypothesis holds."
  fix_rationale: "The root cause is the missing engine capability, not the two call sites. Polyfilling Intl.PluralRules at app entry (before the first render) fixes this occurrence AND every future plural message. Deleting the two `plural()` calls would only mask it and would regress the i18n correctness the phase deliberately bought (STATE.md 06-07: 'zero is a real plural category')."
  blind_spots:
    - "NOT device-verified. I could not run the Android build; step 'Hermes lacks Intl.PluralRules in RN 0.86.2 / Expo SDK 57' rests on external documentation + an open upstream issue, not on a device observation from this machine."
    - "I did not exhaustively evaluate every transitive node_modules module for a second `new <undefined>()`. If the device check shows Intl.PluralRules IS present, the next candidates are AvatarSunsetRing/AvatarTile (the two components unique to this route)."
  candidate_causes:
    - "code: profil.tsx is the sole user of the Lingui plural macro (necessary condition)"
    - "environment: Hermes JS engine does not implement Intl.PluralRules (necessary condition)"
    - "config: no @formatjs/intl-pluralrules polyfill registered at app entry; no jsEngine override to JSC"
    - "data: festivalCount/friendCount values — RULED OUT, the formatter is constructed before any value lookup"
  and_gate: "YES — this is a genuine two-condition AND. The plural call site alone is harmless (it works in Node, which is why vitest is green). A Hermes runtime without PluralRules alone is harmless (the app shipped 5 phases without one plural message). The crash needs BOTH, which is exactly why it only surfaced when Phase 06-07 introduced the app's first plural message on a screen nobody had opened on device."

## Symptoms

expected: Tapping "Profile" opens the profile screen; the profile outlook blocks render (no invented metrics), and nothing suggests the device-local avatar is account-backed.
actual: Tapping "Profile" produces an app error instead of the screen rendering.
errors: "ERROR  [TypeError: undefined cannot be used as a constructor.]"
reproduction: Phase 06 UAT test 5 — build the Android dev app from apps/mobile (cd apps/mobile && npx expo run:android), launch, log in, tap Profile.
started: Discovered during Phase 06 UAT (2026-08-12). Late Phase 06 fixes landed after the bulk 18-point device acceptance: 6707cf9, 8790e1c, 4f14feb, 53c09dc, 8db31c9, f4a9293, fa5abb2. Plan 06-08 newly introduced native code via @react-native-community/datetimepicker.

## Eliminated

- hypothesis: "@react-native-community/datetimepicker (native code added by plan 06-08) is missing from the installed APK, and the Profile route needs it"
  evidence: "grep shows the package is imported ONLY by app/(profile-setup)/complete-profile.tsx. The Babel-emitted require list for app/profil.tsx contains no reference to it, directly or transitively. Also a missing autolinked native module yields a different RN error shape."
  timestamp: phase-1

- hypothesis: "react-native-mmkv v4 / NitroModules native code is missing from the binary, so lib/avatar-storage.ts fails (the known 05-phase failure mode from project history)"
  evidence: "Two independent refutations. (1) avatar-storage calls `createMMKV({id})` — a plain FUNCTION call, not `new`, so it could never raise a constructor TypeError. (2) lib/theme-override-storage.ts calls the identical `createMMKV` on the same native module, and UAT test 1 (switch dark mode OFF, force-quit, relaunch, stays light) PASSED — persistence across a process restart is only possible if MMKV genuinely wrote and read. MMKV native is present and working."
  timestamp: phase-1

- hypothesis: "AvatarSunsetRing's react-native-svg usage (new in 06-07) fails"
  evidence: "AvatarSunsetRing imports exactly `Svg, Circle, Defs, LinearGradient, Stop` — the identical element set already shipping in components/WordmarkGlyph.tsx (rendered on the splash screen every launch) and components/FestivalCard.tsx (Home). No `new` expression exists in the component."
  timestamp: phase-2

- hypothesis: "A lucide-react-native icon name (AudioLines / Music2 / Tent / QrCode / Users / Heart / Camera / Mail) does not exist in v1.28.0 and resolves to undefined"
  evidence: "An undefined component type produces React's 'Element type is invalid: expected a string ... but got: undefined', not a Hermes constructor TypeError. React never applies `new` to a value it has not already confirmed is a function with an isReactComponent prototype."
  timestamp: phase-2

- hypothesis: "One of the seven late post-acceptance commits introduced the crash"
  evidence: "Reviewed all diffs. 6707cf9 adds cancelQueries()/clear() (no construction). 8790e1c touches mehr.tsx + theme.ts (Mehr renders fine — test 1 passed). 4f14feb touches SoonToast (test 3 passed). 53c09dc adds `new Date(Date.UTC(...))` to packages/db's INSERT schema only — Date is a Hermes global and the read-side select schema is untouched. 8db31c9 is apps/api only. f4a9293/fa5abb2 are docs/planning only."
  timestamp: phase-2

- hypothesis: "The Lingui macro is not being transformed, so `plural` is the throwing runtime stub from @lingui/core/macro"
  evidence: "Ran babel.transformSync with the project's exact presets/plugins over app/profil.tsx. Transform SUCCEEDS; the emitted require list contains `@lingui/core` and `@lingui/react` (the compiled targets) and NOT `@lingui/core/macro` or `@lingui/react/macro`. The macro is compiled away correctly. The fault is in the Lingui RUNTIME the macro correctly targets, not in the macro plumbing."
  timestamp: phase-3

- hypothesis: "profil.tsx's own code contains the bad construction"
  evidence: "The only `new` in the Babel-emitted output of app/profil.tsx is `new Date` (line 114 of the emitted file), from deriveAge's reference instant. Date is an always-defined Hermes global."
  timestamp: phase-3

## Evidence

- timestamp: init
  checked: .planning/debug/knowledge-base.md
  found: File does not exist — no prior resolved-session knowledge base
  implication: No known-pattern shortcut available; full investigation required

- timestamp: phase-1
  checked: Hermes error-message phrasing for the reported string
  found: Hermes uses the template `<value> cannot be used as a constructor.` (trailing period included) — the sibling message "This function cannot be used as a constructor." is documented in facebook/hermes#524 for JSI host functions. V8/JSC instead say "X is not a constructor".
  implication: The report is a genuine Hermes `new <undefined>()`. Not a React element-type error, not a missing-module resolution error. Search narrowed to construction sites reachable on the profile route.

- timestamp: phase-2
  checked: Import-set diff — app/profil.tsx vs the screens proven working in this same UAT session (app/(tabs)/mehr.tsx passed test 1 + item (a); app/(tabs)/friends.tsx passed item (b))
  found: Friends already exercises @tanstack/react-query, lib/api-client (apiClient.getMe(), same ['me'] key), SoonToast, tokens, fonts, theme-context. Mehr already exercises ListRow, expo-router, lucide, MMKV-backed theme storage. The genuinely profil-only surface is: AvatarSunsetRing, AvatarTile, lib/avatar-storage, lib/profile-age, lib/profile-meta-line, useQueryClient, and `plural` from @lingui/core/macro.
  implication: The whole shared stack (network, contract client, theming, fonts, toast, icons) is proven live in this very session. The cause is in the small profil-only residue.

- timestamp: phase-3
  checked: `grep -rn "core/macro|plural(" app components lib` across apps/mobile
  found: `plural` is imported and called in exactly ONE file app-wide — app/profil.tsx:7, :199, :200. No other screen, component or lib renders an ICU plural message.
  implication: This is the single strongest discriminator. It explains why five prior phases shipped clean and why only this one route dies.

- timestamp: phase-3
  checked: node_modules/@lingui/core/dist/index.mjs lines 75-84 (installed @lingui/core 6.6.0)
  found: |
    function plural(locales, ordinal, value, { offset = 0, ...rules }) {
      const _locales = normalizeLocales(locales);
      const plurals = ordinal ? getMemoized(..., () => new Intl.PluralRules(_locales, { type: "ordinal" }))
                              : getMemoized(..., () => new Intl.PluralRules(_locales, { type: "cardinal" }));
      return rules[value] ?? rules[plurals.select(value - offset)] ?? rules.other;
    }
  implication: THE CONSTRUCTION SITE. `new Intl.PluralRules(...)` is evaluated EAGERLY — `plurals` is bound before the `rules[value]` lookup — so it runs for every plural message regardless of the count value. `festivalCount === 0` / `friendCount === 0` cannot short-circuit it.

- timestamp: phase-3
  checked: apps/mobile/locales/de/messages.po and locales/en/messages.po
  found: Lines 17-22 of BOTH catalogs carry `{festivalCount, plural, one {# Festival} other {# Festivals}}` and `{friendCount, plural, one {# Friend} other {# Friends}}`.
  implication: The compiled catalog genuinely contains plural tokens, so Lingui's interpolation definitely dispatches to formats.plural at runtime. Both locales are affected — this is not a DE-only or EN-only path.

- timestamp: phase-3
  checked: apps/mobile/app.json for a jsEngine override; `grep -rn "intl-pluralrules|@formatjs|polyfill"` across apps/mobile
  found: No `jsEngine` key (Expo default = Hermes). Zero polyfill references — `@formatjs/intl-pluralrules` is not a dependency and `PluralRules` appears in no first-party source file in the entire monorepo.
  implication: Nothing supplies Intl.PluralRules. The app runs on Hermes with the stock, PluralRules-less Intl.

- timestamp: phase-3
  checked: Hermes Intl capability (web research + upstream issue tracker)
  found: Hermes implements Intl.Collator, Intl.DateTimeFormat, Intl.NumberFormat and Intl.Locale. `Intl.PluralRules` is NOT implemented — facebook/hermes issue #1462 ("Intl.PluralRules support") remains an open feature request, and FormatJS's own polyfill docs state plainly "React Native uses Hermes which does not support Intl.PluralRules".
  implication: `Intl.PluralRules` is `undefined` on device. `new undefined(...)` → exactly "TypeError: undefined cannot be used as a constructor."

- timestamp: phase-3
  checked: apps/mobile/app/profil.tsx control flow, lines 198-208
  found: `buildProfileMetaLine({ festivalsLabel: plural(...), friendsLabel: plural(...) })` is computed at component-body top level, OUTSIDE and BEFORE the `viewState.kind === 'data'` JSX branch. It executes on the first render, including the `kind: 'loading'` render.
  implication: The throw happens before ANY profile markup is produced — matching the symptom exactly ("an app error instead of the screen rendering", never a partial screen).

- timestamp: phase-4
  checked: Why no gate caught this — apps/mobile/vitest.config.ts + lib/__tests__/ inventory
  found: The runner is `environment: 'node'` and `include: ['lib/**/__tests__/**/*.test.ts']`. Node ships full-ICU (`typeof Intl.PluralRules === 'function'`, verified locally). No test renders a screen. lib/__tests__/profile-meta-line.test.ts covers the JOINING rule only — buildProfileMetaLine takes ALREADY-localized strings by design (documented in the module header), so the plural call itself lives in untested screen code.
  implication: Green typecheck + green vitest are structurally incapable of catching this class. It is only observable on a Hermes device. This is the same lesson as the resolved `first-login-unmatched-route` session.

- timestamp: phase-4
  checked: .planning/workstreams/mobile/STATE.md decision log, 06-09 entry
  found: "Geraeteabnahme der GESAMTEN Phase 6 (18 Punkte) vom User pauschal mit 'approved' freigegeben — MENSCHLICHE Abnahme am Geraet, keine Einzelbefunde je Punkt, der Executor hat den Test nicht selbst gefahren".
  implication: The blanket 18-point acceptance carries no per-item evidence, so it is entirely consistent with the Profile screen never actually having been opened on device before this UAT. The crash need not be a regression from the seven late commits — it can have been present since 06-07 shipped the plural macro.

## Resolution

root_cause: |
  Two conditions that are individually harmless combine (AND-gate):

  (1) CODE — `apps/mobile/app/profil.tsx:199-200` is the first and only place in the
      app that renders an ICU **plural** message (`plural()` from `@lingui/core/macro`,
      introduced by plan 06-07). It runs unconditionally in the component body, on the
      very first render, before any data branch.

  (2) ENVIRONMENT/CONFIG — `@lingui/core@6.6.0`'s runtime resolves any plural token by
      eagerly evaluating `new Intl.PluralRules(locales, { type: 'cardinal' })`
      (node_modules/@lingui/core/dist/index.mjs:75-84). Hermes — the Expo default engine,
      with no `jsEngine` override in apps/mobile/app.json — does not implement
      `Intl.PluralRules` (facebook/hermes#1462 still open), and the app registers no
      polyfill. `Intl.PluralRules` is therefore `undefined`, and `new undefined(...)`
      makes Hermes raise verbatim: `TypeError: undefined cannot be used as a constructor.`

  Neither condition alone breaks anything: the same code is green under vitest because
  Node has full-ICU PluralRules, and the app ran five phases on Hermes without a single
  plural message. The crash is the intersection.

fix: "" # DIAGNOSE-ONLY — no fix applied

verification: |
  NOT DEVICE-VERIFIED. Everything above except the Hermes capability claim was proven by
  executing this project's own toolchain locally (Babel transform, grep over source,
  reading the installed @lingui/core runtime, reading the compiled catalogs). The Hermes
  claim rests on upstream documentation + an open issue.

  Cheapest device confirmation before the fix lands:
    1. cd apps/mobile && npx expo run:android   (never from the repo root)
    2. Log `typeof Intl.PluralRules` at app start (or evaluate it in the Hermes debugger).
       Expect 'undefined'. If it prints 'function', this diagnosis is wrong — pivot to
       AvatarSunsetRing / AvatarTile, the only other profil-exclusive surfaces.
    3. After the fix: open Profile. It must render, and the meta line must read
       "0 Festivals · 0 Friends · …" with correct singular/plural at counts 0, 1 and 2.

files_changed: []
