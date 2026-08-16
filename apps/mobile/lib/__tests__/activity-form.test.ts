import { describe, expect, it } from 'vitest';
import type { ActivityDetail, ActivityTag } from '@quiks/contracts';

import {
  buildClonePrefill,
  canSubmitActivity,
  resolveJoinability,
  resolveSubmittedTitle,
  resolveTitleOnTagChange,
  type ActivityFormState,
} from '../activity-form';

const FESTIVAL_ID = '11111111-1111-1111-1111-111111111111';
const ACTIVITY_ID = '22222222-2222-2222-2222-222222222222';
const TAG_ID = '33333333-3333-3333-3333-333333333333';
const OTHER_TAG_ID = '55555555-5555-5555-5555-555555555555';
const CREATOR_ID = '44444444-4444-4444-4444-444444444444';

function activityTag(overrides: Partial<ActivityTag> = {}): ActivityTag {
  return {
    id: TAG_ID,
    slug: 'sport',
    title: 'Sport',
    ...overrides,
  };
}

function formState(overrides: Partial<ActivityFormState> = {}): ActivityFormState {
  return {
    tagId: null,
    title: '',
    selectedDay: null,
    selectedTime: null,
    ...overrides,
  };
}

describe('canSubmitActivity (ACT-01/D-05 — the tag-or-title rule, mirroring createActivityBodySchema.refine)', () => {
  it('is submittable when a tag is set and the title is empty', () => {
    const result = canSubmitActivity(
      formState({ tagId: TAG_ID, title: '', selectedDay: '2026-08-20', selectedTime: new Date() }),
    );
    expect(result.canSubmit).toBe(true);
  });

  it('is submittable when no tag is set but the title is set', () => {
    const result = canSubmitActivity(
      formState({
        tagId: null,
        title: 'Beerpong am Pavillon',
        selectedDay: '2026-08-20',
        selectedTime: new Date(),
      }),
    );
    expect(result.canSubmit).toBe(true);
  });

  it('is NOT submittable with no tag and an empty title', () => {
    const result = canSubmitActivity(
      formState({ tagId: null, title: '', selectedDay: '2026-08-20', selectedTime: new Date() }),
    );
    expect(result.canSubmit).toBe(false);
    if (!result.canSubmit) {
      expect(result.reasons.titleOrTag).toBe(true);
    }
  });

  it('is NOT submittable with no tag and a whitespace-only title (mirrors the server .trim() rule)', () => {
    const result = canSubmitActivity(
      formState({ tagId: null, title: '   ', selectedDay: '2026-08-20', selectedTime: new Date() }),
    );
    expect(result.canSubmit).toBe(false);
    if (!result.canSubmit) {
      expect(result.reasons.titleOrTag).toBe(true);
    }
  });

  it('is submittable when both a tag and a title are set', () => {
    const result = canSubmitActivity(
      formState({
        tagId: TAG_ID,
        title: 'Beerpong am Pavillon',
        selectedDay: '2026-08-20',
        selectedTime: new Date(),
      }),
    );
    expect(result.canSubmit).toBe(true);
  });

  it('stays NOT submittable when no tag and no title, even with a chosen day and time (day/time never rescue the tag-or-title rule)', () => {
    const result = canSubmitActivity(
      formState({ tagId: null, title: '', selectedDay: '2026-08-20', selectedTime: new Date() }),
    );
    expect(result.canSubmit).toBe(false);
    if (!result.canSubmit) {
      expect(result.reasons.titleOrTag).toBe(true);
      expect(result.reasons.day).toBe(false);
      expect(result.reasons.time).toBe(false);
    }
  });

  it('additionally requires a selected day — blocked with its own reason, independent of the tag-or-title state', () => {
    const result = canSubmitActivity(
      formState({ tagId: TAG_ID, title: '', selectedDay: null, selectedTime: new Date() }),
    );
    expect(result.canSubmit).toBe(false);
    if (!result.canSubmit) {
      expect(result.reasons.day).toBe(true);
      expect(result.reasons.titleOrTag).toBe(false);
      expect(result.reasons.time).toBe(false);
    }
  });

  it('additionally requires a selected time — blocked with its own reason, independent of the tag-or-title state', () => {
    const result = canSubmitActivity(
      formState({ tagId: TAG_ID, title: '', selectedDay: '2026-08-20', selectedTime: null }),
    );
    expect(result.canSubmit).toBe(false);
    if (!result.canSubmit) {
      expect(result.reasons.time).toBe(true);
      expect(result.reasons.titleOrTag).toBe(false);
      expect(result.reasons.day).toBe(false);
    }
  });

  it('missing day AND missing time surface as two independent reasons, not one shared one', () => {
    const result = canSubmitActivity(
      formState({ tagId: TAG_ID, title: '', selectedDay: null, selectedTime: null }),
    );
    expect(result.canSubmit).toBe(false);
    if (!result.canSubmit) {
      expect(result.reasons.day).toBe(true);
      expect(result.reasons.time).toBe(true);
    }
  });

  it('reason codes are machine markers, never a German or English display sentence', () => {
    const result = canSubmitActivity(formState());
    expect(result.canSubmit).toBe(false);
    if (!result.canSubmit) {
      for (const key of Object.keys(result.reasons)) {
        expect(key).not.toMatch(/\s/);
      }
    }
  });
});

