# Phase 5: Festival Selection & Home - Context

**Gathered:** 2026-08-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn Phase 3's rudimentary festivals list + festival-home placeholder into the **real,
designed festival-selection and festival-home experience**, in the look of the newly-imported
Claude Design mockups (`docs/concept/designs/festival/`). A visitor browses festivals in a
**Meine/Alle** segment (default Meine), saves one to "Meine Festivals" in one tap (server-backed,
survives restart), **enters any festival gate-lessly** (no ticket/approval), and lands on that
festival's **home** — identity + key facts plus a "coming soon" main-menu skeleton — which they
can open and leave without a dead-end. All festival-scoped reads stay `festivalId`-scoped (SEC-02).

**This phase also introduces the app's global navigation frame** (a bottom tab bar), because the
user chose to stand up the shell scaffold now rather than retrofit it later.

**In scope (Phase 5 scope anchor):**
- **Global bottom tab bar** — 4 tabs: **Home · Festivals · Friends · Profil** (the design's
  "Artists" tab is omitted — own later milestone). **Home + Festivals are active** this phase;
  **Friends + Profil are disabled "coming soon" placeholders** filled in Phase 6.
- **Lean global Home/Overview** (Home tab) built only from existing data: "dein nächstes Festival"
  hero (FestivalCard + open) + "Meine Festivals" rail. Artists / global News / recommendations
  ("Könnte dir gefallen") are **omitted** this phase. Home is the post-login landing (unless the
  active-festival focus overrides — see D-06).
- **Festivals tab** — Meine/Alle segment (default Meine); gate-less. Meine = saved
  (`GET /me/festivals`), Alle = all (`GET /festivals`); FestivalCard shows name/dates/place +
  saved-state distinction; one-tap save (`POST /festivals/:id/save`).
- **Festival home** (stacked screen reached by entering a festival) — identity + key facts
  (name, dates, place; optional festival CI color) + a "main menu" of **dezente, deaktivierte
  'kommt bald' tiles** (Timetable/Lageplan/Cashless/News), i.e. the Dashboard skeleton. Back to
  the list without a dead-end.
