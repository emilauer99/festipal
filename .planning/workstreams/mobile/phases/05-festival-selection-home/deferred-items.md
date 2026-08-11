# Deferred Items — Phase 05 (festival-selection-home)

Out-of-scope discoveries logged during execution per the executor's scope-boundary rule
(only auto-fix issues directly caused by the current task's changes).

## 05-06 Task 1

- **Pre-existing untranslated DE msgids from 05-05's `components/FloatingNav.tsx`**: `"Home"`,
  `"Friends"`, `"Profile"`, `"coming soon"` all have an empty `msgstr ""` in
  `apps/mobile/locales/de/messages.po` (confirmed via `pnpm --filter @festipal/mobile extract`
  catalog stats — 10 missing before this plan, 4 remain after translating this task's own 6 new
  msgids). These render as their English source text on a German-locale device — a real,
  user-visible I18N-01 gap in the tab bar, but not introduced by 05-06's changes. Needs a DE
  translation pass over `components/FloatingNav.tsx`'s strings before this phase ships.