function activityDetail(overrides: Partial<ActivityDetail> = {}): ActivityDetail {
  return {
    id: ACTIVITY_ID,
    festivalId: FESTIVAL_ID,
    creatorId: CREATOR_ID,
    subtitle: null,
    description: null,
    location: null,
    tag: null,
    title: 'Beerpong',
    geo: null,
    startTime: '2026-08-20T18:00:00.000Z',
    capacity: null,
    participantCount: 1,
    joined: false,
    participants: [],
    ...overrides,
  };
}

const NOW = new Date('2026-08-20T12:00:00.000Z');

describe('resolveJoinability (ACT-03/D-10 — the three-way disabled reason, shown before submit)', () => {
  it('capacity null is always joinable, regardless of participant count', () => {
    const activity = activityDetail({
      capacity: null,
      participantCount: 500,
      startTime: '2026-08-21T00:00:00.000Z',
    });
    expect(resolveJoinability(activity, NOW)).toEqual({ status: 'joinable' });
  });

  it('is joinable when participants are under capacity and the start time is in the future', () => {
    const activity = activityDetail({
      capacity: 8,
      participantCount: 5,
      startTime: '2026-08-21T00:00:00.000Z',
    });
    expect(resolveJoinability(activity, NOW)).toEqual({ status: 'joinable' });
  });

  it('is locked as "full" when participants equal capacity and the start time is in the future, carrying both numbers', () => {
    const activity = activityDetail({
      capacity: 8,
      participantCount: 8,
      startTime: '2026-08-21T00:00:00.000Z',
    });
    expect(resolveJoinability(activity, NOW)).toEqual({ status: 'full', joined: 8, capacity: 8 });
  });

  it('is locked as "started" when the start time is in the past, regardless of capacity', () => {
    const activity = activityDetail({
      capacity: 8,
      participantCount: 2,
      startTime: '2026-08-20T00:00:00.000Z',
    });
    expect(resolveJoinability(activity, NOW)).toEqual({ status: 'started' });
  });

  it('a full-AND-already-started activity resolves to "started" (the more relevant reason), not "full"', () => {
    const activity = activityDetail({
      capacity: 2,
      participantCount: 2,
      startTime: '2026-08-20T00:00:00.000Z',
    });
    expect(resolveJoinability(activity, NOW)).toEqual({ status: 'started' });
  });

  it('a startTime EXACTLY equal to the comparison timestamp deterministically resolves to "started"', () => {
    const activity = activityDetail({
      capacity: null,
      participantCount: 1,
      startTime: NOW.toISOString(),
    });
    expect(resolveJoinability(activity, NOW)).toEqual({ status: 'started' });
  });

  it('an activity the caller already joined reports "alreadyJoined", never "joinable", so the caller can render Leave instead of Join', () => {
    const activity = activityDetail({
      joined: true,
      capacity: 8,
      participantCount: 3,
      startTime: '2026-08-21T00:00:00.000Z',
    });
    expect(resolveJoinability(activity, NOW)).toEqual({ status: 'alreadyJoined' });
  });

  it('"alreadyJoined" takes priority even when the activity has since started or is full', () => {
    const activity = activityDetail({
      joined: true,
      capacity: 2,
      participantCount: 2,
      startTime: '2026-08-20T00:00:00.000Z',
    });
    expect(resolveJoinability(activity, NOW)).toEqual({ status: 'alreadyJoined' });
  });
});

