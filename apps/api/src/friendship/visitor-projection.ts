import { visitorProfile } from '@quiks/db';
import type { VisitorProfileForeign } from '@quiks/contracts';

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
 * The other half of the one-projection rule: `foreignProfileColumns` is the only
 * place the foreign view is READ, and this is the only place a result row is
 * SHAPED into the `profile` object that goes on the wire.
 *
 * Both matter, and for different reasons. A query that reads too much leaks
 * through any handler that returns the row as-is; a handler that re-lists the
 * field names drifts from the projection the moment a field is added, without
 * any endpoint looking broken (T-07-18). The direct paths — handle lookup and
 * search — hand the select result straight through, so their row IS the
 * projection. The list paths cannot: they need the pair's timestamp (and, for
 * requests, `requesterId`) alongside the profile columns, so the profile has to
 * be lifted back out of a wider row. That lifting happens HERE, once, and never
 * at a call site.
 *
 * The parameter type is the contract type, so a field added to
 * `visitorProfileForeignSchema` breaks THIS function's typecheck first —
 * exactly the place where somebody then has to decide whether it is really a
 * foreign-view field.
 */
export function pickForeignProfile(row: VisitorProfileForeign): VisitorProfileForeign {
  return {
    accountId: row.accountId,
    username: row.username,
    displayName: row.displayName,
    avatar: row.avatar,
    pronoun: row.pronoun,
    gender: row.gender,
  };
}

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
