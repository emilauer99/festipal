/**
 * G-05-2 — cross-tab "open Festivals on this segment" intent, module-level
 * in-memory consume-once singleton mirroring `pending-destination.ts`'s
 * `capturePendingDestination`/`consumePendingDestination` idiom. Deliberately
 * plain in-memory state, NOT MMKV/SecureStore — a stale cross-session
 * segment request surviving a cold restart is not wanted (mirrors
 * pending-destination.ts's own reversibility note).
 *
 * Consumed exactly once by the Festivals tab's `useFocusEffect` (festivals.tsx)
 * so a plain bottom-tab focus (no queued request) never clobbers a manual
 * `SegmentedControl` tap: `consumeFestivalsSegment()` returns `null` unless a
 * `requestFestivalsSegment(...)` call queued a value since the last consume.
 */
export type Segment = 'meine' | 'alle';

let pendingSegment: Segment | null = null;

export function requestFestivalsSegment(segment: Segment): void {
  pendingSegment = segment;
}

export function consumeFestivalsSegment(): Segment | null {
  const segment = pendingSegment;
  pendingSegment = null;
  return segment;
}
