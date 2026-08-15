import type { ActivityDetail, ActivityTag } from '@quiks/contracts';

/**
 * The three pure form rules of Phase 11 (11-03-PLAN Task 1). Framework-free
 * (no React/React Native/`expo-*`/`@lingui/*` import) so this module stays
 * importable under the node-env Vitest runner — this project has no RN
 * component test harness, so every screen-level truth is on-device UAT and
 * every provable rule belongs here (STATE.md structural limitation).
 */

/**
 * The create-form's live state, as far as `canSubmitActivity` needs it.
 * `selectedDay`/`selectedTime` are typed loosely on purpose — the screen owns
 * the exact day-chip identifier and time-picker value shapes; this module
 * only ever checks them for presence (`null` vs. not), never their content.
 */
export type ActivityFormState = {
  tagId: string | null;
  title: string;
  selectedDay: string | null;
  selectedTime: Date | null;
};

/**
 * Per-field block reasons — MACHINE markers, never display text (the screen
 * owns the Copywriting Contract's German/English sentences and maps these
 * codes to them). `titleOrTag` covers the D-05 tag-or-title rule as ONE
 * combined reason (there is one inline error under the title field for it,
 * per UI-SPEC's Copywriting Contract); `day`/`time` are separate so the
 * screen can show two independent inline errors instead of one shared one.
 */
export type ActivityFormReasons = {
  titleOrTag: boolean;
  day: boolean;
  time: boolean;
};

export type CanSubmitActivityResult =
  | { canSubmit: true }
  | { canSubmit: false; reasons: ActivityFormReasons };

/**
 * ACT-01/D-05 — the ONE client-side home of the tag-or-title rule. Mirrors
 * (never duplicates the code of) `createActivityBodySchema.refine`
 * (`packages/contracts/src/schemas.ts`): a selected tag OR a non-empty,
 * TRIMMED title. A day/time selection never rescues a missing tag-or-title —
 * the three checks are independent, so the caller can render up to three
 * distinct inline errors (T-11-07).
 */
export function canSubmitActivity(form: ActivityFormState): CanSubmitActivityResult {
  const hasTag = form.tagId !== null;
  const hasTitle = form.title.trim().length > 0;

  const reasons: ActivityFormReasons = {
    titleOrTag: !hasTag && !hasTitle,
    day: form.selectedDay === null,
    time: form.selectedTime === null,
  };

  if (!reasons.titleOrTag && !reasons.day && !reasons.time) {
    return { canSubmit: true };
  }
  return { canSubmit: false, reasons };
}

/**
 * D-10's three-way (four-way, counting `alreadyJoined`) disabled reason,
 * resolved BEFORE submit so the Join button can show why it is disabled
 * instead of only failing after a tap. Priority order, most-specific first:
 *
 * 1. `alreadyJoined` — the caller is already a participant. Checked FIRST,
 *    ahead of `started`/`full`, so a joined visitor whose activity has since
 *    started or filled up still gets `alreadyJoined` (not `started`) — the
 *    caller needs this to render Leave, not a disabled Join button (the two
 *    are different controls entirely).
 * 2. `started` — the activity's `startTime` is at or before `now`. Blocks
 *    regardless of capacity (T-11-08's server-side enforcement mirror).
 * 3. `full` — `capacity` is non-null and `participantCount` has reached it.
 *    `capacity === null` is unconditionally unbounded and can never reach
 *    this branch.
 * 4. `joinable` — none of the above.
 *
 * `now` is a PARAMETER, never `new Date()` inside this module — the acceptance
 * criteria require this function to be deterministically testable, and a
 * module-level clock read would make it flaky.
 *
 * Tie-break (documented, not left implicit): a `startTime` EXACTLY equal to
 * `now` resolves to `started`, not `joinable` — "at this instant" reads as
 * "already begun," and this asymmetry keeps the function total and
 * deterministic at the boundary (see the activity-form.test.ts case for it).
 */
export type JoinabilityResult =
  | { status: 'joinable' }
  | { status: 'alreadyJoined' }
  | { status: 'full'; joined: number; capacity: number }
  | { status: 'started' };

export function resolveJoinability(
  activity: Pick<ActivityDetail, 'joined' | 'startTime' | 'capacity' | 'participantCount'>,
  now: Date,
): JoinabilityResult {
  if (activity.joined) {
    return { status: 'alreadyJoined' };
  }

  const hasStarted = new Date(activity.startTime).getTime() <= now.getTime();
  if (hasStarted) {
    return { status: 'started' };
  }

  if (activity.capacity !== null && activity.participantCount >= activity.capacity) {
    return { status: 'full', joined: activity.participantCount, capacity: activity.capacity };
  }

  return { status: 'joinable' };
}

/**
 * ACT-04/D-12/D-15 — the create-screen's clone-mode prefill. `tag`, `title`,
 * `subtitle`, `description`, `location` and `capacity` are copied VERBATIM
 * from the source (never invented, never substituted — a `null` on the
 * source stays `null` here). `startTime` and `geo` are explicitly and always
 * `null`, a deliberate, user-chosen deviation from the recommended default
 * (D-15: "gegen die Empfehlung") — do NOT "fix" this back to carrying either
 * over.
 *
 * `title` is copied as the source's own RESOLVED display title
 * (`ActivityDetail.title` is always the server-resolved string — explicit
 * title if one was set, otherwise the localized tag title). This module never
 * reconstructs a resolved title itself (the plan's own prohibition); it only
 * ever copies the one the server already produced.
 */
export type ActivityClonePrefill = {
  tag: ActivityTag | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  location: string | null;
  capacity: number | null;
  startTime: null;
  geo: null;
};

export function buildClonePrefill(source: ActivityDetail): ActivityClonePrefill {
  return {
    tag: source.tag,
    title: source.title,
    subtitle: source.subtitle,
    description: source.description,
    location: source.location,
    capacity: source.capacity,
    startTime: null,
    geo: null,
  };
}
