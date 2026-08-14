---
schema_version: 1
open_count: 28
waived_count: 3
fixed_count: 10
total_count: 41
last_updated: 2026-08-14T08:52:05.535Z
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
| 17 | 05 | todo | apps/mobile/components/FloatingNav.tsx |  | DE translations missing for Home/Friends/Profile/coming-soon msgids (05-06 deferred, out of task scope) | fixed |  | 2026-08-06T12:37:14.059Z | 2026-08-10T21:34:39.942Z |
| 18 | 05 | unrun-verify | apps/mobile/app/(tabs)/festivals.tsx |  | 05-06 Task 1 on-device manual UAT not run headless: Festivals tab opens on Meine by default; switch to Alle -> every festival listed, saved one shows Gespeichert badge while unsaved show Save affordance; both segments render name/dates/place | open |  | 2026-08-06T12:40:21.121Z |  |
| 19 | 05 | unrun-verify | apps/mobile/app/(tabs)/festivals.tsx |  | 05-06 Task 2 on-device manual UAT not run headless: tap Save in Alle -> immediate Gespeichert + appears under Meine; survives force-quit+relaunch (FEST-03); rapid double-tap enqueues one save; simulated failing save rolls back with visible error; idempotent re-save of already-saved festival shows no error | open |  | 2026-08-06T12:40:21.575Z |  |
| 20 | 05 | unrun-verify | apps/mobile/app/(tabs)/home.tsx |  | 05-08 Task 2 on-device 8-step acceptance flow not run headless: login->Home->Alle-segment CTA->save exactly-once+persist+rollback->enter/back->cold-start-back->cross-account logout hygiene->deep-link precedence over persisted slug->DE/EN date+null-fallback+TalkBack coming-soon a11y (all six requirements + cross-plan edges); persisted as .planning/phases/05-festival-selection-home/05-UAT.md for /gsd-verify-work 5 | open |  | 2026-08-06T13:28:08.825Z |  |
| 21 | 05 | unrun-verify | apps/mobile/app/(tabs)/festivals.tsx |  | G-05-5b on-device UAT not run headlessly: enter unsaved festival, force-quit, relaunch -> Home; save+enter+relaunch -> restores festival (05-09 task 2) | open |  | 2026-08-09T14:25:57.499Z |  |
| 22 | 05 | unrun-verify | apps/mobile/lib/festival-navigation.ts |  | G-05-5a on-device UAT not run headlessly: cold-start Back -> Home tab; normal in-tab Back -> Festivals tab (05-09 task 3) | open |  | 2026-08-09T14:25:58.180Z |  |
| 23 | 05 | unrun-verify | apps/mobile/app/_layout.tsx |  | 05-UAT.md test 7: on-device deep-link verification (logged-out festipal://f/:slug double-slash, and already-authenticated cold-start festipal:///f/:slug) not run headlessly — requires real device | open |  | 2026-08-09T14:33:18.123Z |  |
| 24 | 05.1 | unrun-verify | docker-compose.yml |  | Plan 05.1-01 acceptance criterion 'zero festipal hits outside .planning/docs/lockfile' is unmet by exactly one file: docker-compose.yml, owned by plan 05.1-02. Rename is only complete after 05.1-02 runs. | fixed | Geschlossen durch den automatisierten Leftover-Sweep in 05.1-07 Task 1 (git grep -l -i festipal ausserhalb .planning/docs/lockfile = 0 Treffer), nachdem Plan 05.1-02 docker-compose.yml umbenannt hat. Schliessender Nachweis ist eine automatisierte Pruefung, keine Geraeteabnahme. | 2026-08-10T20:57:29.452Z | 2026-08-11T11:54:06.105Z |
| 25 | 05.1 | deviation | apps/mobile/lib/fonts.ts |  | otpDigit/countdown declare weight 500 but load JetBrainsMono_400Regular — pre-existing gap, scoped out by UI-SPEC D-10, needs its own device acceptance | open | BLEIBT OFFEN: die Geraeteabnahme in 05.1-07 deckt diesen Punkt nicht ab. Checkpoint-Punkt 16 prueft Ueberschriftengroesse und faux-bold, nennt die Mono-Rollen (otpDigit/countdown) aber nicht; die 500-vs-400-Luecke ist per UI-SPEC D-10 ausdruecklich aus dieser Phase herausgehalten und braucht ihre eigene Abnahme. | 2026-08-10T21:14:08.388Z |  |
| 26 | 05.1 | unrun-verify | apps/mobile/components/FestivalCard.tsx |  | 05.1-04 Task 2: the new react-native-svg Sunset layer on the hero card has never been rendered on a device — that the gradient paints behind the card content (not over it), stays clipped to r-card, and carries legible Ink text at every point is an on-device claim this plan does not make; owned by plan 05.1-07 | fixed | Geschlossen auf Basis der Geraeteabnahme in 05.1-07 Task 2 (Checkpoint-Punkt 12, Sunset-Hero). Der User hat die Abnahme als Ganzes freigegeben; schliessender Nachweis ist diese Nutzerabnahme am Geraet, keine automatisierte Pruefung. | 2026-08-10T21:39:45.181Z | 2026-08-11T11:54:06.729Z |
| 27 | 05.1 | unrun-verify | apps/mobile/app/(tabs)/festivals.tsx |  | 05.1-05: die acht Screens wurden nie auf einem Gerät im Hellmodus gerendert — dass Papier als Fläche trägt, dass dangerText-Fehlerkopie auf Papier lesbar ist und dass die jetzt rollenaufgelösten Schriften (title3-CTAs = Jakarta 700 statt faux-bold 400, display2-Festivalname = Outfit 800 statt 700) korrekt und nicht zu schwer wirken, ist eine Geräteaussage; Abnahme gehört Plan 05.1-07 | fixed | Geschlossen auf Basis der Geraeteabnahme in 05.1-07 Task 2 (Punkte 8/9/15/16: alle Screens in Hell- und Dunkelmodus, erzwungene Fehlerkopie, Typografie). Der User hat die Abnahme als Ganzes freigegeben; schliessender Nachweis ist diese Nutzerabnahme am Geraet, keine automatisierte Pruefung. | 2026-08-10T21:53:55.129Z | 2026-08-11T11:54:07.424Z |
| 28 | 05.1 | unrun-verify | apps/mobile/assets/icon.png |  | 05.1-06: die sechs regenerierten App-Icons wurden nie in einem echten Launcher/Springboard gesehen — ob der Foreground im Android-Adaptive-Masking (Kreis/Squircle) unbeschnitten bleibt (RESEARCH A1: Safe-Zone-Prozentsatz unverifiziert), ob der Monochrome-Layer unter Androids Themed-Icons-Tint trägt und ob die Sunset-Marke auf Papier im Launcher-Raster liest, ist eine Geräteaussage; braucht expo prebuild/Rebuild, Abnahme gehört Plan 05.1-07 | fixed | Geschlossen auf Basis der Geraeteabnahme in 05.1-07 Task 2 (Punkte 18/19: Launcher-Icon, Android-Adaptive-Masking in mehreren Formen, Recents/Settings) - damit ist die RESEARCH-A1-Safe-Zone-Annahme geklaert. Der nicht abgedeckte Teilanspruch (Monochrome-Layer unter Androids Themed Icons) laeuft als eigener offener Eintrag 30 weiter. Schliessender Nachweis ist die Nutzerabnahme am Geraet. | 2026-08-10T22:10:53.619Z | 2026-08-11T11:54:08.079Z |
| 29 | 05.1 | unrun-verify | apps/mobile/app/_layout.tsx |  | 05.1-06: der WordmarkGlyph-Mount auf dem Splash wurde nie auf einem Gerät gerendert — ob der Font-Gate-Frame beim Outfit-Nachladen sichtbar springt, ob die Marke über der Wortmarke proportional wirkt und ob der Mount überhaupt gewollt ist (geflaggte Planannahme: UI-SPEC E2 vs CONTEXT.md D-02), entscheidet der Entwickler-Checkpoint in Plan 05.1-07 | fixed | Geschlossen auf Basis der Geraeteabnahme in 05.1-07 Task 2 (Punkte 10/11). Der User hat die Abnahme als Ganzes freigegeben und entschieden, die Markenglyphe ueber der Splash-Wortmarke ZU BEHALTEN; ein Entfernen bleibt ein Einzeiler. Schliessender Nachweis ist diese Nutzerabnahme am Geraet. | 2026-08-10T22:10:54.014Z | 2026-08-11T11:54:08.803Z |
| 30 | 05.1 | unrun-verify | apps/mobile/assets/android-icon-monochrome.png |  | Der Monochrome-Layer unter Androids Themed-Icons-Tint wurde von der Geraeteabnahme in 05.1-07 NICHT abgedeckt: die Checkpoint-Punkte 18/19 nennen Launcher-Icon, Adaptive-Masking und Recents/Settings, aber nicht die aktivierten Themed Icons. Restanspruch aus dem geschlossenen Eintrag 28 - braucht einen eigenen Blick mit eingeschalteten Themed Icons. | open |  | 2026-08-11T11:54:19.017Z |  |
| 31 | 05.1 | unrun-verify | apps/mobile/app/(auth)/welcome.tsx |  | Das CI-Outfit-Tracking (typeRoles wordmark/display2/title2 letterSpacing) wurde in Quick-Task 260811-jz6 an allen 13 Style-Sites angewandt und headless abgesichert (Node/Vitest-Guard scannt app+components), aber NIE auf einem Geraet gesehen. Offen ist die reine Geraeteaussage: ob das engere Tracking auf Wortmarke, Display- und Titel-Zeilen Umbrueche kippt, Kartenhoehen (FestivalCard-Hero) oder die Splash-Wortmarke sichtbar verschiebt, und ob die zentrierten AvatarTile-Initialen durch das Tracking hinter dem letzten Zeichen sichtbar aus der Mitte laufen. Braucht einen Blick auf echten Screens in hell UND dunkel. | open |  | 2026-08-11T12:41:00.855Z |  |
| 32 | 06 | deviation | packages/contracts/src/schemas.ts |  | T-06-06 accepted: visitorProfilePublicSchema carries birthDate/gender with no visibility policy; split into owner view and friend view before any endpoint serves a foreign profile (IDN-02 pending) | fixed | Discharged by phase 07-01: visitorProfilePublicSchema no longer exists. Split into visitorProfileForeignSchema (base, six fields) and visitorProfileOwnerSchema (= foreign + birthDate), both composed from visitorProfileSelectSchema via .pick(). Phase 07-05 pins the split with a VIS-02 single-code-path invariant test. IDN-02 (Flinta filter, age policy) remains a separate, open concern. | 2026-08-11T21:07:42.033Z | 2026-08-12T17:30:00.000Z |
| 33 | 6 | unrun-verify | apps/mobile/lib/theme-override-storage.ts |  | 06-03: Der Pfad 'gespeicherter Override wird beim Neustart zurueckgelesen' ist unter dem node-env-Runner nicht ausfuehrbar (MMKV laedt dort nicht) — erst am Geraet pruefbar, sobald 06-05 den Dark-Mode-Schalter gebaut hat | waived | Geschlossen ueber die Geraeteabnahme von 06-09 Task 3 (33 durch Punkt 7, 34/35 durch die Punkte 15-17). Die Freigabe erfolgte als pauschales 'approved' des Users ueber alle 18 Punkte — es liegen KEINE Einzelbefunde je Punkt vor und der Executor hat den Geraetetest nicht selbst gefahren. Schliessung ruht auf menschlicher Pauschalabnahme, nicht auf itemisierter Evidenz. | 2026-08-11T21:20:19.955Z | 2026-08-12T09:28:02.510Z |
| 34 | 06 | unrun-verify | apps/mobile/app/(profile-setup)/complete-profile.tsx |  | 06-08: native Picker-Darstellung (Android-Dialog / iOS-Spinner) ist ungeprueft — node-env vitest rendert keine RN-Komponenten; braucht 'npx expo run:android' aus apps/mobile | waived | Geschlossen ueber die Geraeteabnahme von 06-09 Task 3 (33 durch Punkt 7, 34/35 durch die Punkte 15-17). Die Freigabe erfolgte als pauschales 'approved' des Users ueber alle 18 Punkte — es liegen KEINE Einzelbefunde je Punkt vor und der Executor hat den Geraetetest nicht selbst gefahren. Schliessung ruht auf menschlicher Pauschalabnahme, nicht auf itemisierter Evidenz. | 2026-08-11T23:20:45.525Z | 2026-08-12T09:28:03.369Z |
| 35 | 06 | unrun-verify | apps/mobile/app/(profile-setup)/complete-profile.tsx |  | 06-08: toLocalDateOnly() hat keinen Unit-Test — liegt per Akzeptanzkriterium in Screen-Code, den der node-env-Runner nicht importieren kann | waived | Geschlossen ueber die Geraeteabnahme von 06-09 Task 3 (33 durch Punkt 7, 34/35 durch die Punkte 15-17). Die Freigabe erfolgte als pauschales 'approved' des Users ueber alle 18 Punkte — es liegen KEINE Einzelbefunde je Punkt vor und der Executor hat den Geraetetest nicht selbst gefahren. Schliessung ruht auf menschlicher Pauschalabnahme, nicht auf itemisierter Evidenz. | 2026-08-11T23:20:45.929Z | 2026-08-12T09:28:04.240Z |
| 36 | 06 | stub | apps/mobile/app/(tabs)/friends.tsx |  | Friends-Screen: Suchfeld, Anfragen, Chats, Crew, Vorschlaege und QR sind bewusste Platzhalter ohne Datenquelle (D-11) — aufgeloest durch FRND-02 bzw. das Realtime-Gateway | open |  | 2026-08-11T23:45:01.968Z |  |
| 37 | 06 | stub | apps/mobile/app/profil.tsx |  | Profil-Ausblick-Bloecke ohne Backing: Adden-Code-Karte, Socials, Vibe, Stat-Kacheln (D-02, gedaempft + Bald-Badge) | open |  | 2026-08-12T00:02:55.728Z |  |
| 38 | 06 | unrun-verify | apps/mobile/app/(tabs)/mehr.tsx |  | 06-09 Task 3: Die Geraeteabnahme der GESAMTEN Phase 6 (18 Punkte: vier Tabs, Friends-Leerzustaende, Mehr inkl. echtem Dark-Mode ueber Force-Quit, SafeNow-Distanzierungssatz in DE+EN ungekuerzt, Abmelde-Rueckfrage, Profil-Sunset-Ring und Identitaetszeile, drei neue optionale Felder mit Datums-Picker, Sprachdurchlauf auf Englisch) ist NICHT gelaufen. Der node-env-Vitest-Runner rendert keine RN-Komponenten. Vorher noetig: 'npx expo run:android' aus apps/mobile (06-08 brachte @react-native-community/datetimepicker mit nativem Code). Schliessen, sobald der Checkpoint von 06-09 Task 3 abgenommen ist. | fixed |  | 2026-08-12T00:13:36.212Z | 2026-08-12T09:28:01.642Z |
| 39 | 7 | deviation | apps/api/src/friendship/friendship.service.ts |  | 07-03: Akzeptanzkriterium verlangt grep -c db.transaction >= 3, tatsaechlich 2 — sealFriendship ist von accept und auto-accept geteilt; Absicht (drei atomare Uebergaenge) erfuellt, Zaehlung bewusst nicht | open |  | 2026-08-12T15:56:38.397Z |  |
| 40 | 09 | unrun-verify | apps/mobile/components/PlaceholderScreen.tsx |  | 09-03 Task 2 human-check not run on device: icon/heading/body per tab, no spinner/badge/date-promise, max system font scale (scrolls not clips), EN locale strings, five-tab bar visual consistency. Deferred by explicit user instruction to complete the plan; automated verify (typecheck/lint/vitest/lingui) passed. | open |  | 2026-08-14T08:51:59.963Z |  |
| 41 | 09 | stub | apps/mobile/app/(festival)/f/[festivalSlug]/friends.tsx |  | Festival Friends tab is a registered route with a temporary 'This tab isn't built yet.' placeholder — real content (D-15..D-18, FRND-07 UI) lands in 09-05. | open |  | 2026-08-14T08:52:05.535Z |  |

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
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-06T12:37:14.059Z",
    "resolved_at": "2026-08-10T21:34:39.942Z"
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
  },
  {
    "id": 24,
    "kind": "unrun-verify",
    "phase": "05.1",
    "file": "docker-compose.yml",
    "line": null,
    "description": "Plan 05.1-01 acceptance criterion 'zero festipal hits outside .planning/docs/lockfile' is unmet by exactly one file: docker-compose.yml, owned by plan 05.1-02. Rename is only complete after 05.1-02 runs.",
    "status": "fixed",
    "reason": "Geschlossen durch den automatisierten Leftover-Sweep in 05.1-07 Task 1 (git grep -l -i festipal ausserhalb .planning/docs/lockfile = 0 Treffer), nachdem Plan 05.1-02 docker-compose.yml umbenannt hat. Schliessender Nachweis ist eine automatisierte Pruefung, keine Geraeteabnahme.",
    "recorded_at": "2026-08-10T20:57:29.452Z",
    "resolved_at": "2026-08-11T11:54:06.105Z"
  },
  {
    "id": 25,
    "kind": "deviation",
    "phase": "05.1",
    "file": "apps/mobile/lib/fonts.ts",
    "line": null,
    "description": "otpDigit/countdown declare weight 500 but load JetBrainsMono_400Regular — pre-existing gap, scoped out by UI-SPEC D-10, needs its own device acceptance",
    "status": "open",
    "reason": "BLEIBT OFFEN: die Geraeteabnahme in 05.1-07 deckt diesen Punkt nicht ab. Checkpoint-Punkt 16 prueft Ueberschriftengroesse und faux-bold, nennt die Mono-Rollen (otpDigit/countdown) aber nicht; die 500-vs-400-Luecke ist per UI-SPEC D-10 ausdruecklich aus dieser Phase herausgehalten und braucht ihre eigene Abnahme.",
    "recorded_at": "2026-08-10T21:14:08.388Z",
    "resolved_at": null
  },
  {
    "id": 26,
    "kind": "unrun-verify",
    "phase": "05.1",
    "file": "apps/mobile/components/FestivalCard.tsx",
    "line": null,
    "description": "05.1-04 Task 2: the new react-native-svg Sunset layer on the hero card has never been rendered on a device — that the gradient paints behind the card content (not over it), stays clipped to r-card, and carries legible Ink text at every point is an on-device claim this plan does not make; owned by plan 05.1-07",
    "status": "fixed",
    "reason": "Geschlossen auf Basis der Geraeteabnahme in 05.1-07 Task 2 (Checkpoint-Punkt 12, Sunset-Hero). Der User hat die Abnahme als Ganzes freigegeben; schliessender Nachweis ist diese Nutzerabnahme am Geraet, keine automatisierte Pruefung.",
    "recorded_at": "2026-08-10T21:39:45.181Z",
    "resolved_at": "2026-08-11T11:54:06.729Z"
  },
  {
    "id": 27,
    "kind": "unrun-verify",
    "phase": "05.1",
    "file": "apps/mobile/app/(tabs)/festivals.tsx",
    "line": null,
    "description": "05.1-05: die acht Screens wurden nie auf einem Gerät im Hellmodus gerendert — dass Papier als Fläche trägt, dass dangerText-Fehlerkopie auf Papier lesbar ist und dass die jetzt rollenaufgelösten Schriften (title3-CTAs = Jakarta 700 statt faux-bold 400, display2-Festivalname = Outfit 800 statt 700) korrekt und nicht zu schwer wirken, ist eine Geräteaussage; Abnahme gehört Plan 05.1-07",
    "status": "fixed",
    "reason": "Geschlossen auf Basis der Geraeteabnahme in 05.1-07 Task 2 (Punkte 8/9/15/16: alle Screens in Hell- und Dunkelmodus, erzwungene Fehlerkopie, Typografie). Der User hat die Abnahme als Ganzes freigegeben; schliessender Nachweis ist diese Nutzerabnahme am Geraet, keine automatisierte Pruefung.",
    "recorded_at": "2026-08-10T21:53:55.129Z",
    "resolved_at": "2026-08-11T11:54:07.424Z"
  },
  {
    "id": 28,
    "kind": "unrun-verify",
    "phase": "05.1",
    "file": "apps/mobile/assets/icon.png",
    "line": null,
    "description": "05.1-06: die sechs regenerierten App-Icons wurden nie in einem echten Launcher/Springboard gesehen — ob der Foreground im Android-Adaptive-Masking (Kreis/Squircle) unbeschnitten bleibt (RESEARCH A1: Safe-Zone-Prozentsatz unverifiziert), ob der Monochrome-Layer unter Androids Themed-Icons-Tint trägt und ob die Sunset-Marke auf Papier im Launcher-Raster liest, ist eine Geräteaussage; braucht expo prebuild/Rebuild, Abnahme gehört Plan 05.1-07",
    "status": "fixed",
    "reason": "Geschlossen auf Basis der Geraeteabnahme in 05.1-07 Task 2 (Punkte 18/19: Launcher-Icon, Android-Adaptive-Masking in mehreren Formen, Recents/Settings) - damit ist die RESEARCH-A1-Safe-Zone-Annahme geklaert. Der nicht abgedeckte Teilanspruch (Monochrome-Layer unter Androids Themed Icons) laeuft als eigener offener Eintrag 30 weiter. Schliessender Nachweis ist die Nutzerabnahme am Geraet.",
    "recorded_at": "2026-08-10T22:10:53.619Z",
    "resolved_at": "2026-08-11T11:54:08.079Z"
  },
  {
    "id": 29,
    "kind": "unrun-verify",
    "phase": "05.1",
    "file": "apps/mobile/app/_layout.tsx",
    "line": null,
    "description": "05.1-06: der WordmarkGlyph-Mount auf dem Splash wurde nie auf einem Gerät gerendert — ob der Font-Gate-Frame beim Outfit-Nachladen sichtbar springt, ob die Marke über der Wortmarke proportional wirkt und ob der Mount überhaupt gewollt ist (geflaggte Planannahme: UI-SPEC E2 vs CONTEXT.md D-02), entscheidet der Entwickler-Checkpoint in Plan 05.1-07",
    "status": "fixed",
    "reason": "Geschlossen auf Basis der Geraeteabnahme in 05.1-07 Task 2 (Punkte 10/11). Der User hat die Abnahme als Ganzes freigegeben und entschieden, die Markenglyphe ueber der Splash-Wortmarke ZU BEHALTEN; ein Entfernen bleibt ein Einzeiler. Schliessender Nachweis ist diese Nutzerabnahme am Geraet.",
    "recorded_at": "2026-08-10T22:10:54.014Z",
    "resolved_at": "2026-08-11T11:54:08.803Z"
  },
  {
    "id": 30,
    "kind": "unrun-verify",
    "phase": "05.1",
    "file": "apps/mobile/assets/android-icon-monochrome.png",
    "line": null,
    "description": "Der Monochrome-Layer unter Androids Themed-Icons-Tint wurde von der Geraeteabnahme in 05.1-07 NICHT abgedeckt: die Checkpoint-Punkte 18/19 nennen Launcher-Icon, Adaptive-Masking und Recents/Settings, aber nicht die aktivierten Themed Icons. Restanspruch aus dem geschlossenen Eintrag 28 - braucht einen eigenen Blick mit eingeschalteten Themed Icons.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-11T11:54:19.017Z",
    "resolved_at": null
  },
  {
    "id": 31,
    "kind": "unrun-verify",
    "phase": "05.1",
    "file": "apps/mobile/app/(auth)/welcome.tsx",
    "line": null,
    "description": "Das CI-Outfit-Tracking (typeRoles wordmark/display2/title2 letterSpacing) wurde in Quick-Task 260811-jz6 an allen 13 Style-Sites angewandt und headless abgesichert (Node/Vitest-Guard scannt app+components), aber NIE auf einem Geraet gesehen. Offen ist die reine Geraeteaussage: ob das engere Tracking auf Wortmarke, Display- und Titel-Zeilen Umbrueche kippt, Kartenhoehen (FestivalCard-Hero) oder die Splash-Wortmarke sichtbar verschiebt, und ob die zentrierten AvatarTile-Initialen durch das Tracking hinter dem letzten Zeichen sichtbar aus der Mitte laufen. Braucht einen Blick auf echten Screens in hell UND dunkel.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-11T12:41:00.855Z",
    "resolved_at": null
  },
  {
    "id": 32,
    "kind": "deviation",
    "phase": "06",
    "file": "packages/contracts/src/schemas.ts",
    "line": null,
    "description": "T-06-06 accepted: visitorProfilePublicSchema carries birthDate/gender with no visibility policy; split into owner view and friend view before any endpoint serves a foreign profile (IDN-02 pending)",
    "status": "fixed",
    "reason": "Discharged by phase 07-01: visitorProfilePublicSchema no longer exists. Split into visitorProfileForeignSchema (base, six fields) and visitorProfileOwnerSchema (= foreign + birthDate), both composed from visitorProfileSelectSchema via .pick(). Phase 07-05 pins the split with a VIS-02 single-code-path invariant test. IDN-02 (Flinta filter, age policy) remains a separate, open concern.",
    "recorded_at": "2026-08-11T21:07:42.033Z",
    "resolved_at": "2026-08-12T17:30:00.000Z"
  },
  {
    "id": 33,
    "kind": "unrun-verify",
    "phase": "6",
    "file": "apps/mobile/lib/theme-override-storage.ts",
    "line": null,
    "description": "06-03: Der Pfad 'gespeicherter Override wird beim Neustart zurueckgelesen' ist unter dem node-env-Runner nicht ausfuehrbar (MMKV laedt dort nicht) — erst am Geraet pruefbar, sobald 06-05 den Dark-Mode-Schalter gebaut hat",
    "status": "waived",
    "reason": "Geschlossen ueber die Geraeteabnahme von 06-09 Task 3 (33 durch Punkt 7, 34/35 durch die Punkte 15-17). Die Freigabe erfolgte als pauschales 'approved' des Users ueber alle 18 Punkte — es liegen KEINE Einzelbefunde je Punkt vor und der Executor hat den Geraetetest nicht selbst gefahren. Schliessung ruht auf menschlicher Pauschalabnahme, nicht auf itemisierter Evidenz.",
    "recorded_at": "2026-08-11T21:20:19.955Z",
    "resolved_at": "2026-08-12T09:28:02.510Z"
  },
  {
    "id": 34,
    "kind": "unrun-verify",
    "phase": "06",
    "file": "apps/mobile/app/(profile-setup)/complete-profile.tsx",
    "line": null,
    "description": "06-08: native Picker-Darstellung (Android-Dialog / iOS-Spinner) ist ungeprueft — node-env vitest rendert keine RN-Komponenten; braucht 'npx expo run:android' aus apps/mobile",
    "status": "waived",
    "reason": "Geschlossen ueber die Geraeteabnahme von 06-09 Task 3 (33 durch Punkt 7, 34/35 durch die Punkte 15-17). Die Freigabe erfolgte als pauschales 'approved' des Users ueber alle 18 Punkte — es liegen KEINE Einzelbefunde je Punkt vor und der Executor hat den Geraetetest nicht selbst gefahren. Schliessung ruht auf menschlicher Pauschalabnahme, nicht auf itemisierter Evidenz.",
    "recorded_at": "2026-08-11T23:20:45.525Z",
    "resolved_at": "2026-08-12T09:28:03.369Z"
  },
  {
    "id": 35,
    "kind": "unrun-verify",
    "phase": "06",
    "file": "apps/mobile/app/(profile-setup)/complete-profile.tsx",
    "line": null,
    "description": "06-08: toLocalDateOnly() hat keinen Unit-Test — liegt per Akzeptanzkriterium in Screen-Code, den der node-env-Runner nicht importieren kann",
    "status": "waived",
    "reason": "Geschlossen ueber die Geraeteabnahme von 06-09 Task 3 (33 durch Punkt 7, 34/35 durch die Punkte 15-17). Die Freigabe erfolgte als pauschales 'approved' des Users ueber alle 18 Punkte — es liegen KEINE Einzelbefunde je Punkt vor und der Executor hat den Geraetetest nicht selbst gefahren. Schliessung ruht auf menschlicher Pauschalabnahme, nicht auf itemisierter Evidenz.",
    "recorded_at": "2026-08-11T23:20:45.929Z",
    "resolved_at": "2026-08-12T09:28:04.240Z"
  },
  {
    "id": 36,
    "kind": "stub",
    "phase": "06",
    "file": "apps/mobile/app/(tabs)/friends.tsx",
    "line": null,
    "description": "Friends-Screen: Suchfeld, Anfragen, Chats, Crew, Vorschlaege und QR sind bewusste Platzhalter ohne Datenquelle (D-11) — aufgeloest durch FRND-02 bzw. das Realtime-Gateway",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-11T23:45:01.968Z",
    "resolved_at": null
  },
  {
    "id": 37,
    "kind": "stub",
    "phase": "06",
    "file": "apps/mobile/app/profil.tsx",
    "line": null,
    "description": "Profil-Ausblick-Bloecke ohne Backing: Adden-Code-Karte, Socials, Vibe, Stat-Kacheln (D-02, gedaempft + Bald-Badge)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-12T00:02:55.728Z",
    "resolved_at": null
  },
  {
    "id": 38,
    "kind": "unrun-verify",
    "phase": "06",
    "file": "apps/mobile/app/(tabs)/mehr.tsx",
    "line": null,
    "description": "06-09 Task 3: Die Geraeteabnahme der GESAMTEN Phase 6 (18 Punkte: vier Tabs, Friends-Leerzustaende, Mehr inkl. echtem Dark-Mode ueber Force-Quit, SafeNow-Distanzierungssatz in DE+EN ungekuerzt, Abmelde-Rueckfrage, Profil-Sunset-Ring und Identitaetszeile, drei neue optionale Felder mit Datums-Picker, Sprachdurchlauf auf Englisch) ist NICHT gelaufen. Der node-env-Vitest-Runner rendert keine RN-Komponenten. Vorher noetig: 'npx expo run:android' aus apps/mobile (06-08 brachte @react-native-community/datetimepicker mit nativem Code). Schliessen, sobald der Checkpoint von 06-09 Task 3 abgenommen ist.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-12T00:13:36.212Z",
    "resolved_at": "2026-08-12T09:28:01.642Z"
  },
  {
    "id": 39,
    "kind": "deviation",
    "phase": "7",
    "file": "apps/api/src/friendship/friendship.service.ts",
    "line": null,
    "description": "07-03: Akzeptanzkriterium verlangt grep -c db.transaction >= 3, tatsaechlich 2 — sealFriendship ist von accept und auto-accept geteilt; Absicht (drei atomare Uebergaenge) erfuellt, Zaehlung bewusst nicht",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-12T15:56:38.397Z",
    "resolved_at": null
  },
  {
    "id": 40,
    "kind": "unrun-verify",
    "phase": "09",
    "file": "apps/mobile/components/PlaceholderScreen.tsx",
    "line": null,
    "description": "09-03 Task 2 human-check not run on device: icon/heading/body per tab, no spinner/badge/date-promise, max system font scale (scrolls not clips), EN locale strings, five-tab bar visual consistency. Deferred by explicit user instruction to complete the plan; automated verify (typecheck/lint/vitest/lingui) passed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T08:51:59.963Z",
    "resolved_at": null
  },
  {
    "id": 41,
    "kind": "stub",
    "phase": "09",
    "file": "apps/mobile/app/(festival)/f/[festivalSlug]/friends.tsx",
    "line": null,
    "description": "Festival Friends tab is a registered route with a temporary 'This tab isn't built yet.' placeholder — real content (D-15..D-18, FRND-07 UI) lands in 09-05.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-14T08:52:05.535Z",
    "resolved_at": null
  }
]
````
