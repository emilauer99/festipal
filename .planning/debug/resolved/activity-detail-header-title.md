---
status: resolved
trigger: "Investigate issue: activity-detail-header-title — The activity detail screen header shows the static English title 'Activity'. During UAT the user requested it read 'Aktivität' (German chrome text). Diagnose where the header title comes from and what exactly must change (hardcoded string vs. Lingui catalog entry vs. missing DE translation)."
created: 2026-08-16T00:00:00Z
updated: 2026-08-16T00:00:00Z
resolved: "2026-08-17 — G-11-2 closed by 11-06 + UAT Test 10: DE-Geraet mit kaltem Metro-Cache zeigt 'Aktivität'; kein Code-Defekt, UAT-Wording-Fix"
---

## Current Focus

bug_class: Bohrbug (deterministic rendering question; no timing/concurrency involved)
hypothesis: CONFIRMED-BY-ELIMINATION — the localization chain for the header title is complete and correct; none of the three suspected defect classes (hardcoded string / missing Lingui wrap / missing DE msgstr) exists. The English "Activity" the user reacted to is the English SOURCE copy of the catalog entry surfacing at UAT time, not a broken lookup.
test: static chain verification (call site -> catalog -> locale resolution -> provider mount) + git archaeology + cross-evidence from UAT tests 1 and 8
expecting: n/a — diagnosis complete
next_action: return diagnosis (goal: find_root_cause_only); recommend one DE-device observation with cold Metro cache (`expo start -c`) to split the residual environment branch

reasoning_checkpoint:
  hypothesis: "The DE header title chain is complete (AppHeader t`Activity` -> de.po 'Aktivität'); the observed 'Activity' is the English source copy surfacing via UAT-script wording, EN locale at observation time, or a stale dev-bundle compiled catalog — not a missing/hardcoded string"
  confirming_evidence:

    - "components/AppHeader.tsx:145 uses Lingui macro t`Activity` in pushScreenTitle — not hardcoded"
    - "apps/mobile/locales/de/messages.po:84-86 holds msgid 'Activity' -> msgstr 'Aktivität' (source ref components/AppHeader.tsx), added in 5e5c74c (2026-08-15 14:13), BEFORE UAT start 17:30; no later commit removed it"
    - "UAT Test 1 passed with German phase-11 strings ('Deine Aktivitäten'/'Wer kommt mit?', same de.po, added minutes earlier) — DE catalog lookups from this phase work on the device"
    - "UAT Test 8 passed: switching device to EN changes ALL chrome — locale switching machinery works both ways"
    - "resolveUiLocale maps de-AT -> de (primary-subtag match) with uiFallback 'de'; AppHeader mounts inside I18nProvider (app/_layout.tsx:528/678)"
    - "UAT Test 2's OWN expectation text instructed the user to expect a 'statischem „Activity“-Header' — the English msgid was presented to the user by the test script itself"
  falsification_test: "On a German-locale device with cold Metro cache (expo start -c), open /activity-detail. If the header still shows 'Activity', the no-code-defect conclusion is falsified and the stale-compiled-catalog branch becomes root cause"
  fix_rationale: "No code/catalog change needed for the stated requirement — DE already renders 'Aktivität'. Actionable follow-ups are verification + UAT-wording correction, not a string fix"
  blind_spots: "Cannot observe the physical device from here; cannot rule out that the dev-client bundle at UAT time served a Metro-transform-cached de catalog from 14:01 (pre-5e5c74c) — that version had Test 1's strings but NOT 'Activity', which would reproduce the exact observation (Test 1 German + header English). Five later de.po commits each should have invalidated the cache, making this unlikely but not impossible"
  candidate_causes:

    - "code: hardcoded English title at the call site — ELIMINATED (Lingui macro present)"
    - "data (catalog): missing/empty DE msgstr — ELIMINATED (present since 5e5c74c, pre-UAT)"
    - "environment: device on EN at observation time, or stale Metro transform cache serving a pre-5e5c74c compiled de catalog — PLAUSIBLE, only falsifiable on-device"
    - "process (spec/UAT): Test 2 expectation itself prescribed the English 'Activity' header, priming the user's report as a spec correction rather than an observed DE-rendering defect — PLAUSIBLE"
  and_gate: "no — any single branch fully explains the observation; no conjunction required"

## Symptoms

expected: Header of /activity-detail shows "Aktivität" as title (German UI chrome on a German-locale device)
actual: Header shows English "Activity". User reported verbatim: "pass. aber im header schreib Aktivität (quiks)"
errors: None reported
reproduction: Test 2 in UAT — from the Activities tab, tap any activity card; the /activity-detail screen pushes with a static "Activity" header title
started: Discovered during UAT of phase 11 (activities UI)

## Eliminated

<!-- APPEND only -->

- hypothesis: The header title is a hardcoded English string not wrapped in Lingui
  evidence: components/AppHeader.tsx line 145 uses the Lingui macro `t\`Activity\`` in the pushScreenTitle map; locales/de/messages.po lines 84-86 hold `msgid "Activity"` / `msgstr "Aktivität"` sourced from components/AppHeader.tsx
  timestamp: 2026-08-16

- hypothesis: The DE catalog is missing the "Activity" entry (empty/absent msgstr) so Lingui falls back to the English source
  evidence: git show 5e5c74c confirms msgstr "Aktivität" present since 2026-08-15 14:13 — the same commit that created the screen, hours before UAT began; no later commit removed it
  timestamp: 2026-08-16

