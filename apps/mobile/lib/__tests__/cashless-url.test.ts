import { describe, expect, it } from 'vitest';

import { resolveCashlessTarget } from '../cashless-url';

describe('resolveCashlessTarget (09-06, D-09 / ADR-011 / T-09-23)', () => {
  it('returns null for null', () => {
    expect(resolveCashlessTarget(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(resolveCashlessTarget(undefined)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(resolveCashlessTarget('')).toBeNull();
  });

  it('returns null for a whitespace-only string', () => {
    expect(resolveCashlessTarget('   ')).toBeNull();
  });

  it('resolves a plain https address to its unchanged uri, origin and host', () => {
    expect(resolveCashlessTarget('https://pay.example.com/festival/abc')).toEqual({
      uri: 'https://pay.example.com/festival/abc',
      origin: 'https://pay.example.com',
      host: 'pay.example.com',
    });
  });

  it('keeps a non-default port as part of both origin and host', () => {
    expect(resolveCashlessTarget('https://pay.example.com:8443/x')).toEqual({
      uri: 'https://pay.example.com:8443/x',
      origin: 'https://pay.example.com:8443',
      host: 'pay.example.com:8443',
    });
  });

  it('rejects plain http (only https is accepted)', () => {
    expect(resolveCashlessTarget('http://pay.example.com/x')).toBeNull();
  });

  it('rejects a javascript: address', () => {
    expect(resolveCashlessTarget('javascript:alert(1)')).toBeNull();
  });

  it('rejects a file: address', () => {
    expect(resolveCashlessTarget('file:///etc/passwd')).toBeNull();
  });

  it('rejects a data: address', () => {
    expect(resolveCashlessTarget('data:text/html,x')).toBeNull();
  });

  it("rejects the app's own custom scheme", () => {
    expect(resolveCashlessTarget('quiks://f/slug')).toBeNull();
  });

  it('rejects https with no host', () => {
    expect(resolveCashlessTarget('https://')).toBeNull();
  });

  it('rejects a string with no scheme at all, without throwing', () => {
    expect(() => resolveCashlessTarget('nicht-mal-eine-adresse')).not.toThrow();
    expect(resolveCashlessTarget('nicht-mal-eine-adresse')).toBeNull();
  });

  it('resolves two addresses with the same host but different paths to the same origin', () => {
    const a = resolveCashlessTarget('https://pay.example.com/a');
    const b = resolveCashlessTarget('https://pay.example.com/b');
    expect(a?.origin).toBe(b?.origin);
    expect(a?.origin).toBe('https://pay.example.com');
  });
});
