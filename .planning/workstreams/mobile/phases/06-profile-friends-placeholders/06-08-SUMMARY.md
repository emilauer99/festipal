---
phase: 06-profile-friends-placeholders
plan: 08
subsystem: mobile
tags: [expo, react-native, datetimepicker, native-module, lingui, forms, timezone]

# Dependency graph
requires:
  - phase: 06-profile-friends-placeholders
    plan: 02
    provides: "completeProfileBodySchema mit pronoun/birthDate/gender als .nullable().optional(), serverseitige Caps 20/30, birth_date als date({ mode: 'string' })"
  - phase: 06-profile-friends-placeholders
    plan: 03
    provides: "deriveAge() — leitet das Alter aus birthDate ab und liefert null für ein Datum in der Zukunft"
  - phase: 04-visitor-auth-profile-completion
    provides: "complete-profile.tsx mit KeyboardScreen, Feld-/Label-/Input-Styles, Absende-Zustand und Absende-Fehlerfläche"
provides:
  - "Drei optionale Identitätsfelder im Profil-Erstellungsscreen (Pronomen, Geburtsdatum, Geschlecht)"
  - "Nativer Datums-Picker: @react-native-community/datetimepicker 9.1.0, von Expo SDK 57 aufgelöst"
  - "toLocalDateOnly() — zeitzonensichere YYYY-MM-DD-Serialisierung aus lokalen Kalenderkomponenten"
  - "Fünf neue englische Lingui-msgids, die Plan 06-09 extrahieren und übersetzen muss"
affects: [06-09]

# Actuals (#2632) — estimateTokens-Skala (chars/4 über den tatsächlich
# geschriebenen Diff), KEIN Harness-Tokenzähler. pnpm-lock.yaml (+24 Zeilen)
# ist ein generiertes Artefakt und NICHT mitgezählt.
actuals:
  tokens: 5200
  tasks: 2
  commits: 1

# Tech tracking
tech-stack:
  added:
    - "@react-native-community/datetimepicker@9.1.0 (apps/mobile) — natives Modul, von `npx expo install` als SDK-57-kompatibel aufgelöst"
  patterns:
    - "Ein Datum wird NIE über die ISO-Darstellung zu YYYY-MM-DD gekürzt; die lokalen Kalenderkomponenten sind der einzige zulässige Weg"
    - "Der Picker hat zwei Plattformformen: imperativ (Android-Dialog) vs. deklarativ eingebettet (iOS) — ein Screen, zwei Aufrufformen"
    - "onValueChange/onDismiss statt des in 9.x deprecateten onChange"
    - "Ein Pressable, das wie ein Eingabefeld aussieht, braucht einen EIGENEN ViewStyle — der TextInput-Style trägt Textproperties, die auf einer View nichts verloren haben"

key-files:
  created: []
  modified:
    - apps/mobile/app/(profile-setup)/complete-profile.tsx
    - apps/mobile/package.json
    - apps/mobile/app.json
    - pnpm-lock.yaml

key-decisions:
  - "maximumDate = heute am Picker: KEINE Altersgrenze, sondern ein Riegel gegen ein Geburtsdatum in der Zukunft, das deriveAge() auf null abbildet und die Identitätszeile stumm um das Alter kürzen würde"
  - "startOnYearSelection nur auf Android — die Jahresliste öffnet zuerst, damit ein Geburtsjahr nicht per Monatsblättern erreicht werden muss"
  - "Geschlecht bleibt Freitext, kein Auswahlfeld — eine Taxonomie festzulegen ist genau der Teil, den IDN-02 vertagt"
  - "Leere Felder gehen als explizites null über die Leitung, nicht als '' — ein leerer String würde als echter Wert persistiert"
  - "Die Serialisierung bleibt im Screen (nicht in lib/), weil die Akzeptanzkriterien des Plans wörtlich auf dieser Datei greppen — mit der ehrlichen Folge, dass sie NICHT unit-getestet ist"

