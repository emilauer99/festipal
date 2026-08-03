import { describe, expect, it } from 'vitest';

import { resolveUiLocale } from './resolve';

describe('resolveUiLocale', () => {
  it('returns a valid override, taking priority over systemLocales', () => {
    expect(resolveUiLocale({ override: 'de', systemLocales: ['en-US'] })).toBe('de');
  });

  it('matches on the primary subtag, honoring systemLocales order', () => {
    expect(resolveUiLocale({ systemLocales: ['de-AT', 'en-US'] })).toBe('de');
  });

  it('picks the first supported locale in systemLocales order', () => {
    expect(resolveUiLocale({ systemLocales: ['fr-FR', 'en-GB'] })).toBe('en');
  });

  it('falls through to the shared DEFAULT_LOCALE when no uiFallback is given', () => {
    expect(resolveUiLocale({ systemLocales: [] })).toBe('en');
  });

  it('falls through to uiFallback (D-07) when no override/systemLocales match', () => {
    expect(resolveUiLocale({ systemLocales: [], uiFallback: 'de' })).toBe('de');
  });

  it('prefers uiFallback over DEFAULT_LOCALE for a non-DE/EN device (D-07)', () => {
    expect(resolveUiLocale({ systemLocales: ['fr-FR'], uiFallback: 'de' })).toBe('de');
  });
});