- hypothesis: The app's UI locale resolves to 'en' on the user's device (locale detection broken/pinned)
  evidence: resolveUiLocale matches primary subtags (de-AT -> de) with uiFallback 'de'; UAT Test 1 passed showing GERMAN phase-11 strings from the same de.po on the same device, and Test 8 confirmed DE<->EN chrome switching works — the locale machinery is demonstrably functional
  timestamp: 2026-08-16

- hypothesis: A second title source (native Stack.Screen options / in-screen header) renders the English "Activity" over AppHeader
  evidence: app/_layout.tsx:665 registers activity-detail with NO options; navigator screenOptions suppress the native header app-wide; AppHeader's push state is the only title renderer for this route
  timestamp: 2026-08-16

## Evidence

<!-- APPEND only -->

- timestamp: 2026-08-16
  checked: No knowledge base exists (.planning/debug/knowledge-base.md missing)
  found: No prior-pattern candidates
  implication: Proceed with fresh investigation

- timestamp: 2026-08-16
  checked: grep for activity-detail + "Activity" title across apps/mobile
  found: Header title comes from components/AppHeader.tsx pushScreenTitle map ('activity-detail' -> t`Activity`, line 145); route registered in app/_layout.tsx; lib/app-chrome.ts routes 'activity-detail' to push header state
  implication: Title is Lingui-wrapped, NOT hardcoded

- timestamp: 2026-08-16
  checked: locales/de/messages.po line 84-86
  found: msgid "Activity" -> msgstr "Aktivität" EXISTS (source components/AppHeader.tsx); en catalog has "Activity" -> "Activity"
  implication: DE translation exists in the .po source. Remaining hypotheses - (a) UI locale is pinned/resolved to en, (b) compiled runtime catalog stale vs .po, (c) "Aktivität" added to .po AFTER the UAT build

- timestamp: 2026-08-16
  checked: git history of apps/mobile/locales/de/messages.po; git show 5e5c74c
  found: msgid "Activity" AND msgstr "Aktivität" both landed in 5e5c74c (2026-08-15 14:13, plan 11-01, same commit that created the activity-detail screen); five later commits (11-03..11-05, through 18:54) touched the de.po without removing it. UAT started 17:30 same day
  implication: Hypothesis (c) eliminated — the translation predates the UAT. Since the screen itself was created in 5e5c74c, any bundle able to open /activity-detail was built from source that included the translation

- timestamp: 2026-08-16
  checked: 11-UAT.md full record
  found: Test 2 expectation VERBATIM told the user to expect a "statischem „Activity“-Header"; user replied "pass. aber im header schreib Aktivität (quiks)". Test 1 passed with German phase-11 section titles ("Deine Aktivitäten" / "Wer kommt mit?" — same de.po, entries at lines 1153-1179). Test 8 passed: device switched to EN changes all chrome texts
  implication: DE catalog lookups for phase-11 strings demonstrably worked on the UAT device (Test 1), and locale switching works (Test 8) — contradicts a general en-pinned-locale or broken-lookup hypothesis (a). The English msgid was put in front of the user by the UAT script itself

- timestamp: 2026-08-16
  checked: app/_layout.tsx route registration (line 665) and navigator defaults
  found: <Stack.Screen name="activity-detail" /> carries NO options; navigator-wide screenOptions hide the native header, so components/AppHeader.tsx is the ONLY header/title source for this route (lib/app-chrome.ts routes 'activity-detail' to the push state)
  implication: No second competing title source; the t`Activity` call at AppHeader.tsx:145 is the single origin of the observed text

- timestamp: 2026-08-16
  checked: lib/i18n.ts, app/_layout.tsx locale bootstrap (lines 291-298, 528), packages/i18n/src/resolve.ts
  found: catalogs load from both .po files at module scope (i18n.load({en, de})); activateUiLocale resolves device locales via resolveUiLocale (primary-subtag match, de-AT -> de; uiFallback 'de' so only genuinely-EN devices get en); AppHeader mounts inside I18nProvider; localeReady gates bootstrap
  implication: Locale resolution and provider wiring are correct — a German device activates 'de' and the header resolves "Aktivität" from the catalog

## Resolution

root_cause: "No defect in the localization chain. The header title originates solely from components/AppHeader.tsx:145 (`'activity-detail': t`Activity``, Lingui macro — NOT hardcoded), and the DE catalog already maps 'Activity' -> 'Aktivität' (apps/mobile/locales/de/messages.po:84-86, since commit 5e5c74c, pre-UAT). On a German-locale device the header resolves to 'Aktivität'. The English 'Activity' the user reacted to is the English SOURCE copy of that catalog entry surfacing at UAT time — primarily via the UAT script itself (Test 2's expectation literally prescribed a 'statischer „Activity“-Header', propagated from the 11-01 plan artifacts that quote the msgid); residual on-device branch (device on EN at observation, or a stale Metro-transform-cached compiled de catalog in the dev-client bundle) is only falsifiable by one DE-device observation with a cold cache."
fix: "(diagnose-only — direction) 1) Verify once on a DE-locale device with `expo start -c`: expected header 'Aktivität' — then no code/catalog change is needed and G-11-2 closes as already-satisfied. 2) If it still shows 'Activity' on DE, the stale compiled-catalog branch is the root cause — clearing the Metro cache IS the fix. 3) Fix the UAT/gap wording so DE-device expectations cite 'Aktivität' (or locale-neutral 'localized static title'), never the English msgid. 4) Only if the user additionally wants different copy (e.g. brand term 'quiks') is a one-line de.po msgstr edit needed."
verification: "Static chain verification complete (call site -> catalog -> locale resolution -> provider mount, plus git archaeology and UAT cross-evidence). On-device confirmation deliberately left to the fix phase per goal: find_root_cause_only."
files_changed: []