patterns-established:
  - "Vor der Installation eines nativen Moduls wird bundledNativeModules.json der installierten SDK gelesen — das ist der belastbarste Legitimitätsbeweis für einen Paketnamen"
  - "Erklärende Kommentare dürfen kein Literal enthalten, auf das ein Akzeptanz-Grep negativ prüft (zweiter Fall dieser Art in dieser Phase, nach 06-02)"

requirements-completed: []

coverage:
  - id: D1
    description: "Das Geburtsdatum wird aus LOKALEN Jahr-/Monat-/Tagesanteilen zu YYYY-MM-DD zusammengesetzt; der Weg über die ISO-/UTC-Darstellung ist ausgeschlossen"
    requirement: PROF-01
    verification:
      - kind: other
        ref: "Statische Prüfung an der Datei: `grep -q 'toISOString'` schlägt fehl (Literal kommt nirgends vor, auch nicht im Kommentar); `getFullYear`, `getMonth` und `getDate` sind alle drei vorhanden und stehen ausschließlich in `toLocalDateOnly`"
        status: pass
    human_judgment: false
    rationale: "Der Fehler wäre eine Zeitzonenumrechnung, und die kann in diesem Screen nur über die eine ausgeschlossene Aufrufform entstehen. Die Abwesenheit des Aufrufs ist damit der Beweis. Ein Laufzeittest ist hier NICHT möglich: die Funktion liegt per Akzeptanzkriterium in Screen-Code, den der node-env-Vitest-Runner nicht importieren kann."
  - id: D2
    description: "Alle drei Felder sind optional — ein Absenden ohne sie bleibt gültig, der CTA bleibt aktiv"
    requirement: PROF-01
    verification:
      - kind: other
        ref: "`canSubmit` hängt nachweislich nur an usernameStatus, conflict, displayNameTrimmed und submitting; pronoun/birthDate/gender kommen im Ausdruck nicht vor. Der Contract (06-02) trägt alle drei als .nullable().optional(), was der Mobile-Typecheck gegen den null-Fall bestätigt."
        status: pass
    human_judgment: false
    rationale: "Reine Datenflussaussage über einen booleschen Ausdruck; kein Ermessensanteil."
  - id: D3
    description: "Das native Modul ist auflösbar und wird in die App gebündelt"
    requirement: PROF-01
    verification:
      - kind: build
        ref: "`pnpm --filter @quiks/mobile build` (expo export --platform ios --platform android) exit 0 — ios-Bundle 7.1 MB, android-Bundle 7.4 MB, beide nach dem Hinzufügen des Imports erzeugt"
        status: pass
    human_judgment: false
    rationale: "Der Bundler löst den Import auf; ein falscher oder fehlender Paketname würde hier abbrechen. Beweist die JS-Auflösung, NICHT die native Darstellung."
  - id: D4
    description: "Der native Picker öffnet sich auf dem Gerät und liefert ein Datum zurück"
    requirement: PROF-01
    verification:
      - kind: manual_uat
        ref: "OFFEN — braucht einen nativen Rebuild (`npx expo run:android` aus apps/mobile) und eine Prüfung am Gerät"
        status: pending
    human_judgment: true
    rationale: "Der apps/mobile-Vitest-Runner ist node-env und rendert keine RN-Komponenten; kein automatisierter Lauf dieser Phase kann eine native Dialogdarstellung belegen. Diese Zeile bleibt bewusst offen statt als bestanden markiert."

# Metrics
duration: ~25min
completed: 2026-08-12
status: complete
---

# Phase 6 Plan 08: Optionale Identitätsfelder im Erstellungsscreen Summary

**Drei optionale Felder hängen jetzt im bestehenden Profil-Erstellungsformular — Pronomen und Geschlecht als Freitext, das Geburtsdatum über einen nativen Picker, der aus lokalen Kalenderkomponenten zu `YYYY-MM-DD` serialisiert und die UTC-Umrechnung ausdrücklich meidet.**

## Performance

- **Duration:** ~25min
- **Tasks:** 2 von 2 (Task 1 blockierender Checkpoint, Task 2 Umsetzung)
- **Files modified:** 4 (0 neu, 4 geändert)

## Accomplishments

