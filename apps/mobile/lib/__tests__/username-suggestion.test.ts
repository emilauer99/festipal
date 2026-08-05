import { describe, expect, it } from 'vitest';

import { generateUsernameSuggestion, suggestAvailableUsername } from '../username-suggestion';

const CHARSET_PATTERN = /^[a-z0-9_.]*$/;

describe('generateUsernameSuggestion (D-03 cap, pure)', () => {
  it('never exceeds 20 chars for a long taken input', () => {
    const suggestion = generateUsernameSuggestion('averylongdisplaynamethatexceeds');
    expect(suggestion.length).toBeLessThanOrEqual(20);
    expect(suggestion).toMatch(CHARSET_PATTERN);
  });

  it('sanitizes symbols/emoji to the a-z0-9_. charset and stays ≤20 chars', () => {
    const suggestion = generateUsernameSuggestion('Bob!! 😀');
    expect(suggestion.length).toBeLessThanOrEqual(20);
    expect(suggestion).toMatch(CHARSET_PATTERN);
  });

  it('returns a valid ≤20-char candidate even for an empty input', () => {
    const suggestion = generateUsernameSuggestion('');
    expect(suggestion.length).toBeGreaterThan(0);
    expect(suggestion.length).toBeLessThanOrEqual(20);
    expect(suggestion).toMatch(CHARSET_PATTERN);
  });

  it('produces varied suffixes across repeated calls, each ≤20 chars', () => {
    const suggestions = Array.from({ length: 20 }, () => generateUsernameSuggestion('taken'));
    for (const suggestion of suggestions) {
      expect(suggestion.length).toBeLessThanOrEqual(20);
      expect(suggestion).toMatch(CHARSET_PATTERN);
    }
    // Low-collision, not zero-collision (random 4-digit suffix) — expect at
    // least some variety across 20 draws rather than every value identical.
    expect(new Set(suggestions).size).toBeGreaterThan(1);
  });

  it('never exceeds 20 chars across a spread of adversarial inputs', () => {
    const adversarialInputs = [
      'a'.repeat(200),
      '!!!!!!!!!!!!!!!!!!!!!!!!!!',
      '日本語のユーザー名はとても長いです',
      '   ',
      'Already.Valid_name99',
    ];
    for (const input of adversarialInputs) {
      const suggestion = generateUsernameSuggestion(input);
      expect(suggestion.length).toBeLessThanOrEqual(20);
      expect(suggestion).toMatch(CHARSET_PATTERN);
    }
  });
});

describe('suggestAvailableUsername (bounded-retry availability check)', () => {
  it('verifies availability before returning a candidate', async () => {
    const checked: string[] = [];
    const result = await suggestAvailableUsername('taken', async (candidate) => {
      checked.push(candidate);
      return true;
    });
    expect(checked).toEqual([result]);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('regenerates on collision up to a bounded number of retries', async () => {
    let calls = 0;
    const result = await suggestAvailableUsername('taken', async () => {
      calls += 1;
      // First two candidates are "taken", the third is available.
      return calls >= 3;
    });
    expect(calls).toBe(3);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toMatch(CHARSET_PATTERN);
  });

  it('falls back to the last candidate if every retry is exhausted (never surfaces undefined)', async () => {
    let calls = 0;
    const result = await suggestAvailableUsername('taken', async () => {
      calls += 1;
      return false; // always unavailable
    });
    expect(calls).toBe(3); // bounded retry, not infinite
    expect(typeof result).toBe('string');
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toMatch(CHARSET_PATTERN);
  });
});
