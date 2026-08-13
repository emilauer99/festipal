# Phase 5: Festival Selection & Home - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-05
**Phase:** 5-festival-selection-home
**Areas discussed:** Design source, App/nav scaffold, Festival list model, Festival-home scope, Active-festival focus, Global tab set, Global Home

---

## Design source

Initial question: create Claude Design mockups first vs. design from the existing design system.

| Option | Description | Selected |
|--------|-------------|----------|
| Aus Design-System | Design from `03-design-system.md` + Phase-4 tokens; no pixel mockup | |
| Mockups zuerst | Build Claude Design mockups first, then pixel-match | |
| Hybrid | First pass from design system, iterate on-screen | |

**User's choice:** *Other* — "doch es gibt schon Claude-Design-Mockups" + URL to the project
(`200bac88-9970-423a-ad6f-fe466171e393`, "Festipal App Screens.dc.html").
**Notes:** WebFetch hit HTTP 403 (auth-gated). Imported instead via the `claude_design` MCP into
`docs/concept/designs/festival/`. Design source = the mockups; fidelity path (ADR-015). The mockups
turned out to be the **north-star full app** (13 screens, two nav contexts), far beyond the shell.

## Mockups scope + import handling

| Question | Options | Selected |
|----------|---------|----------|
| Do mockups fix the rest? | Mockups sind maßgeblich / **Teils offen** | Teils offen |
| Import handling | **Ich exportiere sie jetzt** / später in gsd-ui-phase | (Ich exportiere jetzt) |

**Notes:** User then asked Claude to import via the MCP directly. Done — screens.jsx, ds.js,
tokens.css, the App-Screens canvas, runtime + README committed under `docs/concept/designs/festival/`.
`vendor/lucide.js` truncated at the 256 KiB `get_file` cap (vendor lib; app uses lucide-react-native).

## App / nav scaffold

| Option | Description | Selected |
|--------|-------------|----------|
| Schlank: Liste + Festival-Home | One Festivals screen → festival home; no global tab bar yet | |
| Tab-Shell-Gerüst jetzt | Global tab bar now; Festivals (+ lean Home) active, rest disabled | ✓ |
| Im-Festival-Tab-Bar auch | Also the in-festival tab bar (Dashboard/Timetable/…) as scaffold | |

**User's choice:** Tab-Shell-Gerüst jetzt
**Notes:** Global tab bar introduced now; in-festival tab bar deferred (festival home stays a
stacked screen). Consciously expands Phase 5 to avoid a later retrofit.

## Festival list model

| Option | Description | Selected |
|--------|-------------|----------|
| Meine/Alle, gate-less | Meine=saved (my_festival), Alle=all; card name/dates/place + saved badge; drop ticket/wallet/Kommend-Vergangen | ✓ |
| Design-Segmente übernehmen | Kommend/Vergangen + ticket wallet (needs ticket/time logic; out of scope) | |

**User's choice:** Meine/Alle, gate-less

## Festival-home scope

| Option | Description | Selected |
|--------|-------------|----------|
| Identität + Fakten + 'kommt bald'-Menü | Header + key facts + disabled coming-soon tiles (Dashboard skeleton) | ✓ |
| Nur schlanke Übersicht | Header + key facts only, no section placeholders | |

**User's choice:** Identität + Fakten + 'kommt bald'-Menü

## Active-festival focus

| Option | Description | Selected |
|--------|-------------|----------|
| Aktives Festival merken | Persist entered festival; cold start opens its home directly | ✓ |
| Immer auf der Liste starten | No persistent focus; always land on the festivals list | |

**User's choice:** Aktives Festival merken

## Global tab set + Profile/Friends placement

| Option | Description | Selected |
|--------|-------------|----------|
| Shell-Tabs: Festivals + Friends + Profil | Only shell-relevant tabs; Artists & global Home not in bar; Profile/Friends move to global shell | ✓ |
| Design-Set komplett, nur Festivals aktiv | Full 5-tab bar (Home/Festivals/Artists/Friends/Mehr), only Festivals live | |
| Nur Festivals sichtbar | Tab bar shows only Festivals for now | |

**User's choice:** Shell-Tabs: Festivals + Friends + Profil
**Notes:** Reconciles ROADMAP Phase 6 — Profile/Friends live in the global tab bar, not the festival
home (HOME-03).

## Global Home

| Option | Description | Selected |
|--------|-------------|----------|
| Später — Start auf Festivals | No global Home this cycle; land on Festivals tab | |
| Schlanke Home jetzt | Reduced Home from existing data (next/my festivals), rest omitted | ✓ |

**User's choice:** Schlanke Home jetzt

## Home & tab bar composition (clarifier)

| Option | Description | Selected |
|--------|-------------|----------|
| 4er-Bar: Home · Festivals · Friends · Profil | Home + Festivals active; Friends + Profil "coming soon"; Home is launch target | ✓ |
| Kein Home-Tab | Bar = Festivals · Friends · Profil; Home has no own tab | |

**User's choice:** 4er-Bar: Home · Festivals · Friends · Profil

---

## Claude's Discretion

- Festival master-data schema (D-08): add `startDate`/`endDate`/`place` to `festival`
  (db → contracts → seed), `Intl` date-range formatting, `place` not translated (ADR-020).
- Per-festival CI theming (`--ci-*`) kept as a hook, default brand (no rollout this phase).
- Active-festival storage mechanism, tab-bar component (owned RN primitive on tokens, glass nav),
  route-group layout, empty/loading/error states, optimistic-save + query invalidation.

## Deferred Ideas

Artists feature; in-festival tab bar + rich Dashboard (live acts, stages, Timetable, Lageplan/Map,
Tauschbörse, Crew, Cashless/Wallet, festival News); ticket/wallet model + Kommend/Vergangen; global
Home richness (Artists rail, global News, recommendations, social row); festival search / cover
images / friends-count; per-festival CI rollout; real Friends & Profil (Phase 6); light/dark toggle
+ in-app language switcher.
