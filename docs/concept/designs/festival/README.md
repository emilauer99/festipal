# Festival app screens — Claude Design import

Imported from Claude Design via the `claude_design` MCP on 2026-08-05.

- **Source project:** "Festipal mobile app screens" — `200bac88-9970-423a-ad6f-fe466171e393`
- **URL:** https://claude.ai/design/p/200bac88-9970-423a-ad6f-fe466171e393?file=Festipal+App+Screens.dc.html
- **Canvas entry:** `Festipal App Screens.dc.html` (13 screens, two nav contexts)

## Files

| File | What it is |
|------|-----------|
| `Festipal App Screens.dc.html` | Canvas that mounts all 13 screens; each `<x-import initial-tab=…>` is one screen instance. Open in a DC-runtime host to render. |
| `festipal-screens.jsx` | **All 13 screen definitions + real German copy + mock data** (`FESTIVALS`, `ARTISTS`, `ACTS`, …). The primary design-content reference. |
| `festipal-ds.js` | The Festipal design-system component bundle (`FestivalCard`, `Button`, `Card`, `SegmentedControl`, `EmptyState`, `ActCard`, `BalanceCard`, …). |
| `festipal-tokens.css` | **Token source** — colors (green `#74CC1F` / violet `#5A4DFF`), dark-first + `[data-theme="light"]`, per-festival CI hooks (`--ci-*`), type/space/radii/shadow/glass. Same brand system as `../auth/source/festipal-tokens.css`. |
| `support.js` | DC-runtime (parses/mounts the `.dc.html`). Vendored, not app code. |
| `vendor/lucide.js` | Lucide icons v0.470.0 for preview rendering. **⚠ Truncated at 256 KiB** (MCP `get_file` cap; original ≈284 KB). Re-fetch from the source project if a full local preview is needed. The app uses `lucide-react-native`, not this file. |

## Scope note (read before implementing)

These mockups are the **north-star full-app design** and go far beyond the current
"Visitor Shell" milestone. They show a two-context architecture — a global tab shell
(Home · Festivals · Artists · Friends · Mehr) and an in-festival context
(Dashboard · Tausch · Crew · Timetable · Lageplan) — plus a ticket/wallet framing.

The Visitor Shell (and Phase 5 specifically) implements only a slice of this and keeps
the concept-binding **gate-less, no-ticket `MyFestival` save** model (ADR-014). The exact
Phase-5 mapping (which screens/sections land now vs. later, and how the ticket framing
maps to gate-less save) is captured in
`.planning/phases/05-festival-selection-home/05-CONTEXT.md` and transcribed into the
pixel-precise contract by `/gsd-ui-phase` (→ `05-UI-SPEC.md`).

Auth/onboarding designs live separately in `../auth/`; the source project's two
Onboarding `.dc.html` sets were **not** re-imported here (Phase 4 already transcribed them).