describe('buildClonePrefill (ACT-04/D-12/D-15 — literal field carry-over, startTime and geo explicitly emptied)', () => {
  it('copies tag, title, subtitle, description, location and capacity verbatim from the source', () => {
    const source = activityDetail({
      tag: { id: TAG_ID, slug: 'sport', title: 'Sport' },
      title: 'Beerpong am Pavillon',
      subtitle: 'Bring your own cup',
      description: 'Casual round, all welcome.',
      location: 'Reihe 3',
      capacity: 8,
    });
    const prefill = buildClonePrefill(source);
    expect(prefill.tag).toEqual(source.tag);
    expect(prefill.title).toBe(source.title);
    expect(prefill.subtitle).toBe(source.subtitle);
    expect(prefill.description).toBe(source.description);
    expect(prefill.location).toBe(source.location);
    expect(prefill.capacity).toBe(source.capacity);
  });

  it('explicitly empties startTime in the prefill (D-15)', () => {
    const source = activityDetail({ startTime: '2026-08-20T18:00:00.000Z' });
    const prefill = buildClonePrefill(source);
    expect(prefill.startTime).toBeNull();
  });

  it('explicitly empties geo in the prefill, even when the source has a captured point (D-15)', () => {
    const source = activityDetail({ geo: { lat: 48.2, lng: 16.37 } });
    const prefill = buildClonePrefill(source);
    expect(prefill.geo).toBeNull();
  });

  it('a source with capacity null prefills capacity null, never a substitute value', () => {
    const source = activityDetail({ capacity: null });
    const prefill = buildClonePrefill(source);
    expect(prefill.capacity).toBeNull();
  });

  it('a source with no subtitle/description/location prefills empty (null) values, never invented text', () => {
    const source = activityDetail({ subtitle: null, description: null, location: null });
    const prefill = buildClonePrefill(source);
    expect(prefill.subtitle).toBeNull();
    expect(prefill.description).toBeNull();
    expect(prefill.location).toBeNull();
  });

  it('a source with no tag prefills a null tag, never an invented one', () => {
    const source = activityDetail({ tag: null });
    const prefill = buildClonePrefill(source);
    expect(prefill.tag).toBeNull();
  });
});

