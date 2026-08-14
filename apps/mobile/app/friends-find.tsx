export { default } from './(tabs)/friends';

/**
 * 09-05 Task 3 (D-16) — the Festival-Friends-Tab's "Find friends" entry
 * pushes the EXISTING global Friends screen as a root-level push screen,
 * not a second implementation. D-16 needs the global screen to work at TWO
 * navigation positions (the global tab and this push) with the SAME state,
 * query keys and back-behavior — a plain re-export satisfies that by
 * construction: there is still exactly one `FriendsScreen` function, one
 * set of `friendKeys`, one `router` wired inside it. `app/_layout.tsx`
 * registers THIS route (not `(tabs)/friends.tsx` itself) as a root-level
 * `Stack.Screen` sibling of `profil`/`friend-detail`/`friends-qr`, which is
 * what gives it the push header/back state and hides `FloatingNav` — the
 * SAME screen rendered from `(tabs)/friends.tsx` still shows the global tab
 * bar and no back arrow, because THAT registration is unchanged.
 *
 * DO NOT COPY the screen's body here, and do not re-implement any of its
 * search/QR/requests logic in this file — this file's only job is naming a
 * second route for the same component.
 */
