# Roadmap: quiks — Mobile (Visitor App)

> Workstream `mobile`. The admin/staff web UI is planned independently in
> `.planning/workstreams/admin/` and runs on its own milestone track — neither stream waits on
> the other. Shared collision zones (`packages/contracts`, `packages/db`, `packages/ui`) are
> changed by one stream at a time.

## Milestones

- ✅ **v1.0 Rollout — Visitor Shell** — Phases 1–6 (shipped 2026-08-12)
- 📋 **v1.1 — TBD** — next milestone, scope set via `/gsd-new-milestone --ws mobile`

## Phases

<details>
<summary>✅ v1.0 Rollout — Visitor Shell (Phases 1–6, incl. inserted 5.1) — SHIPPED 2026-08-12</summary>

- [x] Phase 1: Identity Schema & Auth Foundation (3/3 plans) — completed 2026-07-30
- [x] Phase 2: OTP Auth & Festival Backend API (6/6 plans) — completed 2026-08-02
- [x] Phase 3: Mobile App Shell & i18n Foundation (6/6 plans) — completed 2026-08-04
- [x] Phase 4: Visitor Auth & Profile Completion (7/7 plans) — completed 2026-08-05
- [x] Phase 5: Festival Selection & Home (11/11 plans) — completed 2026-08-09
- [x] Phase 5.1: quiks Rename & CI v1.0 Rollout *(INSERTED)* (7/7 plans) — completed 2026-08-11
- [x] Phase 6: Profile & Friends Placeholders (10/10 plans) — completed 2026-08-12

Full phase detail: [`milestones/v1.0-ROADMAP.md`](./milestones/v1.0-ROADMAP.md)
Requirements as shipped: [`milestones/v1.0-REQUIREMENTS.md`](./milestones/v1.0-REQUIREMENTS.md)
Phase artifacts: `milestones/v1.0-phases/`
Summary: [`MILESTONES.md`](./MILESTONES.md)

</details>

## Carried Into the Next Milestone

Items that survived v1.0 close and must be scheduled, not rediscovered:

- **T-06-06 — profile visibility policy (blocking for FRND-02/PROF-02).**
  `visitorProfilePublicSchema` carries `birthDate`/`gender` with no visibility policy. Before the
  first endpoint that serves a *foreign* profile, the projection must split into an owner view and a
  friend view. This is a backend slice and belongs at the *front* of any Friends milestone.
- **IDN-02** — per-field visibility, age threshold, Flinta filter, signup safety disclaimer. Still
  pending Birgit's concept; gates the same surface as T-06-06.
- **Tab route rename** — route is `home`, design and DE catalog say „Start". Decided; do it before
  new routes land, since it touches the deep-link capture path.
- **`/gsd-ui-review 06`** — never run; the 6-pillar visual audit of the Phase-6 screens.
- **iOS on-device verification** — deferred since Phase 3 (no Mac/Xcode toolchain).
- **`.planning/WINDOWS.md`** — 26 open entries, largely stale `unrun-verify` items from Phase 5 that
  the Phase-5/6 UATs later covered. Needs a reconciliation pass; the ledger currently overstates debt.
