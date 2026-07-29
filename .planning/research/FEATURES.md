# Feature Research

**Domain:** Festival app — visitor shell slice (welcome/auth → festival picker → festival home → profile/friends stubs)
**Researched:** 2026-07-29
**Confidence:** MEDIUM (general onboarding/UX/empty-state findings cross-checked across multiple independent web sources but LOW-tier individually per source; festival-specific navigation/domain model is HIGH — sourced directly from the project's own approved design (`docs/concept/01-design-analysis.md`, `03-design-system.md`), which is the load-bearing source for this scope)

## Scope Note

This is deliberately narrow: the "visitor shell" — welcome → register/login → pick a festival → festival home with a basic overview, plus placeholder Profile and Friends. It does **not** re-scope timetable, map, news, cashless, swap marketplace, or real social — those are later phases per `PROJECT.md` Out of Scope. Where a feature would balloon the shell, it's flagged explicitly.

A key finding: **the festival-selection UX question is already answered by the project's own approved design**, not a generic pattern to invent. Section 1 of `01-design-analysis.md` documents a "Global Shell vs. In-Festival" context switch (`festival = null` vs `festival` set) with explicit `openFestival(fest)` / `goHome()` transitions. This is functionally the same pattern as a SaaS "workspace switcher" (one session, switch active org/context in-session, switcher UI in the nav) — confirmed by general UX research below — so the shell should build the minimal version of *that* pattern, not invent a new one.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = the shell feels broken, not "MVP."

| Feature | Screen Area | Why Expected | Complexity | Notes |
|---------|-------------|---------------|------------|-------|
| Email/password registration + login | Welcome/Auth | Baseline expectation for any account-gated app; user already decided as email/password-only for v1 (ADR-decided, no OAuth) | MEDIUM | better-auth wiring + `user` table are currently absent — this is the primary blocker (`PROJECT.md` Context). Minimal fields only: email + password (+ maybe display name). Don't add phone, birthday, marketing opt-in, etc. |
| Inline validation + clear error states (wrong password, email taken, weak password) | Welcome/Auth | Forms without live feedback feel unfinished; silent failures erode trust immediately at the first screen a user sees | LOW-MEDIUM | Reuse `Input` component from design system; map better-auth error codes to plain-language copy per the Voice guide (Du-form, short, concrete) |
| Session persistence (stay logged in on reopen) | Welcome/Auth | Explicitly required by `PROJECT.md`; re-login on every app open is a top reason users abandon apps | LOW-MEDIUM | Standard token/cookie persistence via better-auth + secure storage (Expo SecureStore). Online-assumed this slice, so no offline-token refresh edge cases needed yet |
| Logout | Profile stub | Users expect a visible way out of their account; its absence reads as a dead-end/bug | LOW | Already in the approved design (`Profil` screen: "Abmelden") |
| Browsable list of festivals with clear name/date/place per item | Festival picker | Minimum needed to pick something concrete; a bare/undifferentiated list feels unfinished | LOW-MEDIUM | `Festival` domain model + list endpoint already exist (Validated in `PROJECT.md`); reuse `FestivalCard`/`ListRow` from design system |
| Distinguish "festivals I've already joined" from "festivals I could join" | Festival picker | A returning visitor with 1+ festivals must not be dumped into a flat undifferentiated list every time — same expectation as a workspace switcher showing "your orgs" vs. "join another" | MEDIUM | Requires a user↔festival relationship (join/membership) — new schema, explicitly called out as a blocker in `PROJECT.md` Context ("no user/global-relationship schema"). This is the true dependency root of the whole slice, see Feature Dependencies |
| One-tap "join" action, then land in that festival's context | Festival picker | Users expect selecting = entering, not a multi-step confirmation flow | LOW | List-only join this cycle (no code/QR) — tap a festival → create membership → navigate to its home |
| A visible way back from "inside a festival" to the festival list/global context | Festival home | Design's own structural principle (`goHome()`) assumes bidirectionality; a visitor who joins the wrong festival, or genuinely attends several, must not get stuck inside one | LOW-MEDIUM | Minimum: a tappable app logo/back affordance in the top bar, or a "Festivals" menu item. Doesn't need the full 5-tab Global Shell nav — one clear exit is enough for the shell |
| Festival home shows basic identity + a next/overview fact (name, dates, one or two "what's happening" facts) | Festival home | An empty or purely-navigational home feels like a broken landing page, not a "home" | LOW-MEDIUM | Matches `PROJECT.md`: "basic overview the visitor can click into." Keep to overview data already available (festival name/dates/place) — do not fabricate timetable/live data that doesn't exist yet |
| Home exposes Profile and Friends as reachable, clearly-labeled destinations | Festival home | If they're not discoverable from home, "the home exposes a Profile/Friends screen" (an explicit requirement) isn't actually met | LOW | Simple nav entries (icons/menu rows) reusing `TopBar`/`FloatingNav` primitives — doesn't need the full 5-tab bar with Timetable/Lageplan/etc., those aren't built yet |
| Profile stub shows real (not fake) identity: name/email + avatar (or initials fallback) | Profile stub | An empty-looking profile with no user data reads as broken, not "placeholder" | LOW | Design system already specifies an initials-tile fallback when no photo exists (`Photo fällt auf getönte Initialen-Kachel zurück`) — reuse it, don't build a new empty-avatar pattern |
| Friends stub reads as "not built yet, here's what's coming" — not as an error/blank screen | Friends stub | Per empty-state UX research: users read blank screens as broken; a well-designed empty state (icon + one line "what's missing" + one line "what's next") reassures instead | LOW | Reuse `EmptyState` component already in the design system — it exists precisely for this. No real data needed, this is presentation only |
| No crash/dead-end on network failure during auth or festival list load | Welcome/Auth, Festival picker | Online-assumed doesn't mean "no error handling" — a spinner that never resolves reads worse than an offline banner | LOW-MEDIUM | Basic retry/error toast is enough; full offline-first sync is explicitly deferred |

### Differentiators (Competitive Advantage — Defer, But Note the Hook)

Not required for the shell to feel complete, but where later phases plug in. Listed so the shell's structure doesn't accidentally block them.

| Feature | Value Proposition | Complexity | Notes |
|---------|--------------------|------------|-------|
| Per-festival CI theming (4 CSS/token overrides: primary/secondary/tint/on-primary + optional logo) applied to the festival home | Makes the multi-tenant value visible immediately — "this app reskins per festival" is festipal's core structural bet | LOW-MEDIUM | Already fully specified in `03-design-system.md` §7 (ADR-015) as a token-scope, not a rebuild. Cheap enough that doing a minimal version (just primary color + name) in the shell is a legitimate stretch goal — flag to roadmap as an easy differentiator hook, not a hard requirement |
| Multiple joined festivals surfaced together (season-view: "your festivals" list beyond a single active one) | Sets up the real value prop for repeat/touring festivalgoers ("one app for every festival you go to") | LOW (data model already supports it via the join relationship) | The table-stakes "joined vs. joinable" list already produces this data — a season/multi-festival view is a presentation-layer follow-up, not a new backend dependency |
| Real Friends (search, requests, presence "who's here") | Core stated differentiator of the product (activities/connecting) | HIGH | Explicitly deferred (Out of Scope). The stub's job this cycle is only to not block this later — don't hardcode assumptions that prevent adding a friends graph |
| Social login (Google/Apple) | Reduces signup friction — general onboarding research strongly favors this (one-tap signup, SSO) | MEDIUM | Explicitly deferred by decision (email/password only, no OAuth). Worth flagging as a real friction cost accepted deliberately for v1 simplicity — not a mistake, but should be revisited once the shell ships if drop-off at registration is high |
| Join via code/QR/ticket | Matches how most real festival apps expect entry (ticket-linked), avoids a bare "browse all festivals" list which won't scale once there are many tenants | MEDIUM-HIGH (camera/scanner work) | Explicitly deferred. List-only join is fine while the festival catalog is small; flag to roadmap that the picker UX may need to change (search/filter) once festival count grows |
| Push notification opt-in tied to a specific festival | Common event-app feature, drives re-engagement | LOW-MEDIUM | Not needed this cycle — and per onboarding research, permission asks should be tied to a concrete moment/feature, not requested during generic onboarding. Natural hook: ask when the visitor first opens a festival's News, once News exists |

### Anti-Features (Deliberately Avoid in the v1 Shell)

Features that look like reasonable additions but would balloon this specific slice or actively fight its purpose.

| Feature | Why it looks tempting | Why problematic for this slice | Alternative |
|---------|------------------------|----------------------------------|-------------|
| Marketing-style onboarding carousel ("swipe through 3 feature screens") before login | Common in consumer apps, feels "polished" | Pure overhead for a shell with almost no features yet to sell; research confirms information-overload/product-tour patterns are a top onboarding failure mode | Skip it. Welcome screen = value line + register/login CTA, nothing more |
| Multi-step signup wizard (name, birthday, interests, notification prefs, etc.) | Feels like "gathering useful data early" | Every extra field is proven drop-off; nothing on this list is used by the shell (no personalization exists yet) | Email + password (+ optional display name) only. Add fields later when a feature actually consumes them |
| Full 5-tab Global Shell + 5-tab In-Festival bottom nav exactly as designed (Home/Festivals/Artists/Friends/Mehr and Dashboard/Tausch/Crew/Timetable/Lageplan) | It's literally in the approved design, tempting to "just build the nav" | Half the tabs (Artists, Tausch, Timetable, Lageplan, Cashless/Wallet) point at screens/features explicitly out of scope this cycle — building the chrome for screens that don't exist yet is dead weight and misleads the user | Build only the nav entries the shell actually needs (Home/Overview, Profile, Friends, back-to-picker). Add remaining tabs when their screens land |
| Rich global "Home" screen with rails, recommended festivals, countdown widgets, social proof rows (as in screen 01 of the design) | It's the documented "Home" screen and looks great | That screen assumes content (recommendations, countdowns, friend activity) the shell has none of — building it now means either faking data or shipping a mostly-empty rich layout | The shell's "festival picker" can be a plain list (joined + joinable), not the full curated Home. Upgrade later once real recommendation/friend data exists |
| Real-time presence, friend requests, or any live social data in the Friends stub | Feels like "why not wire it up, the screen's already there" | Requires a friends/relationship graph, request state machine, and realtime infra — explicitly deferred and a large scope jump | Static/empty-state Friends screen with a "coming soon"-style message, reusing the `EmptyState` component |
| Profile editing (avatar upload, name change, password reset flow) | Natural-feeling companion to "view your profile" | Adds file upload, validation, and account-recovery flows not needed to prove the entry-to-home path works | View-only profile stub this cycle; editing is a clearly separable follow-up phase |
| QR/code-based festival join | Matches how real ticketing works, feels "more real" | Camera/scanner permissions + native module work, plus a code-validation backend, for a feature the picker doesn't strictly need with a small festival catalog | List-only join; add code/QR entry once there are enough festivals that browsing doesn't scale |
| Requesting push notification or location permission during onboarding/first run | Common in event apps (SafeNow, alerts) | Untimed permission prompts at launch are a documented anti-pattern and drop conversion; nothing in the shell uses location or push yet | Don't ask. Defer to the exact feature that needs it (e.g., News alerts) once that feature ships |
| Full per-festival CI theming pipeline (admin-side contrast validation, logo upload, fallback chain) | It's ADR-015, feels like "just implement the spec" | The *admin* side (where a festival configures its theme) is out of scope this cycle (`apps/admin` deferred) — building the full contract without an admin to drive it is premature | If pursued at all this cycle, hardcode/seed one or two festivals' CI tokens directly in the DB and apply them read-only on the mobile side — treat as a stretch differentiator, not a pipeline to build out |
| Offline caching/mutation queue for auth or festival list | "Offline-first from day 1" is a stated architecture principle | This slice is explicitly online-assumed; building real offline sync now duplicates work once actual cacheable content (timetable, map) exists and defines real sync needs | Use offline-capable tech choices (already decided: SQLite/MMKV + TanStack Query) but don't implement caching/queueing logic yet — architect for it, don't build it |

## Feature Dependencies

```
[user table + better-auth wiring in NestJS]
    └──requires──> [Register/Login screens]
                       └──requires──> [Session persistence]
                                          └──requires──> [Auth-gated navigation: land on picker/home, not welcome, on reopen]

[user↔festival membership schema (new)]
    └──requires──> [Festival picker: "joined" vs "joinable" distinction]
                       └──requires──> [Join action → Festival home navigation]
                                          └──requires──> [Festival home]
                                                             ├──requires──> [Back-to-picker affordance]
                                                             ├──enables──> [Profile stub] (needs authed user, not festival context)
                                                             └──enables──> [Friends stub] (needs authed user, not festival context)

[Festival domain module + list endpoint] (already Validated)
    └──requires──> [Festival picker list rendering]

[Per-festival CI theming tokens] (differentiator)
    └──enhances──> [Festival home] (visual only, not a functional dependency — can ship home without it)
```

### Dependency Notes

- **Register/Login requires the `user` table + better-auth wiring:** this is the single hardest blocker in the whole slice — `PROJECT.md` flags it explicitly as absent. Nothing else in this feature list can be built or tested end-to-end until it exists.
- **The festival picker's "joined vs. joinable" distinction requires a new user↔festival relationship table:** this is a second, separate schema gap from the `user` table itself (it's the *link* between users and festivals, not the festival or user tables individually). Roadmap should treat this as its own unit of work, not assume it falls out of "add a user table."
- **Profile and Friends stubs depend only on auth, not on festival selection:** both are user-level, not festival-scoped, per the design's Global Shell placement (`Profil`, `Friends` are Global Shell screens in the source design, reachable independent of which festival is active). They can be built/tested in parallel with the festival-picker work once auth exists — don't sequence them behind "festival home" unless the shell's nav structure makes Profile/Friends reachable only from inside a festival (a scoping choice the roadmap should make explicitly).
- **CI theming enhances but doesn't gate festival home:** the home must work with the default festipal brand tokens (green/violet) as the fallback — per `03-design-system.md` §7, "fehlt ein CI-Wert → Fallback auf festipal-Basis." So theming can be added or skipped without touching the home screen's functional completeness.