- **Der Paketname ist nicht mehr `[ASSUMED]`.** Der Checkpoint verlangte eine Registry-Prüfung. Der stärkste Befund kam aus dem eigenen Arbeitsbaum: `node_modules/expo/bundledNativeModules.json` der installierten SDK 57 führt `"@react-native-community/datetimepicker": "9.1.0"` als eigenen Eintrag. Der Name stammt damit aus einer Datei der installierten SDK, nicht aus Trainingswissen — genau die Lücke, die der Threat T-06-SC benannt hatte. Ergänzend aus der Registry: Repository `react-native-datetimepicker/datetimepicker`, MIT, zuletzt am 2026-06-16 veröffentlicht, 35 Maintainer inklusive Expo-Kernteam (`brentvatne`, `evanbacon`, `lunaleaps`).
- **Installiert wurde über Expo, nicht über den Paketmanager.** `npx expo install` aus `apps/mobile` meldete „Installing 1 SDK 57.0.0 compatible native module" und löste selbst auf `9.1.0` auf. Nichts wurde aus der Research gepinnt.
- **Die API stammt aus dem installierten Paket, nicht aus der Erinnerung.** `src/index.d.ts` und die README von 9.1.0 wurden gelesen. Zwei Befunde, die eine Umsetzung aus dem Gedächtnis verfehlt hätte: `onChange` ist in 9.x **deprecated** (die aktuelle Form ist `onValueChange` + `onDismiss`), und Android empfiehlt ausdrücklich die imperative `DateTimePickerAndroid.open()`-Form, während iOS die Komponente eingebettet rendert. Beide Formen sind jetzt jeweils plattformrichtig implementiert.
- **Die Serialisierung meidet die UTC-Falle.** `toLocalDateOnly()` baut den String aus `getFullYear`/`getMonth`/`getDate`. Der Weg über die ISO-Darstellung hätte westlich von UTC ein an lokaler Mitternacht gewähltes Datum als Vortag abgeschickt — eine stumme Tagesverschiebung in einem personenbezogenen Feld (T-06-34). Das Literal kommt in der Datei nirgends vor, auch nicht in einem Kommentar.
- **Drei Felder, kein neuer Mechanismus.** Sie reiten auf dem bestehenden `submitting`-Zustand, der bestehenden `submitError`-Fläche und der einen bestehenden `completeProfile`-Mutation mit (UI-SPEC #44/#45/#47). Es gibt weiterhin genau eine Aufrufstelle. `canSubmit` wurde nicht angefasst — die drei Felder tauchen im Ausdruck bewusst nicht auf, damit jede Teilmenge (inklusive der leeren) absendbar bleibt (#43/#46).
- **Keine Policy, wie festgelegt.** Keine Altersgrenze, kein Sichtbarkeitsschalter, kein Signup-Disclaimer. Der Rest von IDN-02 bleibt Birgits Konzept.

## Task Commits

1. **Task 1: Paket-Legitimität bestätigen** — **kein Commit.** Blockierender Checkpoint; vom User mit `approved` beantwortet, nachdem der `bundledNativeModules.json`-Befund vorlag.
2. **Task 2: Picker installieren und die drei Felder einbauen** — `73e41b5` (feat)

## Files Created/Modified

- `apps/mobile/app/(profile-setup)/complete-profile.tsx` — `toLocalDateOnly()` auf Modulebene; `PRONOUN_MAX`/`GENDER_MAX` (20/30) als weiche Client-Spiegel der Serverkappen; vier neue State-Werte (`pronoun`, `gender`, `birthDate`, `iosPickerOpen`); `handleBirthDatePress()` mit der Plattformverzweigung; drei neue Feldblöcke zwischen Anzeigename und Absende-Fehlerfläche; drei neue Styles (`pickerField`, `pickerValue`, `pickerPlaceholder`); der Request-Body um die drei Schlüssel erweitert.
- `apps/mobile/package.json` — `"@react-native-community/datetimepicker": "9.1.0"`.
- `apps/mobile/app.json` — `"@react-native-community/datetimepicker"` in der `plugins`-Liste. **Von `npx expo install` selbst hinzugefügt**, siehe Abweichung 1.
- `pnpm-lock.yaml` — +24 Zeilen, generiert.

## Decisions Made

- **`maximumDate` steht auf heute — das ist KEINE Altersgrenze.** Eine Altersgrenze verlangt ein Mindestalter; dieser Riegel verhindert nur ein Geburtsdatum in der *Zukunft*. Ohne ihn kann der Visitor 2087 wählen, `deriveAge()` (06-03) liefert dafür korrekt `null`, und die Identitätszeile ließe das Alter kommentarlos weg — eine stille Sackgasse. Das ist Rule 2 (fehlende Eingabevalidierung), nicht Policy. Der Akzeptanz-Grep auf `minAge|ageLimit|volljährig|visibility` bleibt leer.
- **`startOnYearSelection: true`, aber nur auf Android.** Die README markiert die Option als Android-only. Sie löst genau das Geburtsdatums-Problem: ohne sie öffnet der Kalender im aktuellen Monat und ein Geburtsjahr liegt Jahrzehnte Blätterns entfernt.
- **Als Anker dient heute, nicht „heute minus 25 Jahre".** Der Picker braucht ein `value`, auch wenn nichts gewählt ist. Ein Alters-Anker hätte eine demografische Annahme in den Code geschrieben; kombiniert mit der Jahresliste ist der neutrale Anker zumutbar.
- **Ein eigener `pickerField`-Style statt `styles.input`.** Die Geburtsdatumsfläche ist ein `Pressable`, also eine View. `styles.input` trägt `fontSize` und `color` — Textproperties, die der Typecheck auf einer View zu Recht abweist. Die Box-Maße sind identisch, damit die drei Felder als eine Spalte lesen.
- **Leere Felder gehen als `null`, nicht als `''`.** Der Contract erlaubt beides (`.nullable().optional()`), aber ein leerer String würde als echter Wert in `visitor_profile` landen und wäre später nicht von „bewusst leer gelassen" zu unterscheiden.
- **Die Serialisierung bleibt im Screen.** Sie gehört fachlich nach `lib/`, wo der Vitest-Runner sie beweisen könnte. Die Akzeptanzkriterien des Plans greppen aber wörtlich `complete-profile.tsx` auf `getFullYear`/`getMonth`/`getDate` und auf die Abwesenheit des ISO-Literals — ein Auslagern hätte sie gebrochen. Der Plan hat Vorrang; der Preis ist eine ungetestete Funktion und ist unten unter „Deferred Issues" verzeichnet.

## Deviations from Plan

Zwei Abweichungen, beide auto-fixed.

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `apps/mobile/app.json` mitgeändert, obwohl der Plan es nicht als betroffene Datei führt**
- **Found during:** Task 2, Installationsschritt
- **Issue:** `npx expo install` meldete am Ende „Added config plugin: @react-native-community/datetimepicker" und trug den Eintrag selbst in die `plugins`-Liste von `app.json` ein. Der Plan listet unter `files_modified` nur `complete-profile.tsx`, `package.json` und `pnpm-lock.yaml`.
- **Fix:** Der Eintrag bleibt. Das Config-Plugin ist Teil des vom Plan ausdrücklich verlangten Expo-Installationswegs; ihn zurückzunehmen hieße, den Prebuild-Schritt des nativen Moduls zu entfernen und die Installation halb zu lassen. Die Datei wurde im selben Commit mitgeführt.
- **Files modified:** `apps/mobile/app.json`
- **Committed in:** `73e41b5`

**2. [Rule 3 - Blocking] Drei erklärende Kommentare umformuliert, weil sie zwei Akzeptanz-Greps brachen**
- **Found during:** Task 2, Akzeptanzprüfung
- **Issue:** Zwei Kriterien prüfen auf die *Abwesenheit* von Literalen in der Datei. Meine Kommentare enthielten sie wörtlich: die Begründung der Serialisierung zitierte `toISOString().slice(0, 10)` als den vermiedenen Weg, und zwei Kommentare schrieben „visibility" (einmal für den React-State des iOS-Pickers, einmal für „NO visibility control"). Beide Greps meldeten FAIL, obwohl im Code nichts davon vorkommt.
- **Fix:** Dieselben Aussagen in Prosa: „taking the first ten characters of the ISO representation", „open/closed state lives in React", „NO who-can-see-this switch". Beide Greps stehen auf PASS, die Begründungen sind erhalten.
- **Files modified:** `apps/mobile/app/(profile-setup)/complete-profile.tsx`
- **Committed in:** `73e41b5`
- **Anmerkung:** Zweiter Fall dieser Art in dieser Phase — 06-02 hatte dasselbe mit `z.date()` in einem Doc-Kommentar. Das ist ein wiederkehrendes Muster dieser Phase, kein Zufall.

