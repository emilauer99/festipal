---
phase: 06-profile-friends-placeholders
plan: 10
reviewed: 2026-08-12T12:14:30Z
depth: deep
scope: incremental — nur der Diff ee283f0..HEAD (Commits 3c7c120, 568a9db); Rest der Phase bereits in 06-REVIEW.md abgedeckt
files_reviewed: 6
files_reviewed_list:
  - apps/mobile/index.js
  - apps/mobile/lib/intl-capability.ts
  - apps/mobile/lib/intl-polyfill.ts
  - apps/mobile/lib/__tests__/intl-polyfill.test.ts
  - apps/mobile/package.json
  - pnpm-lock.yaml
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Plan 06-10: Code Review Report (Gap Closure G-06-5)

**Reviewed:** 2026-08-12T12:14:30Z
**Depth:** deep (Entry-Point-Änderung; Supply-Chain-Gewichtung laut Auftrag)
**Files Reviewed:** 6
**Status:** issues_found (0 Critical, 2 Warnings, 1 Info)

## Summary

Der Fix ist im Kern korrekt und sauber gebaut: Ladereihenfolge, Specifier-Auflösung,
Lockfile-Hygiene und die Zero-Import-Probe halten der Prüfung stand (Einzelnachweise
unten). Die beiden Warnings betreffen ausschließlich den Rückfall-Guard-Test: seine
String-Matcher lesen die Quelldateien roh (inklusive Kommentaren) und zählen die
Imports in `index.js` nicht — dadurch deckt er zwei realistische Regressionspfade
nicht ab, von denen einen das Threat-Register (T-06-10-01) explizit als abgedeckt
deklariert. Das Geräteverhalten selbst ist laut SUMMARY verifiziert
(`native: undefined, after polyfill: function`).

### Verifizierte Kernbehauptungen (jeweils gegen Disk/Toolchain geprüft, kein Befund)

1. **Ladereihenfolge ist tragfähig.** `index.js` evaluiert `./lib/intl-polyfill`
   vollständig vor `expo-router/entry` — sowohl unter nativer ESM-Semantik
   (Imports evaluieren in Quellreihenfolge, jeder Import läuft zu Ende, bevor der
   nächste startet) als auch unter Metros Babel-CJS-Transform (`require`-Aufrufe in
   Statement-Reihenfolge). Innerhalb von `intl-polyfill.ts` garantiert dieselbe
   Semantik, dass `./intl-capability` vor `polyfill-force.js` läuft. Die im
   Datei-Header von `intl-capability.ts` dokumentierte Hoisting-Begründung ist
   fachlich korrekt.
2. **Zero-Import-Claim hält.** `lib/intl-capability.ts` enthält null Imports, und
   der Modulkörper (`typeof Intl.PluralRules`) benötigt keine Babel-Helper —
   `babel-preset-expo` injiziert hier nichts (kein JSX, keine Klassen-/Spread-Helper).
   Vor dem Entry-Modul läuft nur RN `InitializeCore`, das `Intl` nicht anfasst; die
   Probe beobachtet also tatsächlich den rohen Engine-Zustand.
3. **`.js`-Suffix-Begründung ist korrekt — für BEIDE Resolver.** Auf Disk verifiziert
   (`node_modules/@formatjs/intl-pluralrules/package.json@6.3.13`): die `exports`-Map
   deklariert exakt `"./polyfill-force.js": "./polyfill-force.js"` und
   `"./locale-data/*": "./locale-data/*"`; `locale-data/` enthält `de.js`/`en.js`,
   aber KEINE extensionslosen Dateien. Damit gilt: (a) TS `moduleResolution: Bundler`
   (packages/config/tsconfig.base.json:8) löst beide Formen nur mit `.js` auf
   (Pattern-`*` wird literal substituiert; Typen via Sibling-`.d.ts`); (b) Metro
   (Expo SDK 57 / RN 0.86, package exports seit RN 0.79 default-aktiv) löst die
   `.js`-Form über dieselbe Map — und selbst unter Legacy-File-Resolution existieren
   die Dateien literal auf Disk. Die im Header dokumentierte Abweichung vom Plan-Text
   ist damit belegt richtig, nicht nur behauptet.
4. **Lockfile ist sauber.** Der `pnpm-lock.yaml`-Diff fügt exakt
   `@formatjs/intl-pluralrules@6.3.13` plus drei FormatJS-Transitives
   (`bigdecimal`, `fast-memoize`, `intl-localematcher`) hinzu — kein Relinking
   unbeteiligter Pakete (Task-2-Anforderung erfüllt).