## MVP Definition

### Launch With (v1 — this shell slice)

- [ ] Register with email/password — essential, it's the only entry point decided for v1
- [ ] Log in with email/password — essential, same reason
- [ ] Session persists across app reopen — essential per `PROJECT.md`, and abandoning this makes every other screen untestable as a "real" flow
- [ ] Logout (from Profile) — essential, users need a way out of their account
- [ ] Festival list showing joined + joinable festivals — essential, this is the core value path ("get into the app, connect to their festival")
- [ ] Join a festival (list-tap, no code/QR) — essential, it's the mechanism that produces "which festival am I in"
- [ ] Festival home with basic overview (name/dates/place, one or two overview facts) — essential, it's the explicit destination requirement
- [ ] Back-to-picker affordance from festival home — essential, prevents dead-ends for visitors with (or wanting) more than one festival
- [ ] Profile stub (name/email/avatar-or-initials, logout, no editing) — essential per requirement, view-only is enough
- [ ] Friends stub (well-designed empty state, no real data) — essential per requirement, must not look broken

### Add After Validation (v1.x)

- [ ] "Joined festivals" as a proper multi-festival list/season view (once >1 real festival exists to join) — trigger: real festival catalog grows past a handful
- [ ] Minimal CI theming on festival home (brand color swap) — trigger: once the shell is stable, this is a cheap, high-visibility differentiator to demo multi-tenancy
- [ ] Search/filter on the festival picker — trigger: festival catalog grows large enough that a flat list stops scaling
- [ ] Push notification opt-in — trigger: the first feature that actually needs it ships (e.g., News)

