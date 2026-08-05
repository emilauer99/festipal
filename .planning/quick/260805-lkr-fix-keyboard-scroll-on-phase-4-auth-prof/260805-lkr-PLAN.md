---
quick_id: 260805-lkr
slug: fix-keyboard-scroll-on-phase-4-auth-prof
date: 2026-08-05
branch: fix/mobile-expo-network-dep
---

# Quick Task 260805-lkr: Fix keyboard-scroll on Phase-4 auth/profile input screens

## Problem

On a real device, when a soft keyboard opens over an input on the auth/profile
screens, the content covered by the keyboard cannot be scrolled into view — it
is squished/clipped instead. Surfaced as a follow-up to commit 3397e99
(`fix(mobile): safe areas, keyboard-avoiding scroll, and network timeout`).

## Root cause

All three input screens wrap their body in `<KeyboardScreen>`
(`SafeAreaView > KeyboardAvoidingView > ScrollView` with
`contentContainerStyle={{ flexGrow: 1 }}`). Each screen's `content` style uses
`flex: 1`, which in React Native expands to `{ flexGrow: 1, flexShrink: 1,
flexBasis: 0 }`. Inside the `flexGrow: 1` scroll container, `flexShrink: 1` +
`flexBasis: 0` clamp the content block to exactly the (keyboard-shrunk)
viewport height, so the ScrollView content never exceeds the viewport → nothing
to scroll. The content is merely compressed under the keyboard.

## Fix

Change `flex: 1` → `flexGrow: 1` on the `content` style in the three screens.
RN's bare `flexGrow: 1` keeps the platform default `flexShrink: 0` /
`flexBasis: auto`, giving grow-but-don't-shrink:
- Short content (no keyboard): block grows to fill → stays vertically centered,
  CTA pinned at bottom (visual unchanged).
- Tall content (keyboard shrinks viewport): block keeps intrinsic height →
  overflows the ScrollView → becomes scrollable, revealing covered content.

JS-only, OTA-safe, cross-platform, no new dependencies.

## Files

- `apps/mobile/app/(auth)/email.tsx` — `content` style `flex: 1` → `flexGrow: 1`
- `apps/mobile/app/(auth)/verify.tsx` — `content` style `flex: 1` → `flexGrow: 1`
- `apps/mobile/app/(profile-setup)/complete-profile.tsx` — `content` style `flex: 1` → `flexGrow: 1`

## Verification

- `pnpm --filter mobile typecheck`
- `pnpm --filter mobile lint`
- `pnpm --filter mobile test`
