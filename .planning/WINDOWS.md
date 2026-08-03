---
schema_version: 1
open_count: 2
waived_count: 0
fixed_count: 0
total_count: 2
last_updated: 2026-08-03T16:40:15.840Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 03 | todo | apps/mobile/lib/i18n.ts |  | activateUiLocale calls i18n.activate() but never i18n.load()s the compiled DE/EN catalogs — Trans macro currently always falls back to English source text regardless of active locale; wire in when the first real screen lands | open |  | 2026-08-03T16:15:49.882Z |  |
| 2 | 03 | todo | apps/api/src/auth/auth.instance.ts |  | Server-side better-auth instance is missing the @better-auth/expo server plugin (plugins: [expo()]). Without it, the expo-origin header the mobile client sends is never translated to the standard origin header, so any cookie-bearing state-changing better-auth endpoint (e.g. a future sign-out) will 403 with INVALID_ORIGIN/MISSING_OR_NULL_ORIGIN. Not exercised by Phase 3's OTP-login-only scope (no logout feature planned in Plans 04-06) but must be added before any session-revocation/logout feature ships. | open |  | 2026-08-03T16:40:15.840Z |  |

````json
[
  {
    "id": 1,
    "kind": "todo",
    "phase": "03",
    "file": "apps/mobile/lib/i18n.ts",
    "line": null,
    "description": "activateUiLocale calls i18n.activate() but never i18n.load()s the compiled DE/EN catalogs — Trans macro currently always falls back to English source text regardless of active locale; wire in when the first real screen lands",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-03T16:15:49.882Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "todo",
    "phase": "03",
    "file": "apps/api/src/auth/auth.instance.ts",
    "line": null,
    "description": "Server-side better-auth instance is missing the @better-auth/expo server plugin (plugins: [expo()]). Without it, the expo-origin header the mobile client sends is never translated to the standard origin header, so any cookie-bearing state-changing better-auth endpoint (e.g. a future sign-out) will 403 with INVALID_ORIGIN/MISSING_OR_NULL_ORIGIN. Not exercised by Phase 3's OTP-login-only scope (no logout feature planned in Plans 04-06) but must be added before any session-revocation/logout feature ships.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-03T16:40:15.840Z",
    "resolved_at": null
  }
]
````