### Future Consideration (v2+)

- [ ] Social login (Google/Apple) — defer until registration drop-off data justifies the OAuth integration cost
- [ ] Join via code/QR/ticket — defer until list-only join demonstrably doesn't scale or a real ticketing partner requires it
- [ ] Profile editing — defer until there's a UI reason to edit (e.g., avatar matters for Friends/social features)
- [ ] Real Friends (requests, presence, search) — defer to the dedicated social/activities milestone; this is a stated core differentiator, not shell scope
- [ ] Full per-festival CI theming admin pipeline (contrast validation, logo upload) — defer to when `apps/admin` work starts

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Register/Login (email/password) | HIGH | MEDIUM | P1 |
| Session persistence | HIGH | LOW-MEDIUM | P1 |
| Festival list (joined vs. joinable) | HIGH | MEDIUM | P1 |
| Join a festival | HIGH | LOW | P1 |
| Festival home (basic overview) | HIGH | LOW-MEDIUM | P1 |
| Back-to-picker affordance | MEDIUM | LOW | P1 |
| Profile stub (view-only) | MEDIUM | LOW | P1 |
| Friends stub (empty state) | MEDIUM | LOW | P1 |
| Logout | MEDIUM | LOW | P1 |
| Minimal CI theming on home | MEDIUM | LOW-MEDIUM | P2 |
| Multi-festival season view | MEDIUM | LOW | P2 |
| Push opt-in | LOW (this cycle) | LOW-MEDIUM | P3 |
| Social login | MEDIUM | MEDIUM | P3 |
| Join via code/QR | MEDIUM | HIGH | P3 |
| Profile editing | LOW (this cycle) | MEDIUM | P3 |
| Real Friends (social graph) | HIGH (long-term) | HIGH | P3 (own milestone) |

