/**
 * G-06-5 gap closure — registers the `@formatjs/intl-pluralrules` polyfill
 * before Expo Router evaluates any route module. See
 * `.planning/debug/profile-screen-undefined-constructor.md` for the full
 * diagnosis: Hermes (the Expo default engine) does not implement
 * `Intl.PluralRules`, `@lingui/core`'s runtime constructs one eagerly for
 * every plural message, and `app/profil.tsx` is the app's first screen to
 * render one.
 *
 * IMPORT ORDER IN THIS FILE IS LOAD-BEARING — do not reorder:
 *   1. the capability probe from `./intl-capability`, so it observes the
 *      RAW engine before anything below overwrites the global.
 *   2. the forced polyfill variant, which installs `Intl.PluralRules`.
 *   3/4. the `de` and `en` locale data, which the polyfilled constructor
 *      needs to actually resolve plural categories per locale.
 *
 * Two specifier details that look like typos but are not — do not "correct"
 * either of them:
 *
 * - FORCED, not detected: `polyfill-force.js`, never the bare `polyfill`
 *   entry point. The detection variant re-runs its own capability probe on
 *   every app start and FormatJS documents it as seconds-slow on Android
 *   (formatjs/formatjs#4463). Hermes never implements this API, so detection
 *   can only ever cost startup time here and can never save any.
 *
 * - `.js` suffix REQUIRED on EVERY specifier below, including the locale-data
 *   ones. (Deviation from this plan's own planning-time note, which expected
 *   the locale-data specifiers to stay extensionless — verified wrong against
 *   both FormatJS's own docs, which show `locale-data/en.js`, and this
 *   package's real Node ESM resolution: `import
 *   '@formatjs/intl-pluralrules/locale-data/de'` (no extension) throws
 *   `Cannot find module`, while the `.js` form resolves.) The package's
 *   `exports` map (verified on disk in
 *   `node_modules/@formatjs/intl-pluralrules/package.json`) declares
 *   `"./polyfill-force.js": "./polyfill-force.js"` and
 *   `"./locale-data/*": "./locale-data/*"` — the pattern's `*` is substituted
 *   literally with no extension added, so the requested subpath must supply
 *   `.js` itself to match an actual file on disk (`locale-data/de.js`). This
 *   workspace's `moduleResolution: Bundler` (packages/config/tsconfig.base.json)
 *   honours `exports` the same strict way.
 */
import { nativePluralRulesCapability } from './intl-capability';
import '@formatjs/intl-pluralrules/polyfill-force.js';
import '@formatjs/intl-pluralrules/locale-data/de.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';

// The cheapest possible confirmation of the diagnosis: an unconditional
// startup line reporting what the raw engine provided next to what the app
// now has after the polyfill ran. Matches the project's documented
// startup-info logging convention; it carries no account or user data
// (T-06-10-03 — accepted, low severity).
console.log(
  `[intl-polyfill] native Intl.PluralRules: ${nativePluralRulesCapability}, ` +
    `after polyfill: ${typeof Intl.PluralRules}`,
);

// Fail fast at boot rather than deep inside a screen render (the cryptic
// Hermes constructor TypeError this whole gap-closure plan exists to
// replace with a legible failure).
if (typeof Intl.PluralRules !== 'function') {
  throw new Error(
    '[intl-polyfill] Intl.PluralRules is still missing after the @formatjs/intl-pluralrules ' +
      'polyfill ran. See apps/mobile/lib/intl-polyfill.ts.',
  );
}
