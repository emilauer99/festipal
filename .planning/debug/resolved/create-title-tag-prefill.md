---
status: resolved
trigger: "UAT phase 11 Test 3 (G-11-3): Tag-Auswahl soll Tag-Label als echten Text (value) ins Titel-Input schreiben statt nur als Placeholder; Klammer-Anmerkung am Titel-Feld entfernen. User verbatim: 'pass. aber ich will dass wenn man ein Tag will dieser dann als echter text im titel input steht und nicht nur wie aktuell als placeholder. und die anmerkung in den klammern bitte weggeben'"
created: 2026-08-16T16:45:00Z
updated: 2026-08-16T17:00:00Z
resolved: 2026-08-17 — G-11-3 closed by 11-06 (resolveTitleOnTagChange/resolveSubmittedTitle) + UAT Test 9 device-verified
---

## Current Focus

<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED — activity-create.tsx couples tag selection ONLY to the Input's placeholder prop (lines 180-183, 228); title value state (line 123) is never written on tag select/deselect; the parenthetical annotation is the placeholder msgid suffix "(used as the title automatically)" / de "(wird automatisch als Titel verwendet)"
test: complete — code read + Lingui catalog grep + contract refine read
expecting: n/a
next_action: Return ROOT CAUSE FOUND (goal: find_root_cause_only — no fix applied)
bug_class: Not a defect — requested design change (behavior is as-designed per 11-UI-SPEC.md line 174 + UAT Test 3 expected text). Deterministic localization of the implementing sites.

## Symptoms

<!-- Written during gathering, then IMMUTABLE -->

expected: Selecting a tag writes the tag label into the title input as real, editable text (value); the parenthetical annotation in/next to the title field is gone
actual: Tag label only appears as placeholder text; title stays empty; a parenthetical annotation (e.g. "(optional)") is shown
errors: None reported
reproduction: UAT Test 3 — open activity create form, select a tag chip, observe the title input
started: As-designed since phase 11 (plan: "Tag wählen → Titel optional, Placeholder zeigt Tag-Label") — design change request, not regression

## Eliminated

<!-- APPEND only - prevents re-investigating -->

## Evidence

<!-- APPEND only - facts discovered -->

- timestamp: 2026-08-16T16:45:00Z
  checked: .planning/debug/knowledge-base.md
  found: File does not exist — no knowledge base yet, no known-pattern candidates
  implication: Proceed with normal investigation

- timestamp: 2026-08-16T16:45:00Z
  checked: .planning/workstreams/mobile/phases/11-activities/11-UAT.md (gap G-11-3, Test 3)
  found: Expected UAT behavior explicitly included "Tag wählen → Titel optional, Placeholder zeigt Tag-Label" — current behavior matches the phase design; user requested change during UAT
  implication: This is a design-change diagnosis; root cause = the code sites implementing placeholder-swap + annotation, plus the title-optional validation path (D-05) that interacts with prefill

- timestamp: 2026-08-16T16:50:00Z
  checked: apps/mobile/app/activity-create.tsx (full read)
  found: "Lines 180-183: `const tagLabel = selectedTag?.title ?? ''; const titlePlaceholder = selectedTag ? t`${tagLabel} (used as the title automatically)` : t`e.g. beer pong by the pavilion`;` — the parenthetical annotation is INSIDE the placeholder string, not a separate label. Line 224-232: title Input gets `value={title}` (independent state, line 123) and `placeholder={titlePlaceholder}`. Tag chips at lines 244-253 call `setSelectedTag` toggle only — title state is never touched on tag select/deselect. Submit (line 211) sends `title: trimmedTitle.length > 0 ? trimmedTitle : null` alongside `tagId` — backend auto-title (10-02) applies only when title is null."
  implication: Root cause located — tag selection only feeds the placeholder prop; title value state has no coupling to selectedTag. The annotation "(used as the title automatically)" is part of the tag-selected placeholder msgid (Lingui-translated, so the user saw its German msgstr).

- timestamp: 2026-08-16T16:55:00Z
  checked: apps/mobile/lib/activity-form.ts (full read)
  found: "canSubmitActivity (D-05, lines 50-64) is presence-only: `titleOrTag: !hasTag && !hasTitle` — a selected tag alone satisfies it regardless of title content; title content never feeds validation beyond trim/length. buildClonePrefill (lines 144-155) copies the SERVER-RESOLVED display title (`ActivityDetail.title` — explicit title if set, else localized tag title) plus the tag object, so clone mode ALREADY lands with both selectedTag and a non-empty title value; the create screen initializes title state from it (activity-create.tsx line 123)."
  implication: No validation change needed for prefill — a prefilled (or user-cleared) title keeps the same submit outcome. But the prefill-tracking rule must handle the clone case where the initial title may exactly equal the tag label.