**Priority key:**
- P1: Must have for the shell to be a complete, demoable slice
- P2: Should have, cheap wins once P1 is stable — do if time allows this cycle
- P3: Explicitly out of scope this cycle, tracked for later milestones

## Competitor / Reference Pattern Analysis

| Concern | Reference Pattern | Our Approach |
|---------|--------------------|--------------|
| Multi-context switching ("which org/event am I in") | Slack workspace switcher: one session, switch active org in-nav, active state clearly shown, instant in-session transitions (no re-auth per switch) | Same shape, purpose-built: Global Shell (`festival=null`) ↔ In-Festival (`festival` set), already specified in the approved design (`openFestival()`/`goHome()`). Shell builds the minimal version: list → join → home → back |
| Single-event apps (Coachella, Festival Dust) | No festival picker needed at all — one app, one event, home = lineup/schedule directly | Not directly applicable (festipal is explicitly multi-tenant), but confirms that once inside a festival, the home should lead with concrete overview info (dates/schedule-ish facts), not just navigation chrome |
| Onboarding friction reduction | Social login, deferred account creation, minimal fields, permission timing tied to feature use | Deliberately not fully adopted (email/password only, no deferred signup) — a conscious v1 simplicity tradeoff, not an oversight; flagged as a v1.x/v2 candidate if drop-off proves costly |
| Empty/placeholder screens | Explain why it's empty + one clear next step + simple icon/illustration, avoid "no data" generic copy | Directly applicable to Friends stub (and Profile stub's near-empty first-login state); the design system already ships an `EmptyState` component for exactly this |

