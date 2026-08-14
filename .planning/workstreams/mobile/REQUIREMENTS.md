# Requirements: quiks Mobile — v1.1 Activities & Friends

> Scoped to milestone **v1.1**. The v1.0 "Visitor Shell" requirements shipped and are archived in
> [`milestones/v1.0-REQUIREMENTS.md`](./milestones/v1.0-REQUIREMENTS.md).
>
> Grounded in decisions that are already binding — do not re-litigate without an ADR:
> **ADR-014** friendships are user-global and there is no presence/"who is here" GPS ·
> **ADR-017** the `Activity` / `ActivityTag` model, lobby chat per activity, one-off opt-in geo point ·
> **ADR-020** no 1:1 DM between users, ever · **ADR-010** realtime via NestJS WS gateway + Redis.

## v1.1 Requirements

### Visibility & Profile Projection (VIS)

Resolves **T-06-06**, the open obligation carried out of v1.0. This is the first milestone in which
an endpoint serves a *foreign* profile, so the projection split is a prerequisite, not a polish item.

- [x] **VIS-01**: A visitor sees every field on their own profile; a *foreign* profile returns only the friend-view projection — no `birthDate`, no e-mail
- [x] **VIS-02**: Search results and request previews use that same friend-view projection — there is no second code path through which owner-only fields can escape

### Friends (FRND)

- [x] **FRND-02**: A visitor can send a friend request via quiks-code / handle
- [x] **FRND-03**: A visitor can find someone by username search and send a request
- [x] **FRND-04**: A visitor can display their own handle as a QR code and scan someone else's to send a request
- [x] **FRND-05**: A visitor can see incoming and outgoing requests and accept, decline, or withdraw them
- [x] **FRND-06**: A visitor sees their friends list; friendships are user-global and survive switching festivals (ADR-014)
- [x] **FRND-07**: Inside a festival, a visitor sees which of their friends have saved that festival — the intersection only, never a presence signal (ADR-014)
- [x] **FRND-08**: A visitor can end a friendship

### Activities (ACT)

- [ ] **ACT-01**: A visitor can create an activity with either a tag or a title, plus optional subtitle and description, a location, a start time, and a capacity
- [ ] **ACT-02**: A visitor can discover the activities of the festival they are in
- [ ] **ACT-03**: A visitor can join and leave an activity up to its capacity; the creator is an attendee from the start
- [ ] **ACT-04**: A visitor can clone an existing activity — fields prefilled, only time and place changed
- [ ] **ACT-05**: An activity's location is free text plus an optional one-off geo point that opens a route in an external maps app (explicitly not presence tracking, ADR-017)
- [ ] **ACT-06**: The selectable tag list is the festival's enabled global tags ∪ its own custom tags

### Lobby Chat (CHAT)

- [ ] **CHAT-01**: Attendees of an activity get a group chat scoped to that activity — never a 1:1 DM (ADR-020)
- [ ] **CHAT-02**: Messages arrive live; after a reconnect the recent history loads
- [ ] **CHAT-03**: Leaving an activity ends chat access to it

### Festival Navigation (NAV)

- [x] **NAV-01**: Inside a festival, a five-tab bar: Live · quiks · Crew · Timetable · Karte (renamed from Dashboard · Aktivitäten · Friends · Timetable · Lageplan, 09-07 gap closure / ADR-014 change note, 2026-08-14)
- [x] **NAV-02**: The Timetable and Karte tabs are honest placeholders in the D-11/D-13 pattern — each names its precondition instead of simulating a working surface
- [x] **NAV-03**: The first global tab is `start` in the route as well as in the UI

### Security (SEC)

- [ ] **SEC-03**: Every new festival-scoped table (`activity`, the tag junction, `activity_message`) is `festivalId`-isolated, each with its own cross-tenant test — the SEC-02 obligation inherited from v1.0

## Future Requirements

Deferred beyond v1.1. Tracked, not scheduled.

