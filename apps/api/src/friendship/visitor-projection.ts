import { visitorProfile } from '@quiks/db';

/**
 * THE foreign-view projection (VIS-01/VIS-02, 07-CONTEXT.md D-01/D-02). This is
 * the only place in the `friendship` module where columns of `visitor_profile`
 * are selected for a view that somebody OTHER than the profile's owner will
 * see. Every one of the four D-04 access paths — handle lookup, search hits,
 * request lists, friend list — selects through this constant; none of them
 * spells out its own column list.
 *
 * `birthDate` and the account's e-mail are absent and must stay absent: the
 * former is owner-only (D-02), the latter is not on this table at all and has
 * no business being joined in. `foreign-projection.spec.ts` asserts their
 * ABSENCE on the serialized response body, because a test that only checks the
 * allowed fields are present is blind to exactly the leak this phase prevents
 * (D-03).
 *
 * Its type-level counterpart is `visitorProfileForeignSchema` in
 * `@quiks/contracts` — both derive from the same `visitor_profile` definition,
 * so a column rename breaks the typecheck rather than drifting.
 */
export const foreignProfileColumns = {
  accountId: visitorProfile.accountId,
  username: visitorProfile.username,
  displayName: visitorProfile.displayName,
  avatar: visitorProfile.avatar,
  pronoun: visitorProfile.pronoun,
  gender: visitorProfile.gender,
};

/**
 * Orders a pair of accountIds canonically (D-14): the lexicographically smaller
 * one becomes `lowerId`. `friendship` and `friend_request` store ONE row per
 * pair in this order, enforced by a CHECK — so every read and write of those
 * tables goes through here first. Calling with two equal ids would produce a
 * pair the CHECK rejects; callers must handle self-adjacency before they get here.
 */
export function canonicalPair(a: string, b: string): { lowerId: string; higherId: string } {
  return a < b ? { lowerId: a, higherId: b } : { lowerId: b, higherId: a };
}

/**
 * The explicit `Date` → ISO-string conversion for anything this module puts on
 * the wire. The contract transports every timestamp as a string, never a
 * `Date` (same convention `me.controller.ts` keeps for `createdAt`); leaving
 * the conversion to `JSON.stringify` would let the TypeScript type disagree
 * with the shape the client actually receives.
 */
export function toIsoString(value: Date): string {
  return value.toISOString();
}
