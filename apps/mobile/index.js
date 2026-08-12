// G-06-5 gap closure — custom Expo Router entry point so the Intl.PluralRules
// polyfill (apps/mobile/lib/intl-polyfill.ts) installs before any route
// module evaluates. Expo documents this exact pattern for exactly this
// purpose (router/installation, "Custom entry point to initialize and load
// side-effects"): initialize side effects first, `expo-router/entry` last.
//
// Keep this file to EXACTLY these two imports. T-06-10-01: this entry runs
// before every other module in the bundle with no guard above it, so
// anything imported here is maximally privileged — the wiring guard test
// (lib/__tests__/intl-polyfill.test.ts) asserts both imports and their
// order, and a third import here is itself a supply-chain surface.
import './lib/intl-polyfill';
import 'expo-router/entry';
