# Auth & Onboarding — Screen Designs

Design source-of-truth for the **visitor mobile** onboarding/auth flow
(login-first, passwordless OTP). Generated in [Claude Design](https://claude.ai/design)
and imported here as the reference we build against (Prinzip 5 — Design-Treue).

Flow and rules: [`../../09-onboarding-auth.md`](../../09-onboarding-auth.md) ·
Tokens/voice: [`../../03-design-system.md`](../../03-design-system.md).

## View it

Open **`preview.html`** in a browser — a self-contained reproduction of all screens
in **dark + light**, no build step. It reads `source/festipal-tokens.css` and
`vendor/lucide.js`; icons and fonts render locally (fonts fall back to the system stack
offline).

Because browsers block `file://` sub-resources inconsistently, serve the folder if the
CSS/icons don't load:

```bash
cd docs/concept/designs/auth && npx serve .   # or any static server
```

## Screens (8 frames)

| # | Screen | State shown |
|---|--------|-------------|
| 01 | Welcome | Wortmarke + „Los geht's" |
| 02 | E-Mail eingeben | default |
| 02b | E-Mail eingeben | „Code senden" lädt |
| 03 | Code eingeben | 6-stellig, Resend-Countdown |
| 03b | Code eingeben | Fehler (falsch/abgelaufen) |
| 04a | Profil vervollständigen | Username „prüfe…" |
| 04b | Profil vervollständigen | Username „frei ✓" |
| 04c | Profil vervollständigen | Username „schon vergeben" |

Deliberately out of scope (per doc 09): `birthDate`/`gender` (→ Birgit B2),
success moment after „Fertig", rate-limit case, keyboard overlays.

## Files

- `preview.html` — runnable, self-contained preview (generated from `source/`). **Start here.**
- `source/` — verbatim Claude Design export (provenance / text of record):
  - `Festipal Onboarding.dc.html` — canvas doc (dark + light sections)
  - `Festipal Onboarding Set.dc.html` — the 8 screen frames
  - `festipal-tokens.css` — design tokens used by the screens
  - `support.js` — Claude Design `dc-runtime` (only needed to render the `.dc.html` inside Claude Design)
- `vendor/lucide.js` — Lucide icons, pinned **v0.470.0** (used by `preview.html`)

> The `.dc.html` files render only inside Claude Design (they need React + `dc-import`
> resolution). Use `preview.html` locally.

## Next step

Not app code yet. To build the real React Native screens in `apps/mobile`, run
`/gsd-ui-phase` to turn these designs into a `UI-SPEC.md` contract, then implement —
porting the web mockups to RN primitives + shared tokens (ADR-022, doc 03 §9).
