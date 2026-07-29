# Requirements: festipal — Visitor Shell

**Defined:** 2026-07-29
**Core Value:** A festival visitor can get into the app, connect to their festival, and reach everything about their festival experience from one home screen.

## v1 Requirements

Requirements for the visitor-shell slice (navigable, online, mobile-first). Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: A visitor can register a global account with email and password
- [ ] **AUTH-02**: A visitor can log in with email and password
- [ ] **AUTH-03**: A visitor's session persists across app restarts (they land logged-in on reopen)
- [ ] **AUTH-04**: A visitor can log out
- [ ] **AUTH-05**: Auth and form-validation errors are shown clearly and understandably

### Festival Selection

- [ ] **FEST-01**: A visitor can browse a list of festivals showing name, dates, and place
- [ ] **FEST-02**: The list distinguishes festivals the visitor has joined from joinable ones
- [ ] **FEST-03**: A visitor can join a festival from the list in one tap
- [ ] **FEST-04**: A visitor can return to the festival list from inside a festival

### Home & Navigation

- [ ] **HOME-01**: After selecting/joining a festival, the visitor lands on that festival's main menu / home
- [ ] **HOME-02**: The home shows a basic festival overview (identity + key facts) the visitor can open
- [ ] **HOME-03**: The home provides navigation to Profile and Friends

### Profile (placeholder)

- [ ] **PROF-01**: A visitor can open a Profile screen showing their name, email, and avatar/initials (view-only)

### Friends (placeholder)

- [ ] **FRND-01**: A visitor can open a Friends screen with a clear, non-broken empty state

### Platform & Security

- [ ] **PLAT-01**: Global user accounts exist independently of any festival (not tenant-scoped)
- [ ] **PLAT-02**: The Expo mobile app (`apps/mobile`) exists and consumes the real API via `packages/contracts`
- [ ] **SEC-01**: Festival-scoped data is only accessible to a visitor who has joined that festival (cross-tenant access is denied)
- [ ] **I18N-01**: All user-facing strings in the shell are localizable via Lingui (no hardcoded strings)

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap.

### Onboarding & Auth

- **AUTH-06**: Join a festival via code / ticket / QR scan
- **AUTH-07**: Social login (OAuth)

### Profile & Social

- **PROF-02**: Edit profile (name, avatar)
- **FRND-02**: Friend search, requests, and connections
- **FRND-03**: Presence / "who's here now" at a festival

### Platform

- **OFF-01**: Offline-first behavior — persisted session + cached festival overview survive no connectivity
- **THEME-01**: Per-festival color theming on the festival home
- **NOTF-01**: Push notifications

## Out of Scope

Explicitly excluded from this milestone. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Timetable | Deep content feature; shell shows basic overview only, deferred to a later phase |
| Site map (MapLibre) | Deep content feature; deferred |
| News / updates | Deep content feature; deferred |
| Cashless (embedded WebView) | Not needed for entry/home; per-festival URL feature, later phase |
| Swap marketplace | Core differentiator; its own milestone |
| Admin web (`apps/admin`) | Organizer side; visitor app is the priority this milestone |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (to be filled by roadmap) | — | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 18 ⚠️

---
*Requirements defined: 2026-07-29*
*Last updated: 2026-07-29 after initial definition*
