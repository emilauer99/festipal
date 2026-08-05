---
quick_id: 260805-lkr
slug: fix-keyboard-scroll-on-phase-4-auth-prof
date: 2026-08-05
branch: fix/mobile-expo-network-dep
status: complete
---

# Quick Task 260805-lkr Summary

## What changed

Changed the `content` style from `flex: 1` to `flexGrow: 1` on the three
Phase-4 auth/profile input screens so content covered by the soft keyboard
becomes scrollable instead of squished/clipped.

- `apps/mobile/app/(auth)/email.tsx`
- `apps/mobile/app/(auth)/verify.tsx`
- `apps/mobile/app/(profile-setup)/complete-profile.tsx`

## Why it works

Inside `KeyboardScreen` (`ScrollView` with `contentContainerStyle={{ flexGrow: 1 }}`),
RN's `flex: 1` (= flexGrow:1 / flexShrink:1 / flexBasis:0) clamps the content
block to the viewport, so the ScrollView never overflows. Bare `flexGrow: 1`
keeps RN's default flexShrink:0 / flexBasis:auto: the block still grows to fill
(centered layout preserved when short) but keeps its intrinsic height and
overflows into a scroll when the keyboard shrinks the viewport.

JS-only change — OTA-safe, cross-platform, no new dependencies. Follow-up to
commit 3397e99.

## Follow-up: the flex change alone was insufficient (device UAT)

On-device the keyboard-covered content still would not scroll. Root cause is
deeper than flexbox: **from Expo SDK 54 Android is always edge-to-edge**
(non-disableable), so the window no longer resizes when the IME opens. The
keyboard is drawn *over* the content; `adjustResize` and `KeyboardAvoidingView`
(a no-op on Android with `behavior=undefined`) never shrink the ScrollView, so
there is no overflow to scroll regardless of the child's flex config.

Fix (commit 2): rewrote `components/KeyboardScreen.tsx` to drop
`KeyboardAvoidingView` and instead read the live keyboard height from the RN
`Keyboard` API (`keyboardWillShow/Hide` on iOS, `keyboardDidShow/Hide` on
Android) and add it as `paddingBottom` on the scroll content. That padding is
the scroll headroom that lets the IME-covered region be scrolled up into view
on both platforms. The `flexGrow:1` change from commit 1 is retained (keeps the
centered-when-short layout while allowing overflow).

Still pure JS — OTA-safe, no native rebuild, no new dependency. If smoother
animated avoidance / auto-scroll-to-focused-input is wanted later, the ecosystem
standard is `react-native-keyboard-controller` (native module → needs a rebuild).

## Verification

- `pnpm --filter mobile typecheck` — pass
- `pnpm --filter mobile lint` — pass
- `pnpm --filter mobile test` — 22/22 pass

Device UAT: **confirmed working on hardware** by the user after the second fix
(manual scroll of keyboard-covered content now works on all three screens).
