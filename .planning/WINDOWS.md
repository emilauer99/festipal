---
schema_version: 1
open_count: 21
waived_count: 0
fixed_count: 2
total_count: 23
last_updated: 2026-08-09T14:33:18.123Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 03 | todo | apps/mobile/lib/i18n.ts |  | activateUiLocale calls i18n.activate() but never i18n.load()s the compiled DE/EN catalogs — Trans macro currently always falls back to English source text regardless of active locale; wire in when the first real screen lands | open |  | 2026-08-03T16:15:49.882Z |  |
| 2 | 03 | todo | apps/api/src/auth/auth.instance.ts |  | Server-side better-auth instance is missing the @better-auth/expo server plugin (plugins: [expo()]). Without it, the expo-origin header the mobile client sends is never translated to the standard origin header, so any cookie-bearing state-changing better-auth endpoint (e.g. a future sign-out) will 403 with INVALID_ORIGIN/MISSING_OR_NULL_ORIGIN. Not exercised by Phase 3's OTP-login-only scope (no logout feature planned in Plans 04-06) but must be added before any session-revocation/logout feature ships. | fixed |  | 2026-08-03T16:40:15.840Z | 2026-08-05T11:26:40.317Z |
| 3 | 04 | unrun-verify | apps/mobile/app/(auth)/email.tsx |  | Task 1 human-check not run headless: Welcome->Email->real OTP send->verify full flow on a dev build with Mailpit | open |  | 2026-08-05T09:25:44.011Z |  |
| 4 | 04 | unrun-verify | apps/mobile/app/(profile-setup)/complete-profile.tsx |  | Task 2 human-check not run headless: fresh-account username live-check + Done flow + network body {username,displayName} confirmation on a real device | open |  | 2026-08-05T09:25:51.579Z |  |
| 5 | 04 | unrun-verify | apps/mobile/app/_layout.tsx |  | AUTH-02 human-check not run headless: returning visitor with existing profile lands directly in festivals after OTP, skipping (profile-setup) | open |  | 2026-08-05T09:25:52.005Z |  |
| 6 | 04 | unrun-verify | apps/mobile/app/_layout.tsx |  | AUTH-03 human-check not run headless: session survives a real OS force-quit + relaunch (Pitfall 1 method) with no OTP re-prompt | open |  | 2026-08-05T09:25:52.450Z |  |
| 7 | 04 | unrun-verify | apps/mobile/app/(auth)/verify.tsx |  | Real-device UAT: correct code auto-submits+advances; wrong code shows unified error box + Send new code; resend countdown 60s->0 becomes tappable, double-tap-safe; Change email returns to Email; DE copy matches mockup (04-04) | open |  | 2026-08-05T09:39:54.447Z |  |
| 8 | 04 | unrun-verify | apps/mobile/app/(profile-setup)/complete-profile.tsx |  | Real-device UAT: pick from gallery + take a photo (permission prompts, both grant paths) replaces the initials tile with the circular photo; force-quit + relaunch on the same account -> photo persists via MMKV; confirm the completeProfile network body has no avatar field (04-05, D-01) | open |  | 2026-08-05T09:59:27.090Z |  |
| 9 | 04 | unrun-verify | apps/mobile/app/(profile-setup)/complete-profile.tsx |  | Real-device UAT: type a taken username -> both taken lines render ('@{username} is already taken.' + 'Try something else, like @{suggestion}.') with a verified ≤20-char suggestion; force a completeProfile 409 (two devices/tabs racing the same username) -> same taken UI + suggestion regenerates (04-05, IDN-01) | open |  | 2026-08-05T09:59:27.534Z |  |
| 10 | 04 | unrun-verify | apps/mobile/components/AvatarTile.tsx |  | Visual smoke check (UI-SPEC populated/avatar backstop): a real picked/captured photo visually replaces the initials tile correctly (circular, r-pill radius); separately, a long/multi-byte/emoji displayName does not break the avatar-tile initials derivation or the profile layout (IDN-01 encoding edge backstop) | open |  | 2026-08-05T09:59:27.980Z |  |
| 11 | 04 | unrun-verify | apps/mobile/app/festivals/index.tsx |  | Real-device UAT: tap logout icon returns to Welcome; enable airplane mode + tap logout -> still returns to Welcome (local session cleared); double-tap fast -> no double-fire/no crash (04-06, AUTH-04) | open |  | 2026-08-05T10:17:41.069Z |  |
| 12 | 04 | unrun-verify | apps/mobile/app/_layout.tsx |  | Real-device UAT: force-quit, cold deep link to festipal://festivals while logged out -> auth flow (no content leak); complete OTP + first-login profile-completion -> lands on originally-tapped route, not Home; repeat as returning user (no profile step) and warm-start (backgrounded) -> same (04-06, D-02/SC-5) | open |  | 2026-08-05T10:17:41.487Z |  |
| 13 | 04 | unrun-verify | apps/mobile/app/_layout.tsx |  | Real-device UAT: cold-start on cache-cleared install shows the dark brand wordmark splash and does not hang noticeably longer than Phase 3; simulate hung/offline API on cold start -> splash falls through to Welcome within the 8s timeout, not a deadlock (04-06, D-04) | open |  | 2026-08-05T10:17:41.899Z |  |
| 14 | 04 | unrun-verify | apps/mobile/app/_layout.tsx |  | Real-device UAT: log out, log back in, force-quit, relaunch from icon -> lands logged-in (AUTH-03 re-confirmed after this plan's guard changes: deep-link capture/consume + resolve-timeout effects, Pitfall 1) | open |  | 2026-08-05T10:17:42.311Z |  |
| 15 | 04 | todo | apps/mobile/app/(auth)/index.tsx |  | useAppFonts() was never called anywhere before 04-06 (now wired in app/_layout.tsx for the splash wordmark), so the three Google Fonts were never actually loaded; separately, Welcome/verify/complete-profile screens set fontFamily to the generic typeRoles.*.family name ('Outfit'/'Plus Jakarta Sans'/'JetBrains Mono') which does not match the specific registered font key (e.g. 'Outfit_700Bold' from lib/fonts.ts FONT_DISPLAY) — even now that fonts load, those screens still silently render in the system-font fallback. Out of 04-06's file scope (only _layout.tsx's own SplashView correctly uses resolveFontFamily); needs a follow-up pass across the restyled auth/profile screens. | fixed |  | 2026-08-05T10:17:54.878Z | 2026-08-05T11:26:46.185Z |
| 16 | 05 | unrun-verify | apps/mobile/app/(festival)/f/[festivalSlug].tsx |  | 05-03 Task 3 on-device manual UAT not run headless: enter seeded frequency-2026 festival, confirm formatted dates/place render, DE/EN toggle re-formats, wrong-slug shows error pattern with usable Back (real Android device required) | open |  | 2026-08-06T12:03:46.028Z |  |
| 17 | 05 | todo | apps/mobile/components/FloatingNav.tsx |  | DE translations missing for Home/Friends/Profile/coming-soon msgids (05-06 deferred, out of task scope) | open |  | 2026-08-06T12:37:14.059Z |  |
| 18 | 05 | unrun-verify | apps/mobile/app/(tabs)/festivals.tsx |  | 05-06 Task 1 on-device manual UAT not run headless: Festivals tab opens on Meine by default; switch to Alle -> every festival listed, saved one shows Gespeichert badge while unsaved show Save affordance; both segments render name/dates/place | open |  | 2026-08-06T12:40:21.121Z |  |
| 19 | 05 | unrun-verify | apps/mobile/app/(tabs)/festivals.tsx |  | 05-06 Task 2 on-device manual UAT not run headless: tap Save in Alle -> immediate Gespeichert + appears under Meine; survives force-quit+relaunch (FEST-03); rapid double-tap enqueues one save; simulated failing save rolls back with visible error; idempotent re-save of already-saved festival shows no error | open |  | 2026-08-06T12:40:21.575Z |  |
| 20 | 05 | unrun-verify | apps/mobile/app/(tabs)/home.tsx |  | 05-08 Task 2 on-device 8-step acceptance flow not run headless: login->Home->Alle-segment CTA->save exactly-once+persist+rollback->enter/back->cold-start-back->cross-account logout hygiene->deep-link precedence over persisted slug->DE/EN date+null-fallback+TalkBack coming-soon a11y (all six requirements + cross-plan edges); persisted as .planning/phases/05-festival-selection-home/05-UAT.md for /gsd-verify-work 5 | open |  | 2026-08-06T13:28:08.825Z |  |
| 21 | 05 | unrun-verify | apps/mobile/app/(tabs)/festivals.tsx |  | G-05-5b on-device UAT not run headlessly: enter unsaved festival, force-quit, relaunch -> Home; save+enter+relaunch -> restores festival (05-09 task 2) | open |  | 2026-08-09T14:25:57.499Z |  |
| 22 | 05 | unrun-verify | apps/mobile/lib/festival-navigation.ts |  | G-05-5a on-device UAT not run headlessly: cold-start Back -> Home tab; normal in-tab Back -> Festivals tab (05-09 task 3) | open |  | 2026-08-09T14:25:58.180Z |  |
| 23 | 05 | unrun-verify | apps/mobile/app/_layout.tsx |  | 05-UAT.md test 7: on-device deep-link verification (logged-out festipal://f/:slug double-slash, and already-authenticated cold-start festipal:///f/:slug) not run headlessly — requires real device | open |  | 2026-08-09T14:33:18.123Z |  |

````json
[
  {
    "id": 1,
    "kind": "todo",
    "phase": "03",
    "file": "apps/mobile/lib/i18n.ts",
    "line": null,
    "description": "activateUiLocale calls i18n.activate() but never i18n.load()s the compiled DE/EN catalogs — Trans macro currently always falls back to English source text regardless of active locale; wire in when the first real screen lands",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-03T16:15:49.882Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "todo",
    "phase": "03",
    "file": "apps/api/src/auth/auth.instance.ts",
    "line": null,
    "description": "Server-side better-auth instance is missing the @better-auth/expo server plugin (plugins: [expo()]). Without it, the expo-origin header the mobile client sends is never translated to the standard origin header, so any cookie-bearing state-changing better-auth endpoint (e.g. a future sign-out) will 403 with INVALID_ORIGIN/MISSING_OR_NULL_ORIGIN. Not exercised by Phase 3's OTP-login-only scope (no logout feature planned in Plans 04-06) but must be added before any session-revocation/logout feature ships.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-03T16:40:15.840Z",
    "resolved_at": "2026-08-05T11:26:40.317Z"
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/(auth)/email.tsx",
    "line": null,
    "description": "Task 1 human-check not run headless: Welcome->Email->real OTP send->verify full flow on a dev build with Mailpit",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T09:25:44.011Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/(profile-setup)/complete-profile.tsx",
    "line": null,
    "description": "Task 2 human-check not run headless: fresh-account username live-check + Done flow + network body {username,displayName} confirmation on a real device",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T09:25:51.579Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/_layout.tsx",
    "line": null,
    "description": "AUTH-02 human-check not run headless: returning visitor with existing profile lands directly in festivals after OTP, skipping (profile-setup)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T09:25:52.005Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/_layout.tsx",
    "line": null,
    "description": "AUTH-03 human-check not run headless: session survives a real OS force-quit + relaunch (Pitfall 1 method) with no OTP re-prompt",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T09:25:52.450Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/(auth)/verify.tsx",
    "line": null,
    "description": "Real-device UAT: correct code auto-submits+advances; wrong code shows unified error box + Send new code; resend countdown 60s->0 becomes tappable, double-tap-safe; Change email returns to Email; DE copy matches mockup (04-04)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T09:39:54.447Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/(profile-setup)/complete-profile.tsx",
    "line": null,
    "description": "Real-device UAT: pick from gallery + take a photo (permission prompts, both grant paths) replaces the initials tile with the circular photo; force-quit + relaunch on the same account -> photo persists via MMKV; confirm the completeProfile network body has no avatar field (04-05, D-01)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T09:59:27.090Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/(profile-setup)/complete-profile.tsx",
    "line": null,
    "description": "Real-device UAT: type a taken username -> both taken lines render ('@{username} is already taken.' + 'Try something else, like @{suggestion}.') with a verified ≤20-char suggestion; force a completeProfile 409 (two devices/tabs racing the same username) -> same taken UI + suggestion regenerates (04-05, IDN-01)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T09:59:27.534Z",
    "resolved_at": null
  },
  {
    "id": 10,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/components/AvatarTile.tsx",
    "line": null,
    "description": "Visual smoke check (UI-SPEC populated/avatar backstop): a real picked/captured photo visually replaces the initials tile correctly (circular, r-pill radius); separately, a long/multi-byte/emoji displayName does not break the avatar-tile initials derivation or the profile layout (IDN-01 encoding edge backstop)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T09:59:27.980Z",
    "resolved_at": null
  },
  {
    "id": 11,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/festivals/index.tsx",
    "line": null,
    "description": "Real-device UAT: tap logout icon returns to Welcome; enable airplane mode + tap logout -> still returns to Welcome (local session cleared); double-tap fast -> no double-fire/no crash (04-06, AUTH-04)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T10:17:41.069Z",
    "resolved_at": null
  },
  {
    "id": 12,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/_layout.tsx",
    "line": null,
    "description": "Real-device UAT: force-quit, cold deep link to festipal://festivals while logged out -> auth flow (no content leak); complete OTP + first-login profile-completion -> lands on originally-tapped route, not Home; repeat as returning user (no profile step) and warm-start (backgrounded) -> same (04-06, D-02/SC-5)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T10:17:41.487Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/_layout.tsx",
    "line": null,
    "description": "Real-device UAT: cold-start on cache-cleared install shows the dark brand wordmark splash and does not hang noticeably longer than Phase 3; simulate hung/offline API on cold start -> splash falls through to Welcome within the 8s timeout, not a deadlock (04-06, D-04)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T10:17:41.899Z",
    "resolved_at": null
  },
  {
    "id": 14,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "apps/mobile/app/_layout.tsx",
    "line": null,
    "description": "Real-device UAT: log out, log back in, force-quit, relaunch from icon -> lands logged-in (AUTH-03 re-confirmed after this plan's guard changes: deep-link capture/consume + resolve-timeout effects, Pitfall 1)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T10:17:42.311Z",
    "resolved_at": null
  },
  {
    "id": 15,
    "kind": "todo",
    "phase": "04",
    "file": "apps/mobile/app/(auth)/index.tsx",
    "line": null,
    "description": "useAppFonts() was never called anywhere before 04-06 (now wired in app/_layout.tsx for the splash wordmark), so the three Google Fonts were never actually loaded; separately, Welcome/verify/complete-profile screens set fontFamily to the generic typeRoles.*.family name ('Outfit'/'Plus Jakarta Sans'/'JetBrains Mono') which does not match the specific registered font key (e.g. 'Outfit_700Bold' from lib/fonts.ts FONT_DISPLAY) — even now that fonts load, those screens still silently render in the system-font fallback. Out of 04-06's file scope (only _layout.tsx's own SplashView correctly uses resolveFontFamily); needs a follow-up pass across the restyled auth/profile screens.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-05T10:17:54.878Z",
    "resolved_at": "2026-08-05T11:26:46.185Z"
  },
  {
    "id": 16,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "apps/mobile/app/(festival)/f/[festivalSlug].tsx",
    "line": null,
    "description": "05-03 Task 3 on-device manual UAT not run headless: enter seeded frequency-2026 festival, confirm formatted dates/place render, DE/EN toggle re-formats, wrong-slug shows error pattern with usable Back (real Android device required)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-06T12:03:46.028Z",
    "resolved_at": null
  },
  {
    "id": 17,
    "kind": "todo",
    "phase": "05",
    "file": "apps/mobile/components/FloatingNav.tsx",
    "line": null,
    "description": "DE translations missing for Home/Friends/Profile/coming-soon msgids (05-06 deferred, out of task scope)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-06T12:37:14.059Z",
    "resolved_at": null
  },
  {
    "id": 18,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "apps/mobile/app/(tabs)/festivals.tsx",
    "line": null,
    "description": "05-06 Task 1 on-device manual UAT not run headless: Festivals tab opens on Meine by default; switch to Alle -> every festival listed, saved one shows Gespeichert badge while unsaved show Save affordance; both segments render name/dates/place",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-06T12:40:21.121Z",
    "resolved_at": null
  },
  {
    "id": 19,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "apps/mobile/app/(tabs)/festivals.tsx",
    "line": null,
    "description": "05-06 Task 2 on-device manual UAT not run headless: tap Save in Alle -> immediate Gespeichert + appears under Meine; survives force-quit+relaunch (FEST-03); rapid double-tap enqueues one save; simulated failing save rolls back with visible error; idempotent re-save of already-saved festival shows no error",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-06T12:40:21.575Z",
    "resolved_at": null
  },
  {
    "id": 20,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "apps/mobile/app/(tabs)/home.tsx",
    "line": null,
    "description": "05-08 Task 2 on-device 8-step acceptance flow not run headless: login->Home->Alle-segment CTA->save exactly-once+persist+rollback->enter/back->cold-start-back->cross-account logout hygiene->deep-link precedence over persisted slug->DE/EN date+null-fallback+TalkBack coming-soon a11y (all six requirements + cross-plan edges); persisted as .planning/phases/05-festival-selection-home/05-UAT.md for /gsd-verify-work 5",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-06T13:28:08.825Z",
    "resolved_at": null
  },
  {
    "id": 21,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "apps/mobile/app/(tabs)/festivals.tsx",
    "line": null,
    "description": "G-05-5b on-device UAT not run headlessly: enter unsaved festival, force-quit, relaunch -> Home; save+enter+relaunch -> restores festival (05-09 task 2)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-09T14:25:57.499Z",
    "resolved_at": null
  },
  {
    "id": 22,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "apps/mobile/lib/festival-navigation.ts",
    "line": null,
    "description": "G-05-5a on-device UAT not run headlessly: cold-start Back -> Home tab; normal in-tab Back -> Festivals tab (05-09 task 3)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-09T14:25:58.180Z",
    "resolved_at": null
  },
  {
    "id": 23,
    "kind": "unrun-verify",
    "phase": "05",
    "file": "apps/mobile/app/_layout.tsx",
    "line": null,
    "description": "05-UAT.md test 7: on-device deep-link verification (logged-out festipal://f/:slug double-slash, and already-authenticated cold-start festipal:///f/:slug) not run headlessly — requires real device",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-09T14:33:18.123Z",
    "resolved_at": null
  }
]
````