- **Active-festival focus** — persist the entered festival; cold start opens its festival home
  directly (ties into Phase 3's splash "selected-festival state").
- **Festival master-data:** add `startDate`, `endDate`, `place` to the `festival` schema
  (db → contracts → seed `frequency-2026`); client formats the date range locale-aware via `Intl`.

**Out of scope (later phases / milestones — see Deferred):**
- The design's **Artists** feature (Meine Artists, follow, artist detail) — own milestone; no tab.
- The **in-festival tab bar** (Dashboard/Timetable/Lageplan/Tausch/Crew) and the **rich Dashboard**
  content (Jetzt-live acts, Stages, Cashless balance, News, Featured) — later content phases.
- **Ticket/Wallet model** (`angemeldet`, "Tickets in der Wallet", countdown, "Ticket/Code
  hinzufügen") and **Kommend/Vergangen** segmentation — conflicts with gate-less save (ADR-014);
  ticketing is a separate later concept.
- Real **Friends/Profil** screens (Phase 6 — tabs are placeholders now).
- Global **News/recommendations/Artists rail** on the Home; festival **search**, **cover images**,
  **friends-count** on cards; per-festival **CI theming** rollout (hook kept, default = brand).
- Real offline persistence (online-assumed this cycle).

</domain>

<decisions>
## Implementation Decisions

> All decisions below were selected by the user on 2026-08-05 (interactive discussion) unless
> marked as a technical default. They are **user-locked**. Pixel/visual/interaction details are NOT
> fixed here — they come from the imported mockups and are transcribed by `/gsd-ui-phase` into
> `05-UI-SPEC.md`. These are the product/scope/behavior decisions the mockups leave open.

**Decision index** (parser-readable; full rationale below):

- **D-01 — Design source:** Claude Design mockups exist and are imported to
  `docs/concept/designs/festival/`. Fidelity path (ADR-015). The mockups are the **north-star
  full-app design**; Phase 5 builds a scoped slice in their look. `/gsd-ui-phase` transcribes.
- **D-02 — Global nav frame:** introduce the **global bottom tab bar now** — 4 tabs
  **Home · Festivals · Friends · Profil** (design's "Artists" omitted). Home + Festivals active;
  Friends + Profil are disabled "coming soon" placeholders (Phase 6). **No in-festival tab bar.**
- **D-03 — Profile/Friends placement (roadmap reconciliation):** Profile & Friends live in the
  **global tab bar**, NOT in the festival home (overrides ROADMAP Phase 6's "from the festival
  home" placement / HOME-03). Phase 6 fills these global tabs.
- **D-04 — Lean global Home:** a reduced Home/Overview from existing data only ("nächstes Festival"
  hero + "Meine Festivals" rail); Artists/News/recommendations omitted. Post-login landing.
- **D-05 — Festival list:** Meine/Alle segment (default Meine), gate-less. Meine = saved
  (`GET /me/festivals`, server-backed, survives restart), Alle = all (`GET /festivals`). Card shows
  name/dates/place + saved distinction; drop ticket/countdown/wallet/Kommend-Vergangen framing.
- **D-06 — Active-festival focus:** persist entered festival; cold start opens its festival home
  directly; switching/back returns to the global shell.
- **D-07 — Festival home scope:** identity + key facts + a "main menu" of disabled "coming soon"
  tiles (Timetable/Lageplan/Cashless/News) = the Dashboard skeleton later phases fill.
- **D-08 — Master-data (technical default):** add `startDate`/`endDate`/`place` to `festival`
  (db → contracts → seed); `place` is user-generated → NOT translated (ADR-020); date range
  formatted client-side via `Intl`.

### Design source & fidelity
- **D-01:** The user's Claude Design project "Festipal mobile app screens"
  (`200bac88-9970-423a-ad6f-fe466171e393`) was imported via the `claude_design` MCP into
  `docs/concept/designs/festival/` (screens.jsx, ds.js, tokens.css, the App-Screens canvas,
  runtime, README with provenance). It contains **13 screens across two nav contexts** and is the
  **north-star for the whole app**, well beyond the Visitor-Shell milestone. Phase 5 implements only
  a slice, in the design's visual language, keeping the concept-binding gate-less model.
  `/gsd-ui-phase 5` produces the pixel-precise `05-UI-SPEC.md` from these files.
  - **Reversibility:** reversible — reference material; no code impact until UI-SPEC/plan.

### Global navigation frame
- **D-02 / D-03:** Stand up the **global bottom tab bar** this phase: **Home · Festivals · Friends ·
  Profil**. The mockups' 5-tab bar (Home/Festivals/Artists/Friends/Mehr) is trimmed — **Artists is
  omitted** (its own later milestone), and Friends/Profil map to the design's Friends + the
  Profil push-screen. Only **Home + Festivals** are functional this phase; **Friends + Profil are
  visible-but-disabled "coming soon"** entries that Phase 6 turns real. This deliberately moves
  Profile/Friends into the **global shell** — reconciling ROADMAP Phase 6, which had located them in
  the festival home (HOME-03). The **festival home is a stacked screen** (no separate in-festival
  tab bar this phase).
  - **Note (scope):** introducing the tab shell + a lean global Home expands Phase 5 slightly beyond
    a literal "festival selection & home"; the user (founder) chose this consciously to avoid a
    later retrofit. Flag for ROADMAP/REQUIREMENTS reconciliation at phase transition (HOME-03 moves
    to the global shell; a new "app shell / tab bar" capability is now delivered in Phase 5).
  - **Reversibility:** costly — the tab-bar frame becomes the app's root navigation; later screens
    (Phase 6+) mount into it, so changing the frame later touches every top-level route. Choosing it
    now is the cheap moment.

### Lean global Home
- **D-04:** The Home tab renders a **reduced** version of the design's Overview: a "dein nächstes
  Festival" hero (FestivalCard + "Festival öffnen") and a "Meine Festivals" rail, sourced from the
  existing `GET /me/festivals` / `GET /festivals`. The design's Artists rail, global News, and
  "Könnte dir gefallen" recommendations are **omitted** (no backing data/features yet). Home is the
  post-login landing target, unless the active-festival focus (D-06) sends the visitor straight into
  a festival on cold start.
  - **Reversibility:** reversible — additive; later phases grow the Home with real sections.

### Festival list (Meine/Alle, gate-less)
- **D-05:** One **Festivals** screen with a **Meine/Alle** SegmentedControl, **default Meine**
  (FEST-02). **Meine** = the caller's saved festivals via `GET /me/festivals` (server-backed —
  survives restart, fixing Phase 3's session-only save-state); **Alle** = `GET /festivals`. The
  design's FestivalCard is reused, showing **name, dates, place** and a **saved-state distinction**
  (badge/'✓ Gespeichert' vs a Save affordance). **Save is one tap** (`POST /festivals/:id/save`,
  idempotent) with optimistic update + `me/festivals` invalidation. The design's **ticket/wallet,
  countdown, and Kommend/Vergangen** framing is **dropped** — it conflicts with the gate-less
  `MyFestival` model (ADR-014; no ticket/QR this cycle).
  - **Reversibility:** reversible — client-side segmentation + existing endpoints.

### Active-festival focus
- **D-06:** Entering a festival **persists** it as the active festival; on cold start the app opens
  that festival's home directly (serves the core value "reach everything from one home screen";
  aligns with Phase 3's splash "selected-festival state"). Leaving/switching returns to the global
  shell (Festivals/Home). Entry is gate-less — saved or merely browsed, no gate.
  - **Reversibility:** reversible — persisted client nav state (storage key), no server/contract
    change; clearing it just changes the launch target.

### Festival home scope
- **D-07:** The festival home shows **identity + key facts** (name, dates, place; optional festival
  CI color) and a **"main menu"** of **dezente, deaktivierte 'kommt bald' tiles**
  (Timetable/Lageplan/Cashless/News) — the Dashboard skeleton that later content phases fill.
  Overview content is opened from here (HOME-02) and there is always a non-dead-end way back to the
  list (FEST-04). All reads are `festivalId`-scoped even though entry is gate-less (SEC-02).
  - **Reversibility:** reversible — presentation; the disabled tiles become real screens later.

### Claude's Discretion (technical defaults — surface in PLAN.md)
- **D-08 — Master-data schema:** add `startDate` (date), `endDate` (date), `place` (text) to the
  `festival` Drizzle table; extend the drizzle-zod base so `festivalSchema` in `packages/contracts`
  carries them (Pitfall 6 — no hand-redeclared shapes); seed `frequency-2026` with real values;
  format the date range on the client via `Intl.DateTimeFormat` (locale-aware, no hardcoded German
  string). `place` is user-generated content → **not** translated (ADR-020).
  - **Reversibility:** costly — touches the published `packages/contracts` festival shape + db
    migration + seed + every festival consumer (list card, Home, festival home) in one coordinated
    edit. No production data yet, so the migration is low-risk, but treat as a contract change.
- **Per-festival CI theming:** the tokens ship `--ci-*` hooks (and a sample `hoerspiel` theme). Keep
  the hooks but **default to brand**; do not build a per-festival CI rollout (seed has no CI colors).
- **Active-festival storage** (MMKV vs SecureStore vs a small persisted store), exact tab-bar
  component (custom on tokens per ADR-022 — the design uses a floating "liquid glass" nav pill),
  route-group layout for the tabs + the stacked festival group, empty/loading/error states, and the
  optimistic-save + query-invalidation wiring are planner/implementer choices.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Binding design contract (THIS PHASE — read first)
- `docs/concept/designs/festival/` — the **imported Claude Design mockups** (north-star full app).
  Read `README.md` first (provenance + scope note), then:
  - `festipal-screens.jsx` — all 13 screen definitions + real German copy + mock data
    (`FESTIVALS`, `ARTISTS`, `ACTS`, …). Phase-5-relevant screens: **`OverviewScreen`** (global
    Home), **`MyFestivalsScreen`** (festival list — note it uses Kommend/Vergangen; we use
    Meine/Alle), **`DashboardScreen`** (in-festival home — we build only its identity/skeleton).
  - `festipal-tokens.css` — token source (green `#74CC1F` / violet `#5A4DFF`, dark-first +
    `[data-theme="light"]`, `--ci-*` festival hooks, type/space/radii/shadow, `.fp-glass` nav).
  - `festipal-ds.js` — component bundle (FestivalCard, SegmentedControl, Card, EmptyState, Button,
    Photo, …) to mirror as owned RN primitives (ADR-022 — do NOT add a third-party UI kit).
  - `Festipal App Screens.dc.html` — canvas mapping each screen to an `initial-tab`.
- `docs/concept/03-design-system.md` — brand design system, binding (ADR-015); consistent with the
  imported tokens; source alongside `packages/ui/src/tokens.ts` (real values landed in Phase 4).
- `docs/concept/designs/auth/source/festipal-tokens.css` — the Phase-4 auth token source (same
  brand system); confirm the festival tokens are consistent, don't fork a third token set.

### Roadmap / requirements (this phase)
- `.planning/ROADMAP.md` §"Phase 5: Festival Selection & Home" — goal + 5 success criteria + Notes
  (browse relies on Phase 2 endpoints; confirm home/overview read is `festivalId`-scoped per SEC-02).
- `.planning/REQUIREMENTS.md` — **FEST-01..04**, **HOME-01, HOME-02** (this phase); **HOME-03**
  (Profile/Friends nav) is reconciled to the **global tab bar** per D-03 (was Phase 6 "from home").
  **SEC-01** (login-first) + **SEC-02** (`festivalId` isolation) still bind all data reads.

### Prior phase decisions this phase builds on
- `.planning/phases/03-mobile-app-shell-i18n-foundation/03-CONTEXT.md` — route groups
  (`(auth)`/`festivals`/`(festival)`), three-state guard + splash gating incl. **selected-festival
  state** (D-06 builds on it), the real `GET /festivals` list + gate-less save→enter (D-03), i18n
  device-locale + German fallback + English source strings / binding DE catalog.
- `.planning/phases/04-visitor-auth-profile-completion/04-CONTEXT.md` — real brand tokens in
  `packages/ui/src/tokens.ts`, name caps, MMKV usage (avatar), the icon-only logout that today
  lives on the Festivals header (moves to Profil/Settings as the shell grows).
- `.planning/phases/02-otp-auth-festival-backend-api/02-CONTEXT.md` — `GET /festivals` (D-04 minimal
  shape — to be extended with dates/place, D-08), gate-less idempotent `POST /festivals/:id/save`
  (409 if profile incomplete), caller-scoped `GET /me/festivals`, `frequency-2026` seed, SEC-02
  cross-tenant denial test.

### ADRs (authoritative)
- `docs/DEVELOPMENT_DECISIONS.md` — **ADR-015** (Claude Design fidelity binding — Principle 5),
  **ADR-022** (no third-party RN UI kit; own primitives on tokens), **ADR-014** (gate-less save /
  `festivalId` scoping), **ADR-020 / ADR-012** (user-generated content never translated; two locale
  axes), **ADR-011** (cashless = embedded per-festival URL, hidden when unset — relevant to the
  Cashless "coming soon" tile), **ADR-005** (Neon pooling / `prepare:false`).

### Existing code this phase extends
- `apps/mobile/app/festivals/index.tsx` (real list + session-only save — becomes Meine/Alle,
  server-backed) + `app/festivals/_layout.tsx`.
- `apps/mobile/app/(festival)/index.tsx` (home placeholder — becomes identity + "coming soon" menu)
  + `app/(festival)/_layout.tsx`; `app/_layout.tsx` (root guard + splash + selected-festival state).
- `apps/mobile/lib/api-client.ts` (ts-rest; `listFestivals`, `listMyFestivals`, `saveFestival`),
  `lib/query-client.ts` (TanStack Query provider).
- `packages/contracts/src/schemas.ts` `festivalSchema` + `router.ts` (`listFestivals`,
  `listMyFestivals`, `saveFestival`, `getFestival`) — extend the festival shape with dates/place (D-08).
- `packages/db/src/schema/festival.ts` — add `startDate`/`endDate`/`place`; `packages/db/scripts/`
  seed to populate them.
- `packages/ui/src/tokens.ts` — brand tokens (Phase 4); ensure the festival CI hooks/glass-nav
  values exist or are added consistently with `docs/concept/designs/festival/festipal-tokens.css`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/api-client.ts` already exposes `listFestivals`, `listMyFestivals`, `saveFestival` — Meine/Alle
  and the Home rail are pure client composition over existing endpoints (no new endpoints except the
  master-data field additions in D-08).
- Phase 3/4 route groups + root guard + splash (with selected-festival state) are the mount points
  for the new tab bar and the active-festival focus (D-06).
- `packages/ui` real brand tokens (Phase 4) + the imported `festipal-tokens.css` give the full token
  set (incl. `.fp-glass` nav + `--ci-*`); build the tab bar as an owned primitive (ADR-022).
- The imported `festipal-ds.js` FestivalCard / SegmentedControl / EmptyState / Card are the visual
  reference to mirror as RN primitives.

### Established Patterns
- Zod schemas in `packages/contracts` are the single source of truth — extend the drizzle-zod
  festival base for dates/place (Pitfall 6), never hand-redeclare.
- no-literal-string lint (Phase 3) — all new copy goes through Lingui `t()`/`<Trans>`; DE catalog is
  binding and should match the mockup copy where a screen is built.
- Custom RN primitives styled via tokens (ADR-022); icons via `lucide-react-native` (Phase 4 dep).
- Service returns `null`/contract error for not-found; reads are `festivalId`-scoped (SEC-02).

### Integration Points
- New master-data fields (D-08) span `packages/db` → `packages/contracts` → seed → every mobile
  festival consumer in one coordinated edit.
- The tab bar becomes the **root** navigation frame — Phase 6 (Friends/Profil) and later content
  phases mount into it; the festival home is a stacked screen over the shell.
- Active-festival focus adds a persisted client state key read by the splash/guard on cold start.
- The Cashless "coming soon" tile must honor ADR-011 (hidden/disabled when no `cashlessUrl`).

</code_context>

<specifics>
## Specific Ideas

- The mockups are the **north-star**; Phase 5 builds a faithful *slice* — reuse tokens/components,
  but strip out-of-scope content (Artists, rich Dashboard, ticket/wallet).
- Festival list uses **Meine/Alle** (not the mockup's Kommend/Vergangen); Meine = server-backed
  saved list; saved festivals visually distinguished in Alle.
- Festival home = **identity + key facts + disabled "coming soon" menu** (Dashboard skeleton).
- **Cold start opens the active festival directly** (one-home-screen core value).
- Global tab bar = **Home · Festivals · Friends · Profil**; Home + Festivals live, Friends + Profil
  "coming soon"; Artists omitted; Profile/Friends now global (not festival-home).
- Master-data dates/place added server-side; date range formatted via `Intl`; `place` not translated.

</specifics>

<deferred>
## Deferred Ideas

Captured from the imported north-star mockups so nothing is lost — none folded into Phase 5:

- **Artists feature** (Meine Artists tab, follow/unfollow, genre filter, artist-detail Sheet with
  upcoming festivals + social links) — its own later milestone; no Artists tab in Phase 5.
- **In-festival tab bar + rich Dashboard** — Jetzt-live acts (ActCard), Stages grid
  (StageStatusCard), Timetable (days/conflicts/save, Meine/Friends filters), Lageplan/Map (MapLibre
  + SafeNow overlays, vendor pins/ratings), Tauschbörse (swap/suche/verschenkt listings), Crew
  (activities + friends-on-site), Cashless/Wallet (balance, top-up, transactions), festival News —
  all later content phases/milestones.
- **Ticket/Wallet model** — `angemeldet` status, "Tickets in der Wallet", countdown, "Ticket oder
  Code hinzufügen", Kommend/Vergangen — a separate ticketing concept; conflicts with gate-less save.
- **Global Home richness** — Artists rail, global News feed, "Könnte dir gefallen" recommendations,
  "Festipal folgen" social row.
- **Festival list extras** — search input ("Festival suchen …"), cover images (Photo), friends-count
  per card, past/upcoming grouping.
- **Per-festival CI theming rollout** — `--ci-*` overrides per tenant (e.g. `hoerspiel`); hooks kept,
  default brand; adopt when a partner festival ships real CI colors.
- **Real Friends & Profil screens** — Phase 6 (tabs are "coming soon" placeholders now).
- **Manual light/dark toggle + in-app language switcher** — Settings, later (tokens support both
  themes already).

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 5-festival-selection-home*
*Context gathered: 2026-08-05*
