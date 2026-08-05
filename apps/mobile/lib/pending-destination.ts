/**
 * D-02 (SC-5) — deep-link "return-to" capture/replay, module-level in-memory
 * singleton mirroring `app/_layout.tsx`'s existing `notifyMeMightHaveChanged`
 * idiom (04-PATTERNS.md, RESEARCH.md Pattern 4). Deliberately NOT
 * MMKV/SecureStore — a stale deep-link intent surviving a cold restart into
 * an unrelated session is a worse bug than losing it on kill (D-02
 * reversibility note, prohibition).
 *
 * Capture (app/_layout.tsx) only happens while the guard is
 * 'unauthenticated', and never for an (auth)/(profile-setup) href itself.
 * Consume+replay only happens on the transition INTO 'authenticated' — never
 * at 'authenticated-no-profile' — so the destination survives the
 * profile-completion detour. The captured href is only ever REPLAYED after
 * the guard has independently reached 'authenticated'; it can never be used
 * to bypass the guard's own check (content-leak boundary, threat T-4-06-E).
 */
let pendingDestination: string | null = null;

export function capturePendingDestination(href: string): void {
  pendingDestination = href;
}

export function consumePendingDestination(): string | null {
  const href = pendingDestination;
  pendingDestination = null;
  return href;
}
