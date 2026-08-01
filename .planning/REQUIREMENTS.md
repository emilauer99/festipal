# Requirements: festipal — Visitor Shell

**Defined:** 2026-07-29
**Reconciled:** 2026-07-30 with the binding concept phase (docs/concept/04–10; ADR-009 auth, ADR-014 tenant boundary, ADR-016 identity, ADR-020 scope)
**Core Value:** A festival visitor can get into the app, connect to their festival, and reach everything about their festival experience from one home screen.

## v1 Requirements

Requirements for the visitor-shell slice (navigable, online, mobile-first, login-first). Each maps to roadmap phases.

### Authentication (passwordless email-OTP)

- [ ] **AUTH-01**: A visitor enters their email, receives a 6-digit one-time code, and is logged in by entering it; a new email creates a global `Account` (no password stored)
- [ ] **AUTH-02**: A returning visitor (email already has a VisitorProfile) is taken straight into the app after OTP, skipping profile setup
- [ ] **AUTH-03**: A visitor's session is long-lived and auto-renews so they stay logged in across app restarts; on expiry they re-authenticate via OTP
- [ ] **AUTH-04**: A visitor can log out
- [ ] **AUTH-05**: OTP errors and edge cases (wrong/expired code, resend, change email, rate-limited requests) are shown clearly and localized

### Identity & Profile

- [ ] **IDN-01**: On first login, a visitor completes their VisitorProfile with a required unique `username` (live availability check) and `displayName`; `avatar` is optional (upload/camera, else initials tile)
- [ ] **PROF-01**: A visitor can open a Profile screen showing their username, displayName, avatar/initials, and email (view-only)

### Festival Selection

- [ ] **FEST-01**: A visitor can browse all festivals, each showing name, dates, and place
- [ ] **FEST-02**: The Festivals tab offers a Meine/Alle segment (default Meine), distinguishing saved festivals
- [ ] **FEST-03**: A visitor can save a festival to "Meine Festivals" in one tap
- [ ] **FEST-04**: A visitor can enter a festival gate-lessly (no ticket/approval) and return to the list without a dead-end

### Home & Navigation

- [ ] **HOME-01**: After entering a festival, the visitor lands on that festival's main menu / home
- [ ] **HOME-02**: The home shows a basic festival overview (identity + key facts) the visitor can open
- [ ] **HOME-03**: The home provides navigation to Profile and Friends

### Friends (placeholder)

- [ ] **FRND-01**: A visitor can open a Friends screen with a clear, non-broken empty state (friends who saved the same festival — none yet)

### Platform & Security

- [x] **PLAT-01**: A single global `Account` underpins identity (`Account` → `VisitorProfile`); app users are global and NOT festival org-members
- [ ] **PLAT-02**: The Expo mobile app (`apps/mobile`) exists and consumes the real API via `packages/contracts`
- [ ] **SEC-01**: Login-first — all app functionality requires authentication (no anonymous browsing)
- [ ] **SEC-02**: Festival-scoped data is isolated by `festivalId` (one festival's data never leaks into another's context); saving/entering a festival is gate-less, not an access gate
- [ ] **I18N-01**: All UI-chrome strings are localizable via Lingui (no hardcoded strings); user-generated content (`username`/`displayName`) is not translated

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap.

### Onboarding & Auth

- **AUTH-06**: Save a festival via shared link / ticket / QR scan
- **AUTH-07**: Social login / SSO (Google/Apple) — 2027, schema kept account-linking-ready
- **AUTH-08**: Staff/admin email+password login + invite/reset flows

### Profile & Social

- **PROF-02**: Edit profile (displayName, avatar) + manage `socials[]` + `socialsVisibility`
- **FRND-02**: Friend search, requests, and connections
- **FRND-03**: "Who's here" surfaced on an interactive map via opt-in location sharing (no GPS in MVP)
- **IDN-02**: `birthDate` / `gender` / Flinta filter + signup safety disclaimer (pending Birgit's concept)

### Platform

- **TICKET-01**: `FestivalTicket` display-only QR (scan / paste / upload), offline-capable at the gate
- **CAMP-01**: `MyFestival.camp` free-text UI
- **OFF-01**: Offline-first behavior — persisted session + cached festival overview survive no connectivity
- **THEME-01**: Per-festival color theming on the festival home (light + dark)
- **NOTF-01**: Push notifications

## Out of Scope

Explicitly excluded from this milestone. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Activities / timetable-social (ADR-017) | Core differentiator; its own milestone after the shell |
| Timetable | Deep content feature; shell shows basic overview only |
| Site map / Lageplan (ADR-019) | Deep content feature; deferred |
| News / updates | Deep content feature; deferred |
| Cashless (embedded WebView) | Not needed for entry/home; per-festival URL feature, later phase |
| Help-/lend-board (ex-Tauschbörse, ADR-020) | Post-MVP differentiator |
| Activity lobby chat / realtime | Belongs with activities; realtime scope deferred |
| Admin web (`apps/admin`), two-tier admin (ADR-018) | Organizer side; visitor app is the priority this milestone |
| Password login for visitors | Visitors are OTP-only per ADR-009; password is staff/admin-only |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Complete |
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 2 | Pending |
| PLAT-02 | Phase 3 | Pending |
| I18N-01 | Phase 3 | Pending |
| AUTH-01 | Phase 4 | Pending |
| AUTH-02 | Phase 4 | Pending |
| AUTH-03 | Phase 4 | Pending |
| AUTH-04 | Phase 4 | Pending |
| AUTH-05 | Phase 4 | Pending |
| IDN-01 | Phase 4 | Pending |
| FEST-01 | Phase 5 | Pending |
| FEST-02 | Phase 5 | Pending |
| FEST-03 | Phase 5 | Pending |
| FEST-04 | Phase 5 | Pending |
| HOME-01 | Phase 5 | Pending |
| HOME-02 | Phase 5 | Pending |
| HOME-03 | Phase 6 | Pending |
| PROF-01 | Phase 6 | Pending |
| FRND-01 | Phase 6 | Pending |

**Coverage:**

- v1 requirements: 20 total
- Mapped to phases: 20 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-29*
*Last updated: 2026-07-30 after reconciliation with the binding concept phase*