- **FRND-09**: Block and report a user. **Flagged at scoping and consciously deferred.** Note the exposure this creates: v1.1 is the first release in which a stranger can send you a request and find you by username, and it ships without any way to stop them. Schedule this before, not after, the first real user cohort.
- **NOTF-01**: Push notifications for friend requests and chat messages. Without it a visitor learns of neither while the app is closed — v1.1 chat is therefore foreground-only in practice.
- **ActInterest** — "friends are going" on timetable acts (ADR-017 §4); depends on the timetable, which is not in this milestone.
- **FRND-03b**: Presence / "friends on the map" via opt-in location sharing — the later ADR-008/ADR-014 stage, needs its own location, visibility and retention rules.
- **PROF-02**: Edit profile (`displayName`, avatar) and manage `socials[]` + `socialsVisibility`.
- **IDN-02**: Per-field visibility, age threshold, Flinta filter, signup safety disclaimer — pending Birgit's concept. Overlaps the VIS surface; VIS-01/02 deliberately solve only the projection split, not the policy question.

## Out of Scope

Explicitly excluded from v1.1.

| Item | Reason |
|---|---|
| Timetable and Lageplan *content* | Only the tab shells ship (NAV-02). The content features are their own milestone. |
| 1:1 direct messages | Permanently excluded by ADR-020 — chat exists only per activity. |
| Presence / "who is here" via GPS | Excluded by ADR-014. FRND-07 is a saved-festival intersection, not a location signal. |
| Cashless | Per-festival embedded URL (ADR-011); belongs with the festival dashboard content. |
| Help/lend board (ex-Tauschbörse, ADR-020) | Post-MVP differentiator, own milestone. |
| Admin-side tag catalog management | Belongs to the `admin` workstream (ADR-018). Mobile only *consumes* the effective tag list. |
| Offline creation of activities or chat messages | ADR: activity create/join and chat send are online-only. Caching the read side is in scope where it is free. |

## Traceability

Every v1.1 requirement maps to exactly one phase. 20/20 covered.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VIS-01 | Phase 7 | Complete |
| VIS-02 | Phase 7 | Complete |
| FRND-02 | Phase 8 | Complete |
| FRND-03 | Phase 8 | Complete |
| FRND-04 | Phase 8 | Complete |
| FRND-05 | Phase 8 | Complete |
| FRND-06 | Phase 8 | Complete |
| FRND-08 | Phase 8 | Complete |
| FRND-07 | Phase 9 | Complete (09-02 backend + 09-05 UI shipped; device UAT pending, WINDOWS.md #44/#45) |
| NAV-01 | Phase 9 | Complete (09-03 five-tab bar; 09-06 Cashless Dashboard entry — device UAT pending, WINDOWS.md #46) |
| NAV-02 | Phase 9 | Complete (09-03) |
| NAV-03 | Phase 9 | Complete (09-01) |
| SEC-03 | Phase 10 | Planned |
| ACT-01 | Phase 11 | Planned |
| ACT-02 | Phase 11 | Planned |
| ACT-03 | Phase 11 | Planned |
| ACT-04 | Phase 11 | Planned |
| ACT-05 | Phase 11 | Planned |
| ACT-06 | Phase 11 | Planned |
| CHAT-01 | Phase 12 | Planned |
| CHAT-02 | Phase 12 | Planned |
| CHAT-03 | Phase 12 | Planned |

**Note on backend phases.** Phases 7 and 10 carry few requirement IDs (VIS-01/02 and SEC-03) but
substantial work — the friendship model, request lifecycle and username search in Phase 7, and the
whole activity/tag/attendee model in Phase 10. Requirements here are written user-centrically
("A visitor can…"), so they are only *observable* once the UI phase lands. The backend phases'
"Also lands" blocks in ROADMAP.md record that substrate explicitly so a later verification pass does
not mistake a thin requirement list for a thin phase.