5. **Fail-fast-`throw` ist die richtige Entscheidung.** Der Pfad ist nach
   `polyfill-force.js` praktisch unerreichbar (die forcierte Variante installiert
   unconditional; schlüge ihr Import selbst fehl, würfe bereits der Import). Er
   feuert nur, wenn das Paket kaputt wäre — und dann ist ein benannter Boot-Fehler
   mit Dateiverweis dem kryptischen Hermes-Constructor-TypeError tief im
   Screen-Render klar überlegen. Kein besserer Ort für einen Error-Boundary
   existiert zu diesem Zeitpunkt ohnehin nicht.
6. **`console.log` ist konventionskonform.** CONVENTIONS.md:138-144 erlaubt
   Startup-Info explizit via `console.log`; die Zeile trägt nur zwei
   `typeof`-Werte, keine Nutzerdaten (T-06-10-03, accept — nachvollziehbar). Sie
   ist zudem das Task-4-Beweismittel und laut SUMMARY auf dem Gerät beobachtet.
7. **Scope-Disziplin.** `app/profil.tsx` unverändert (leerer Diff bestätigt);
   `apps/mobile/profil.out.js` ist auf Disk gelöscht (Success Criterion erfüllt);
   `main: "index.js"` ist der von Expo dokumentierte Custom-Entry-Mechanismus, kein
   konkurrierender `entryPoint` in `app.json`.
8. **`SUPPORTED_LOCALES`-Kopplung ist real.** `@quiks/i18n` re-exportiert
   `SUPPORTED_LOCALES = ['de', 'en']` aus `@quiks/contracts`
   (packages/contracts/src/locale.ts:7); Assertion 5 iteriert das echte Array. Ein
   drittes Locale ohne Locale-Data-Import macht die Suite rot — die Richtung des
   Guards stimmt.

## Warnings

### WR-01: Guard-Test-Matcher akzeptieren auskommentierte Imports — der wertvollste Regressionspfad bleibt unentdeckt

**File:** `apps/mobile/lib/__tests__/intl-polyfill.test.ts:66-72` (Assertion 3), `:78` (Assertion 4), `:96` (Assertion 5)
**Issue:** Alle drei Quelltext-Assertions matchen mit `indexOf`/`toContain` auf dem
ROHEN Dateiinhalt — Kommentare eingeschlossen. Der Test wehrt zwar per Konstruktion
die Header-Prosa der HEUTIGEN Dateien ab (in `index.js` stehen beide Modulnamen nur
in Backticks/Prosa, nie single-quoted; die Prosa-Erwähnung von
`'@formatjs/intl-pluralrules/locale-data/de'` in `intl-polyfill.ts:31-32` trägt kein
`.js` und matcht Assertion 5 daher nicht). Aber gegen AUSKOMMENTIERTE Imports ist er
blind. Konkretes Failure-Szenario: jemand debuggt einen Boot-Hänger und kommentiert
in `index.js` die Zeile `// import './lib/intl-polyfill';` aus — der single-quoted
Specifier steht weiterhin im Dateiinhalt, `polyfillPos >= 0` und
`polyfillPos < routerEntryPos` bleiben wahr, die Suite bleibt GRÜN, der Polyfill lädt
nie, und exakt der Geräte-Crash, den dieser Plan schließt, kehrt zurück. Dasselbe
gilt für ein auskommentiertes `// import '@formatjs/intl-pluralrules/locale-data/de.js';`
(stiller per-Locale-Crash für DE). Die dokumentierten Falsifikationsmutationen
(revert `main`, Suffix-Drop, LÖSCHEN des de-Imports) decken Löschung ab, nicht
Auskommentierung — der Test kann also grün sein, während das Gerät kaputt ist.
Zusätzlich ist Assertion 5 nur eine Prosa-Änderung davon entfernt, tautologisch zu
werden: „korrigiert" jemand den Header-Kommentar in `intl-polyfill.ts` um das
fehlende `.js`, matcht die Assertion künftig den Kommentar statt des Imports.
**Fix:** Zeilenanfangs-verankerte Multiline-Regexes statt Substring-Suche, z. B.:

