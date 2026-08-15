---
status: complete
phase: 10-activities-backend
source: [10-VERIFICATION.md]
started: 2026-08-15T00:50:00Z
updated: 2026-08-15T10:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Prohibition P1 — kein client-gesetzter Actor/Scope (10-01)

expected: |
  "No activity or tag endpoint accepts the acting visitor's identity from a request body,
  query parameter or path segment — caller from the better-auth session only, festivalId
  from the path only." Review the contract walk in
  apps/api/test/activity-tenant-structure.spec.ts Part 2 and confirm the forbidden key set
  matches your intent. Mechanically enforced (spec ran green, 8 routes walked, non-vacuum
  guard >= 7); LLM-judge verdict PASS (non-authoritative).
result: pass

### 2. Prohibition P2 — kein Präsenz-/Ortssignal aus Aktivitätsdaten (10-01)

expected: |
  "No presence, location-watch or 'who is here' signal is derived from activity or tag
  data — ADR-014 excludes it; the ADR-017 §2 geo point stays a one-off opt-in capture."
  No endpoint reports who is currently where; `joined` is a declaration of intent, not
  presence; `geoLat`/`geoLng` are a single nullable pair on the activity row (pair + range
  CHECKs) with no time series, watcher, or update endpoint. Skim
  packages/contracts/src/router.ts (activity routes) and packages/db/src/schema/activity.ts.
  LLM-judge verdict PASS (non-authoritative) — genuine semantic judgment call.
result: pass

### 3. Prohibition P3 — Teilnehmer-Payload nur Sechs-Feld-Fremdsicht (10-04)

expected: |
  "The participant payload never carries a field outside the six-key foreign view — no
  birthDate, no e-mail, no my_festival value, no second projection inside the activity
  module." Detail participants are exactly { profile: <six keys>, joinedAt }; asserted by
  key EQUALITY in projection-uniqueness.spec.ts and activity-discovery.spec.ts case 4
  (both ran green). Confirm the projection-uniqueness gate covers the new
  `activityParticipantSchema` embedding to your satisfaction.
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
