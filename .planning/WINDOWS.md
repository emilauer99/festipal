---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-08-03T16:15:49.882Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 03 | todo | apps/mobile/lib/i18n.ts |  | activateUiLocale calls i18n.activate() but never i18n.load()s the compiled DE/EN catalogs — Trans macro currently always falls back to English source text regardless of active locale; wire in when the first real screen lands | open |  | 2026-08-03T16:15:49.882Z |  |

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
  }
]
````