describe('resolveTitleOnTagChange (G-11-3 — tag selection writes the title, typed text always survives)', () => {
  it('writes the new tag label when the title field is empty', () => {
    const nextTag = activityTag();
    const result = resolveTitleOnTagChange({ previousTag: null, nextTag, currentTitle: '' });
    expect(result).toBe(nextTag.title);
  });

  it('writes the new tag label when the title field holds only whitespace', () => {
    const nextTag = activityTag();
    const result = resolveTitleOnTagChange({ previousTag: null, nextTag, currentTitle: '   ' });
    expect(result).toBe(nextTag.title);
  });

  it('leaves a user-typed title unchanged when a tag is selected', () => {
    const nextTag = activityTag();
    const result = resolveTitleOnTagChange({
      previousTag: null,
      nextTag,
      currentTitle: 'Beerpong am Pavillon',
    });
    expect(result).toBe('Beerpong am Pavillon');
  });

  it('replaces the title with the new label when it still exactly matches the previous tag label, on a tag switch', () => {
    const previousTag = activityTag({ title: 'Sport' });
    const nextTag = activityTag({ id: OTHER_TAG_ID, slug: 'musik', title: 'Musik' });
    const result = resolveTitleOnTagChange({
      previousTag,
      nextTag,
      currentTitle: 'Sport',
    });
    expect(result).toBe('Musik');
  });

  it('clears the title when it still exactly matches the previous tag label and the tag is deselected', () => {
    const previousTag = activityTag({ title: 'Sport' });
    const result = resolveTitleOnTagChange({
      previousTag,
      nextTag: null,
      currentTitle: 'Sport',
    });
    expect(result).toBe('');
  });

  it('leaves a user-typed title unchanged when the tag is deselected', () => {
    const previousTag = activityTag({ title: 'Sport' });
    const result = resolveTitleOnTagChange({
      previousTag,
      nextTag: null,
      currentTitle: 'Beerpong am Pavillon',
    });
    expect(result).toBe('Beerpong am Pavillon');
  });

  it('does NOT treat a case- or whitespace-only difference from the previous label as a match', () => {
    const previousTag = activityTag({ title: 'Sport' });
    const nextTag = activityTag({ id: OTHER_TAG_ID, slug: 'musik', title: 'Musik' });
    const result = resolveTitleOnTagChange({
      previousTag,
      nextTag,
      currentTitle: ' sport ',
    });
    expect(result).toBe(' sport ');
  });

  it('clone-mount case: previousTag set and currentTitle equal to its label (buildClonePrefill mount) — deselect clears, switch replaces, the rule does not break', () => {
    const previousTag = activityTag({ title: 'Sport' });
    const nextTag = activityTag({ id: OTHER_TAG_ID, slug: 'musik', title: 'Musik' });

    const onDeselect = resolveTitleOnTagChange({
      previousTag,
      nextTag: null,
      currentTitle: previousTag.title,
    });
    expect(onDeselect).toBe('');

    const onSwitch = resolveTitleOnTagChange({
      previousTag,
      nextTag,
      currentTitle: previousTag.title,
    });
    expect(onSwitch).toBe(nextTag.title);
  });

  it('clone case with an explicit title differing from the label: deselect leaves it standing', () => {
    const previousTag = activityTag({ title: 'Sport' });
    const result = resolveTitleOnTagChange({
      previousTag,
      nextTag: null,
      currentTitle: 'Beerpong am Pavillon',
    });
    expect(result).toBe('Beerpong am Pavillon');
  });
});

describe('resolveSubmittedTitle (G-11-3 — what rides as `title` in the request body)', () => {
  it('returns null for an empty title', () => {
    expect(resolveSubmittedTitle('', null)).toBeNull();
  });

  it('returns null for a whitespace-only title', () => {
    expect(resolveSubmittedTitle('   ', activityTag())).toBeNull();
  });

  it('returns null when the title exactly equals the selected tag label, so the server-resolved per-locale auto-title is preserved', () => {
    const tag = activityTag({ title: 'Sport' });
    expect(resolveSubmittedTitle('Sport', tag)).toBeNull();
  });

  it('returns null when the title equals the tag label but was typed with surrounding whitespace (comparison runs on the trimmed value)', () => {
    const tag = activityTag({ title: 'Sport' });
    expect(resolveSubmittedTitle('  Sport  ', tag)).toBeNull();
  });

  it('returns the trimmed text when the title is the label plus something extra', () => {
    const tag = activityTag({ title: 'Sport' });
    expect(resolveSubmittedTitle('Sport am Pavillon ', tag)).toBe('Sport am Pavillon');
  });

  it('returns the trimmed text when no tag is selected and a title is set', () => {
    expect(resolveSubmittedTitle(' Beerpong am Pavillon ', null)).toBe('Beerpong am Pavillon');
  });
});
