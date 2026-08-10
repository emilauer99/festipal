#!/usr/bin/env bash
# GSD plan_bounce refiner — reviews ONE PLAN.md against the repo with Codex and
# applies improvements in place. Wired via workflow.plan_bounce_script.
#
# Contract (gsd-core/workflows/plan-phase.md §12 "Bounce Plans"):
#   $1 = path to the PLAN.md to refine   (required)
#   $2 = max bounce passes               (informational; GSD loops externally)
#   - Refine the plan in place, preserving YAML frontmatter, then exit 0.
#   - Exit non-zero  => GSD restores the original from its pre-bounce backup.
#   - GSD also re-validates the frontmatter and re-runs the plan-checker, and
#     reverts the file if either fails. A bad refinement can therefore only no-op,
#     never corrupt a plan.
#
# Disable at any time:  gsd config-set workflow.plan_bounce false
set -uo pipefail

PLAN="${1:-}"
if [ -z "$PLAN" ] || [ ! -f "$PLAN" ]; then
  echo "plan-bounce: missing or invalid PLAN.md path: '${PLAN}'" >&2
  exit 2
fi

# Make codex reachable even from a shell whose PATH predates the install.
if ! command -v codex >/dev/null 2>&1; then
  export PATH="/c/Users/Emil/AppData/Local/Programs/OpenAI/Codex/bin:$PATH"
fi
if ! command -v codex >/dev/null 2>&1; then
  echo "plan-bounce: codex CLI not found on PATH — skipping refinement (original kept)" >&2
  exit 3
fi

REPO="$(git -C "$(dirname "$PLAN")" rev-parse --show-toplevel 2>/dev/null || pwd)"

# Hard wall-clock cap so a slow/agentic run can never hang planning. On timeout the
# script exits non-zero and GSD keeps the original plan (safe no-op). Override with
# PLAN_BOUNCE_TIMEOUT (seconds).
CODEX_TIMEOUT="${PLAN_BOUNCE_TIMEOUT:-360}"

read -r -d '' PROMPT <<EOF
You are refining ONE implementation plan for the festipal monorepo before it is executed.

TARGET FILE (edit this file in place, and ONLY this file): ${PLAN}

Steps:
1. Read ${PLAN} in full.
2. Verify its claims against the ACTUAL repository source at ${REPO} — open the
   referenced files, contracts, db schema, services, routes, and tests. This is a
   greenfield mobile phase, so some referenced files are planned-but-absent; that
   is expected. Only flag claims about files that ALREADY EXIST and are wrong.
3. Apply concrete improvements directly to ${PLAN}:
   - correct wrong file/line references, wrong API/response shapes, and files that
     are modified in reality but missing from files_modified
   - close missing edge cases, error handling, dependency-ordering issues, and
     multi-tenant gaps (every festival-scoped query must be festivalId-scoped)
   - tighten task steps so they are execution-ready

HARD CONSTRAINTS — violating any of these is worse than making no change:
 - Preserve the YAML frontmatter block (opening '---' through closing '---') and
   ALL of its keys and values byte-for-byte. Never touch the frontmatter.
 - Keep the existing section structure and heading names. Refine content in place;
   do not restructure or re-order wholesale.
 - Do not delete tasks or reduce scope. Only correct, tighten, or add.
 - Edit ONLY ${PLAN}. Do not create or modify any other file.
 - If the plan is already sound, make no changes.

Do not print the plan back in your reply; just edit the file.
EOF

# Non-interactive, workspace-write so Codex can edit the plan; approvals off; low
# reasoning effort keeps the agentic pass fast enough to run as a per-plan gate.
# stdin MUST be /dev/null: with a prompt arg present, codex otherwise blocks on
# stdin ("Reading additional input from stdin...") and never starts work.
timeout "$CODEX_TIMEOUT" codex exec \
  -s workspace-write \
  -c approval_policy="never" \
  -c model_reasoning_effort="low" \
  -C "$REPO" \
  --skip-git-repo-check \
  -o /dev/null \
  "$PROMPT" </dev/null >&2
RC=$?

# Timeout is a BUDGET, not a failure. Codex applies each edit as an atomic
# full-file write, so whatever it refined within the budget is a complete, valid
# plan. Keep it if the frontmatter is intact; GSD re-runs the plan-checker as a
# second guard and reverts if the refined plan does not hold up.
if [ "$RC" -eq 124 ]; then
  if head -1 "$PLAN" | grep -q '^---'; then
    echo "plan-bounce: hit ${CODEX_TIMEOUT}s budget for ${PLAN}; keeping refinements made so far" >&2
    exit 0
  fi
  echo "plan-bounce: timeout AND damaged frontmatter in ${PLAN} — signalling failure" >&2
  exit 4
fi
if [ "$RC" -ne 0 ]; then
  echo "plan-bounce: codex exec exited ${RC} for ${PLAN} — GSD will restore the original" >&2
  exit "$RC"
fi

# Cheap local frontmatter guard before handing back to GSD's own validation.
if ! head -1 "$PLAN" | grep -q '^---'; then
  echo "plan-bounce: frontmatter delimiter lost in ${PLAN} — signalling failure" >&2
  exit 4
fi

exit 0
