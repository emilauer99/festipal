import { describe, expect, it } from 'vitest';

import { encodeQuiksCodePayload, parseQuiksCodePayload, QUIKS_CODE_PREFIX } from '../qr-payload';

/**
 * 08-04-PLAN Task 1 `<behavior>` — every case listed there gets its own
 * assert. Phase-7 D-17 / 08-CONTEXT D-13: the payload is namespaced
 * PLAINTEXT, never a deep link, so the parser must be provably strict about
 * where the prefix sits and how many segments follow it.
 */
describe('QUIKS_CODE_PREFIX', () => {
  it('is the fixed literal both encode and parse anchor on', () => {
    expect(QUIKS_CODE_PREFIX).toBe('quiks:u/');
  });
});

describe('encodeQuiksCodePayload', () => {
  it('builds the namespaced plaintext payload for a handle', () => {
    expect(encodeQuiksCodePayload('feli')).toBe('quiks:u/feli');
  });
});

describe('parseQuiksCodePayload', () => {
  it('parses the canonical payload', () => {
    expect(parseQuiksCodePayload('quiks:u/feli')).toEqual({ username: 'feli' });
  });

  it('trims outer whitespace before checking the prefix', () => {
    expect(parseQuiksCodePayload('  quiks:u/feli  ')).toEqual({ username: 'feli' });
  });

  it('matches the prefix case-insensitively but leaves the handle untouched', () => {
    expect(parseQuiksCodePayload('QUIKS:U/feli')).toEqual({ username: 'feli' });
  });

  it('rejects a prefix that is not at position 0', () => {
    expect(parseQuiksCodePayload('https://example.com/quiks:u/feli')).toBeNull();
  });

  it('rejects an empty remainder after the prefix', () => {
    expect(parseQuiksCodePayload('quiks:u/')).toBeNull();
  });

  it('rejects more than one segment after the prefix', () => {
    expect(parseQuiksCodePayload('quiks:u/feli/extra')).toBeNull();
  });

  it('rejects a deep-link-shaped scheme (quiks:// is not this format)', () => {
    expect(parseQuiksCodePayload('quiks://home')).toBeNull();
  });

  it('rejects a wrong namespace segment', () => {
    expect(parseQuiksCodePayload('quiks:x/feli')).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(parseQuiksCodePayload('')).toBeNull();
  });

  it('rejects a bare handle with no prefix at all', () => {
    expect(parseQuiksCodePayload('feli')).toBeNull();
  });

  it('round-trips through encode', () => {
    expect(parseQuiksCodePayload(encodeQuiksCodePayload('feli.quiks'))).toEqual({
      username: 'feli.quiks',
    });
  });
});