- timestamp: 2026-08-16T16:57:00Z
  checked: Lingui catalogs (apps/mobile/locales/{en,de}/messages.po line 47) + 11-UI-SPEC.md line 174
  found: "The annotation is one msgid: `{tagLabel} (used as the title automatically)` — de msgstr `{tagLabel} (wird automatisch als Titel verwendet)`. UI-SPEC line 174 specifies it as 'Title field placeholder — tag selected (D-05 live preview of the auto-title)'. No other parenthetical annotation exists near the title field (Subtitle/Description use '· optional', not parentheses)."
  implication: Removing the annotation = removing this one msgid usage in activity-create.tsx + re-running lingui extract (drops it from both .po files) + updating the UI-SPEC copy-table row so the spec matches the shipped behavior.

- timestamp: 2026-08-16T16:58:00Z
  checked: packages/contracts/src/schemas.ts (createActivityBodySchema lines 111-126, activityTagSchema lines 46-51, activityDetailSchema line 91-92)
  found: "The refine allows tagId AND title simultaneously (`Boolean(body.tagId) || Boolean(body.title...)`) — sending both is valid. activityTagSchema.title is a plain string the server resolves per locale (D-03/ADR-012); ActivityDetail.title is always server-resolved (explicit title wins, else localized tag title — 10-02/10-04 auto-title)."
  implication: Prefilling the value and submitting it unchanged sends an EXPLICIT title equal to the creator-locale tag label — the activity's title becomes frozen in the creator's locale and viewers in other locales lose the per-locale auto-title they get today from the tagId-only path. This is the one real semantic/i18n consequence the fix must decide on (send-as-typed vs. strip-back-to-null-if-unchanged).

## Resolution

<!-- OVERWRITE as understanding evolves -->

root_cause: "Design change, not a defect. The tag→title coupling is implemented placeholder-only: apps/mobile/app/activity-create.tsx lines 180-183 derive `titlePlaceholder` from `selectedTag` (msgid `{tagLabel} (used as the title automatically)`, de: `{tagLabel} (wird automatisch als Titel verwendet)`) and pass it as the Input's `placeholder` (line 228), while the `title` value state (line 123) is never written by the tag chips' `setSelectedTag` toggle (lines 244-253). The parenthetical annotation the user wants removed IS that placeholder msgid's suffix (locales/{en,de}/messages.po line 47; specified in 11-UI-SPEC.md line 174). Validation (D-05, lib/activity-form.ts canSubmitActivity) and the contract refine (packages/contracts/src/schemas.ts lines 111-126) are presence-based and unaffected."
fix: "NOT APPLIED (find_root_cause_only). Direction: (1) In activity-create.tsx, on tag select write `tag.title` into the `title` state — but only when the current title is empty or still equals the previously-selected tag's title (don't clobber user-typed text); on deselect/switch, clear/replace only if the title still equals the outgoing tag's label. Extract this as a pure helper (e.g. `resolveTitleOnTagChange(prevTag, nextTag, currentTitle)`) in lib/activity-form.ts — the phase's designated home for pure, node-env-testable form rules (no RN component harness exists). (2) Remove the tag-selected placeholder branch: keep the single default placeholder `e.g. beer pong by the pavilion` unconditionally, delete the annotation msgid usage, run lingui extract to drop it from en/de catalogs. (3) DECIDE the submit semantics: sending the prefilled label as explicit title freezes the creator-locale string for all viewers (loses server-side per-locale auto-title, 10-04/ADR-012); alternative preserving today's semantics is to null the title at submit when it still exactly equals selectedTag.title (tagId-only body → server auto-title). (4) Clone mode: prefill-tracking must tolerate the clone-initialized title equaling the tag label (buildClonePrefill copies the resolved title verbatim — toggling the tag off would then clear it, which is consistent). (5) Update 11-UI-SPEC.md copy table line 174 and the UAT Test 3 expected text so spec matches new behavior; close gap G-11-3 via the fixing phase."
verification: "n/a — diagnosis only"
files_changed: []