```ts
const IMPORT_POLYFILL = /^import '\.\/lib\/intl-polyfill';$/m;
const IMPORT_ROUTER = /^import 'expo-router\/entry';$/m;

const polyfillPos = entry.search(IMPORT_POLYFILL);
const routerEntryPos = entry.search(IMPORT_ROUTER);
// ... bestehende >= 0- und Ordnungs-Assertions unverändert

// Assertion 4/5 analog:
expect(source).toMatch(/^import '@formatjs\/intl-pluralrules\/polyfill-force\.js';$/m);
expect(source).toMatch(
  new RegExp(`^import '@formatjs/intl-pluralrules/locale-data/${locale}\\.js';$`, 'm'),
);
```

Damit fällt sowohl der Comment-out-Bypass als auch die Kommentar-Tautologie weg,
und die drei dokumentierten Mutationen bleiben weiterhin rot.

### WR-02: T-06-10-01-Mitigation nur teilweise implementiert — ein DRITTER Import in index.js bleibt vom Guard unbemerkt

**File:** `apps/mobile/lib/__tests__/intl-polyfill.test.ts:59-73` (fehlende Assertion); Threat-Register `06-10-PLAN.md` T-06-10-01
**Issue:** Das Threat-Register (medium, mitigate) behauptet: „Task 3's guard asserts
`main`, both imports and their order, so **any added** or reordered import surfaces
in the test suite instead of only in review." Die zweite Hälfte ist für „added"
falsch: der Test prüft Existenz und Reihenfolge der zwei erwarteten Imports, zählt
aber nicht. Konkretes Failure-Szenario: ein späterer Commit fügt
`import './lib/some-analytics';` als ERSTE Zeile von `index.js` hinzu — exakt die
maximal privilegierte Supply-Chain-Position, vor deren Erweiterung der Header der
Datei selbst warnt („Keep this file to EXACTLY these two imports") — und die
gesamte Suite bleibt grün. Die im Threat-Register deklarierte Mitigation existiert
für diesen Fall nur in der Review-Spur, nicht im Testlauf; genau das wollte
T-06-10-01 ausschließen.
**Fix:** Eine sechste Assertion, die die Importanzahl fixiert (kombiniert mit dem
WR-01-Fix auf echte Import-Statements verankert):

```ts
it('holds EXACTLY the two side-effect imports and nothing else (T-06-10-01)', () => {
  const entry = readMobileFile('index.js');
  const imports = entry.match(/^import .+$/gm) ?? [];
  expect(imports).toEqual(["import './lib/intl-polyfill';", "import 'expo-router/entry';"]);
});
```

`toEqual` auf dem vollständigen Array fixiert Anzahl, Inhalt UND Reihenfolge in
einer Assertion; die bestehende Ordnungs-Assertion darf trotzdem bleiben.

## Info

### IN-01: `polyfill-force` ersetzt auch native PluralRules-Implementierungen — als theoretisch markiert, kein konstruierbares Failure-Szenario

**File:** `apps/mobile/lib/intl-polyfill.ts:43`
**Issue:** Die forcierte Variante überschreibt `Intl.PluralRules` unconditional —
auch auf Engines, die es nativ besitzen (Web-Target via `expo start --web`, oder ein
künftiges Hermes, falls facebook/hermes#1462 je landet; der Startup-Log würde
Letzteres immerhin sichtbar machen). Die polyfillte Implementierung kennt dann nur
die geladenen de/en-Daten, während die native jede Locale könnte. Ein Failure
ließe sich nur konstruieren, wenn irgendetwas `Intl.PluralRules` mit einer Locale
außerhalb `SUPPORTED_LOCALES` instanziiert — im aktuellen Code läuft aber jede
Instanziierung durch Lingui mit App-Locales aus `SUPPORTED_LOCALES`, und Assertion 5
koppelt die Datenimporte an genau dieses Set. Ausdrücklich theoretisch; die
Force-Entscheidung ist für das Geräte-Target richtig begründet
(formatjs/formatjs#4463, Detection-Variante sekundenlangsam auf Android).
**Fix:** Kein Handlungsbedarf jetzt. Sollte je ein Web-Target ernsthaft ausgeliefert
werden, Plattform-Split erwägen (`polyfill.js`/`should-polyfill.js` nur dort) — bis
dahin genügt der bestehende Header-Kommentar.

---

_Reviewed: 2026-08-12T12:14:30Z_
_Reviewer: Claude (gsd-code-reviewer, adversarial incremental review)_
_Depth: deep — Scope: Diff ee283f0..HEAD (3c7c120, 568a9db)_
