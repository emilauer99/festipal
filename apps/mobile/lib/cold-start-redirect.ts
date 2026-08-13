/**
 * first-login-unmatched-route — pure cold-start redirect decision.
 *
 * Root cause this fixes: the cold-start redirect effect in `app/_layout.tsx`
 * used to navigate explicitly only for a captured deep-link href or a
 * persisted active-festival slug. The remaining "no href AND no slug" case (a
 * fresh account with no saved festival and no deep link) was a silent
 * fall-through that relied on `(tabs)/_layout.tsx` `initialRouteName="start"`.
 * But `initialRouteName` only picks a navigator group's default CHILD — it
 * does NOT redirect the cold-launch root URL `/` (from `quiks:///`) to
 * `/start`. Since no route serves `/` under the `authenticated` guard set (the
 * only `/` route is `(auth)/index.tsx`, guarded off once authenticated), the
 * router was left on an unmatched root path and Expo Router rendered the
 * Unmatched Route screen. The empty state now resolves to an explicit `start`
 * target so the authenticated router path always matches a real screen.
 *
 * 09-01 (NAV-03 rename, D-19): the discriminant and its href both moved from
 * `home`/`/home` to `start`/`/start` alongside the route rename — a union
 * member that named the old route would be a second name for the same
 * screen, exactly what D-19 forbids.
 *
 * Framework/router-free (no expo-router import) so it stays importable under
 * the node-env Vitest runner, mirroring `lib/deep-link.ts` and
 * `lib/select-next-festival.ts`'s pure-fn purity idiom. The caller in
 * `app/_layout.tsx` maps this decision onto `router.replace(...)`.
 */

export type ColdStartRedirect =
  | { kind: 'deep-link'; href: string }
  | { kind: 'active-festival'; slug: string }
  | { kind: 'start' };

/**
 * Resolves where a cold start lands, in strict precedence order:
 *   1. a captured pending deep-link href (highest — REVIEW 05-05 HIGH),
 *   2. else a persisted active-festival slug (open its festival home),
 *   3. else Start — the explicit empty-state fallback (fresh account, no
 *      saved festival, no deep link) that replaces the previously-silent
 *      fall-through.
 *
 * `activeFestivalSlug` is typed `string | undefined` to match
 * `getActiveFestivalSlug()`'s return; a captured href is `string | null` to
 * match `consumePendingDestination()`.
 */
export function resolveColdStartRedirect(
  pendingHref: string | null,
  activeFestivalSlug: string | undefined,
): ColdStartRedirect {
  if (pendingHref) return { kind: 'deep-link', href: pendingHref };
  if (activeFestivalSlug) return { kind: 'active-festival', slug: activeFestivalSlug };
  return { kind: 'start' };
}

/**
 * first-login-unmatched-route (round 2) — maps a resolved {@link ColdStartRedirect}
 * to the concrete href string the authenticated `/` route redirects to.
 *
 * Extracted as a pure function (no expo-router import) so the load-bearing
 * href literals (`/start`, `/f/{slug}`) are unit-testable and mutation-killable
 * — a silent regression to the wrong path is exactly how round 1's
 * Unmatched-Route bug survived. The caller in `app/_layout.tsx` stores this in
 * state (typed as expo-router's `Href`) and the single `/` owner (`app/index.tsx`,
 * round 3) replays it declaratively via `<Redirect>`, which — unlike the previous
 * imperative `router.replace` timed to the guard flip — reliably resolves
 * regardless of `Stack.Protected` reconciliation timing.
 */
export function coldStartRedirectHref(redirect: ColdStartRedirect): string {
  switch (redirect.kind) {
    case 'deep-link':
      return redirect.href;
    case 'active-festival':
      return `/f/${redirect.slug}`;
    case 'start':
      return '/start';
  }
}