---

**Total deviations:** 2 auto-fixed
**Impact on plan:** Keine `must_haves`-Zeile, kein Verhalten und kein Typ berührt. Abweichung 1 erweitert die Dateiliste um eine von Expo selbst geschriebene Zeile.

## Threat-Model-Stand

- **T-06-SC (Tampering, mitigate) — erfüllt.** Der blockierende Checkpoint lief vor der Installation und wurde nicht automatisch freigegeben (Auto-Modus war ohnehin aus). Die Prüfung ging über die Registry-Seite hinaus: `bundledNativeModules.json` der installierten SDK 57 pinnt genau diesen Paketnamen auf genau diese Version. Installiert wurde über `npx expo install`, das die SDK-kompatible Version selbst auflöst.
- **T-06-33 (DoS, mitigate) — erfüllt.** Die Client-Kappen 20/30 sitzen als `maxLength` plus `.slice()` auf den beiden Freitextfeldern und sind bewusst nur weich. Das echte Gate liegt serverseitig in 06-02 und wurde dort mit einer Grenzwert-Assertion bewiesen.
- **T-06-34 (Tampering, mitigate) — erfüllt.** `toLocalDateOnly()` liest ausschließlich lokale Kalenderkomponenten. Das ISO-Literal kommt in der ganzen Datei nicht vor.
- **T-06-35 (Information Disclosure, accept) — WISSENTLICH GETRAGEN.** Personenbezogene Daten (Geburtsdatum, Geschlecht) werden ohne Disclaimer, ohne Altersgrenze und ohne Sichtbarkeitssteuerung erfasst. Das ist der ausdrückliche Umfang von D-12; der Einwand wurde im Discuss benannt und überstimmt. **IDN-02 bleibt offen und hängt an Birgits Sicherheits-/Jugendschutzkonzept.** Zusammen mit dem in 06-02 verzeichneten T-06-06 gilt weiterhin: bevor der erste Endpunkt ein FREMDES Profil ausliefert, muss `visitorProfilePublicSchema` in eine Eigentümer- und eine Freundes-Sicht getrennt werden.

