# Phase 4: Visitor Auth & Profile Completion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-04
**Phase:** 4-visitor-auth-profile-completion
**Areas discussed:** Avatar-Umfang, Deep-Link nach Login, Namens-Limits, Splash-Style

**Framing:** UI/visual/interaction is already locked by `04-UI-SPEC.md` (gsd-ui-checker VERIFIED)
and the auth backend + session model by Phase 2. Discussion targeted only the decisions those
contracts left open, plus the server-cap gap the UI-SPEC explicitly flagged.

---

## Avatar-Umfang (IDN-01 optional avatar)

| Option | Description | Selected |
|--------|-------------|----------|
| Verschieben → Initialen | Only initials tile this phase; don't build picker. Keeps Phase 2 backend frozen. | |
| Lokal ohne Speichern | Pick + show photo locally, not server-persisted. | ✓ |
| Voller Upload jetzt | Upload endpoint + object store + avatar in contract (new backend work). | |

**User's choice:** Lokal ohne Speichern

**Follow-up (needed clarification — "how local?"):**

| Option | Description | Selected |
|--------|-------------|----------|
| Gerätelokal (MMKV) | URI persisted on-device via MMKV; survives restart on same device, no server/cross-device sync. | ✓ |
| Nur im Setup-Screen | Photo only visible during completion screen; gone after submit/restart (UX trap). | |
| Doch verschieben | Fall back to initials-only, don't build picker. | |

**User's choice:** Gerätelokal (MMKV)
**Notes:** `visitor_profile.avatar` stays null; `complete-profile` contract body unchanged
(username+displayName). Documented trade-off: device-local half of the full feature; real server
upload is a later phase. User accepted the no-cross-device / cleared-on-app-data-wipe implication.

---

## Deep-Link nach Login (SC-5)

| Option | Description | Selected |
|--------|-------------|----------|
| Auf Home landen | After login, land on Home; original deep-link target not remembered. Simplest, satisfies SC-5. | |
| Zum Ziel zurück | Remember the deep-link and route there after login (+ profile-completion). Better UX, more state. | ✓ |

**User's choice:** Zum Ziel zurück
**Notes:** Intended destination must survive the intermediate profile-completion step on first login.

---

## Namens-Limits (server-side length caps)

| Option | Description | Selected |
|--------|-------------|----------|
| displayName ≤40 / user 3–20 | UI-SPEC default; username charset a–z 0–9 _ . (concept 09 §5). | ✓ |
| Andere Werte | User specifies custom maxima. | |

**User's choice:** displayName ≤40 / user 3–20
**Notes:** Fills the UI-SPEC-flagged gap (server currently enforces nothing). Coordinated edit across
packages/db refinement → packages/contracts schema → mobile client soft-cap; suggestion generator
caps output ≤20 chars.

---

## Splash-Style

| Option | Description | Selected |
|--------|-------------|----------|
| Leicht umstylen | Restyle splash to brand tokens (dark --bg-app + Outfit wordmark); tokens/font land this phase anyway. | ✓ |
| Platzhalter behalten | Keep Phase 3 placeholder; splash branding a later phase. | |

**User's choice:** Leicht umstylen
**Notes:** Non-blocking — must not gate on font load (system-font fallback); no success criterion depends on it.

---

## Claude's Discretion

- Username-taken suggestion algorithm (must cap ≤20 chars, produce an available candidate).
- Logout robustness backstops (offline signOut still clears local session + reaches Welcome; no
  re-entrant double-tap).
- Splash cold-start timeout/fallback (no deadlock on hung resolve).
- MMKV avatar storage key/shape; expo-image-picker permission handling.
- Welcome/email route-file split layout; guard extension for deep-link return-to.
- Font loading mechanism (@expo-google-fonts + expo-font) with system fallback.

## Deferred Ideas

- Real server-side avatar upload + storage + cross-device sync → later profile/media phase.
- Social-links block + profile-visibility control (PROF-02, v2) → excluded per UI-SPEC #2.
- Manual light/dark toggle (Settings) → later.
- In-app language switcher → Phase 6+.
- Real Resend delivery hardening + festival-scale OTP rate-limit tuning → pre-launch.
