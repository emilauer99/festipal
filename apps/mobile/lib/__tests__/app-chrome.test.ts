import { describe, expect, it } from 'vitest';

import { resolveHeaderContext } from '../app-chrome';

describe('resolveHeaderContext (09-04, D-03 App Header Contract)', () => {
  it('shows the global state on the start tab', () => {
    expect(resolveHeaderContext(['(tabs)', 'start'])).toEqual({ visible: true, kind: 'global' });
  });

  it('shows the global state on the festivals tab', () => {
    expect(resolveHeaderContext(['(tabs)', 'festivals'])).toEqual({
      visible: true,
      kind: 'global',
    });
  });

  it('shows the global state on the friends tab', () => {
    expect(resolveHeaderContext(['(tabs)', 'friends'])).toEqual({ visible: true, kind: 'global' });
  });

  it('shows the global state on the mehr tab', () => {
    expect(resolveHeaderContext(['(tabs)', 'mehr'])).toEqual({ visible: true, kind: 'global' });
  });

  it('shows the festival state on the festival dashboard tab', () => {
    expect(
      resolveHeaderContext(['(festival)', 'f', '[festivalSlug]', 'index']),
    ).toEqual({ visible: true, kind: 'festival' });
  });

  it('shows the festival state on the festival timetable tab', () => {
    expect(
      resolveHeaderContext(['(festival)', 'f', '[festivalSlug]', 'timetable']),
    ).toEqual({ visible: true, kind: 'festival' });
  });

  it('shows the push state with route "profil" for the profile screen', () => {
    expect(resolveHeaderContext(['profil'])).toEqual({
      visible: true,
      kind: 'push',
      route: 'profil',
    });
  });

  it('shows the push state with route "friends-qr" for the QR screen', () => {
    expect(resolveHeaderContext(['friends-qr'])).toEqual({
      visible: true,
      kind: 'push',
      route: 'friends-qr',
    });
  });

  it('hides on the welcome (auth) screen', () => {
    expect(resolveHeaderContext(['(auth)', 'welcome'])).toEqual({ visible: false });
  });

  it('hides on the complete-profile (profile-setup) screen', () => {
    expect(resolveHeaderContext(['(profile-setup)', 'complete-profile'])).toEqual({
      visible: false,
    });
  });

  it('hides on the single "/" owner route', () => {
    expect(resolveHeaderContext(['index'])).toEqual({ visible: false });
  });

  it('hides on the empty segment array (splash)', () => {
    expect(resolveHeaderContext([])).toEqual({ visible: false });
  });

  it('hides on the friend-detail modal (keeps its own header, Flagged Assumption 1)', () => {
    expect(resolveHeaderContext(['friend-detail'])).toEqual({ visible: false });
  });

  it('hides on an unknown first segment (never falls back to visible)', () => {
    expect(resolveHeaderContext(['some-unregistered-route'])).toEqual({ visible: false });
  });
});