## Issues Encountered

- **Kein Metro-Watcher, keine ENOENT-Installation.** Die Vorbedingung wurde vor dem Aufruf geprüft: keine Prozesse auf 8081/8082/19000/19001. `pnpm install --frozen-lockfile` meldete anschließend „Lockfile is up to date, resolution step is skipped" — die Sperrdatei ist konsistent, der Diff beträgt +24 Zeilen ohne eine einzige Entfernung.
- **Prettier hat die Datei nachformatiert.** `--check` schlug an, `--write` hat es behoben; danach liefen Lint, Typecheck, Tests und die Akzeptanz-Greps erneut und alle grün.
- **Das `expo export`-Artefakt wurde entfernt.** `apps/mobile/dist/` ist gitignored und wurde nach dem Build gelöscht. Es läuft kein Dev-Server und kein Metro-Prozess.

## Verification — was bewiesen ist und was NICHT

Grün gelaufen: `pnpm install --frozen-lockfile`, `pnpm --filter @quiks/mobile lint`, `typecheck`, `test` (17 Dateien, 188 Tests) und `build` (beide Plattform-Bundles erzeugt). Alle sechs Akzeptanz-Greps stehen auf PASS.

**Was diese Läufe ausdrücklich NICHT belegen — und nicht als belegt behauptet wird:**