## Sources

- `docs/concept/01-design-analysis.md` — festipal's own approved design analysis: Global Shell vs. In-Festival navigation model, screen inventory, domain model (HIGH confidence — this is the project's decided source of truth for the UX shape)
- `docs/concept/03-design-system.md` — festipal design system/tokens, CI-theming contract (ADR-015), component inventory including `EmptyState`, `Photo` initials fallback (HIGH confidence, same reason)
- `.planning/PROJECT.md` — Active/Out of Scope requirements and constraints for this milestone (HIGH confidence, authoritative for scope)
- General web search (LOW confidence individually, consistent across multiple independent sources — treated as MEDIUM in aggregate for well-established UX conventions, not domain-specific facts):
  - Mobile onboarding best practices — userpilot.com/blog/app-onboarding-best-practices, appcues.com/blog/essential-guide-mobile-user-onboarding-ui-ux, adapty.io/blog/mobile-app-onboarding
  - Onboarding anti-patterns / friction — medium.com (Userpilot: 7 User Onboarding Mistakes), decode.agency/article/app-onboarding-mistakes, developer.android.com/design/ui/mobile/guides/patterns/onboarding
  - Empty-state UX — uxpin.com/studio/blog/ux-best-practices-designing-the-overlooked-empty-states, blog.logrocket.com/ux-design/empty-state-ux, pencilandpaper.io/articles/empty-states
  - Event app home/dashboard patterns — eventmobi.com/blog/eventmobi-best-practices-event-app-home-screen-design, cvent.com/en/blog/events/event-app-features
  - Multi-tenant/workspace switcher UX — workos.com/blog/multi-tenant-session-management, medium.com (UX Power Tools: Account/App Switchers), slack.com/help (workspace switching)
  - Reference festival apps — Coachella Official app (App Store/Play Store listings), DICE app reviews, Festival Dust app listing

---
*Feature research for: festipal visitor-shell slice*
*Researched: 2026-07-29*