- **Die native Picker-Darstellung.** Der `apps/mobile`-Vitest-Runner ist node-env und rendert keine React-Native-Komponenten. Dass sich der Android-Dialog öffnet, dass die Jahresliste zuerst erscheint, dass der iOS-Spinner eingebettet erscheint und dass `onValueChange` ein Datum zurückliefert, ist **ungeprüft**. `build` beweist nur, dass der Import im JS-Graph auflösbar ist.
- **Die Serialisierung zur Laufzeit.** `toLocalDateOnly()` hat keinen Unit-Test, weil sie per Akzeptanzkriterium im Screen liegt und der Runner Screen-Code nicht importieren kann. Bewiesen ist nur die Abwesenheit der falschen Aufrufform.
- **Das Layout der drei neuen Felder** in hell und dunkel, und ob die Identitätszeile des Profilkopfs bei drei Feldern auf Maximallänge bricht (die `backstop`-Zeile der `must_haves`). Beides gehört in den `/gsd-ui-review` bzw. die UAT.

## User Setup Required

**Ein nativer Rebuild ist nötig, bevor der Picker auf dem Gerät funktioniert.**

`@react-native-community/datetimepicker` enthält nativen Code (Android- und iOS-Quellen plus ein Expo-Config-Plugin). Ein JS-Reload über Metro oder ein OTA-Update per `eas update` nimmt ihn **nicht** auf — der Screen würde zur Laufzeit über das fehlende native Modul stolpern.

```
cd apps/mobile
npx expo run:android
```

**Aus `apps/mobile`, niemals aus dem Repo-Root** — ein Root-Lauf erzeugt ein veraltetes Root-`android/` mit dem alten Paketnamen und bricht den Build.

## Next Phase Readiness

- **`06-09` muss die neuen Strings extrahieren.** Dieser Plan hat `locales/{de,en}/messages.po` bewusst nicht angefasst. Fünf neue englische msgids sind hinzugekommen: `Pronouns`, `Date of birth` (einmal als `<Trans>`, einmal als `accessibilityLabel` über `t` — gleiche msgid), `Choose a date`, `Gender` und `Optional`. **Achtung:** `Optional` ist eine NEUE, eigenständige msgid — der Avatar-Block trägt weiterhin die andere Zeichenkette `Optional. You can add this later.` Ohne den Extract-Lauf rendern die Felder auf Deutsch die englischen Quelltexte.
- **`06-07` (Identitäts- und Meta-Zeile) ist unberührt.** Es liest `pronoun`/`birthDate`/`gender` aus `GET /me`; dieser Plan ist die Schreibseite derselben drei Felder. Beide benutzen `deriveAge` bzw. `buildIdentityLine` aus 06-03.
- **Offener Punkt, der mitgeht:** die Gerätepüfung des Pickers (coverage D4, `pending`) und der mitwandernde IDN-02/T-06-06-Vorbehalt aus 06-02.

## Deferred Issues

- **`toLocalDateOnly()` ist nicht unit-getestet.** Sie liegt per Akzeptanzkriterium in Screen-Code, den der node-env-Runner nicht importieren kann. Wenn diese Logik später Absicherung braucht, ist der Weg ein Umzug nach `apps/mobile/lib/` samt Test — das würde aber die Greps dieses Plans brechen und gehört deshalb in einen eigenen Schnitt, nicht hierher.

## Self-Check: PASSED

- `apps/mobile/app/(profile-setup)/complete-profile.tsx` — vorhanden und getrackt
- `apps/mobile/package.json` trägt `@react-native-community/datetimepicker: 9.1.0` — bestätigt
- Commit `73e41b5` — in der Historie vorhanden, 4 Dateien, 239 Einfügungen, **0 Löschungen**
- Alle 6 Akzeptanz-Greps erfüllt (kein `toISOString`; `getFullYear`+`getMonth`+`getDate` vorhanden; `birthDate` im Body; keine Policy-Literale; genau 1 `completeProfile`-Aufrufstelle; Paket in `package.json`)
- `lint`, `typecheck`, `test` (188/188), `build` und `pnpm install --frozen-lockfile` grün
- Kein Dev-Server und kein Metro-Prozess hinterlassen

---
*Phase: 06-profile-friends-placeholders*
*Completed: 2026-08-12*
</content>
