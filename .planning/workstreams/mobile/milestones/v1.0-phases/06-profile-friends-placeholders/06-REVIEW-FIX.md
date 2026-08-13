---
phase: 06-profile-friends-placeholders
fixed_at: 2026-08-12T10:00:00Z
review_path: .planning/workstreams/mobile/phases/06-profile-friends-placeholders/06-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 6: Code Review Fix Report

**Fixed at:** 2026-08-12T10:00:00Z
**Source review:** `.planning/workstreams/mobile/phases/06-profile-friends-placeholders/06-REVIEW.md`
**Iteration:** 1

**Zusammenfassung:**
- Findings im Scope: 5 (CR-01, WR-01 … WR-04)
- Gefixt: 5
- Übersprungen: 0
- Die fünf Info-Findings (IN-01 … IN-05) waren ausdrücklich nicht im Scope und wurden nicht angefasst.

## Gates

Alle Gates liefen im **Haupt-Checkout** (`C:/Users/Emil/Documents/Privat/Projekte/festipal`) auf
`docs/phase-06-context`, nachdem der Isolations-Worktree per Fast-Forward zurückgeführt und entfernt
war. Der Worktree selbst hat keine `node_modules` und kann die Gates nicht ausführen — die Zahlen
unten sind also aus genau dem Baum reproduzierbar, den man vor sich hat.

| Gate | Baseline | Nach den Fixes |
|---|---|---|
| `pnpm lint` | 10/10 | **10/10** |
| `pnpm typecheck` | 10/10 | **10/10** |
| `pnpm test` | 7/7 | **7/7** |
| — `apps/api` | 49/49 | **55/55** (6 neue Tests, siehe WR-02) |
| — `apps/mobile` | 188/188 | **188/188** |

**Anmerkung zur Umgebung:** Beim ersten Lauf fiel `@quiks/api` mit 5 Fehlern / 8 fehlgeschlagenen
Test-Files um — Ursache war `ECONNREFUSED` gegen `localhost:5432`, nicht eine der Änderungen: Docker
Desktop und damit die lokale Postgres waren nicht gestartet. Nach `docker compose up -d`
(`quiks-postgres-1`, `quiks-mailpit-1`, beide healthy) laufen die API-Tests grün durch. Die Container
laufen jetzt noch — falls sie nicht laufen sollen, `docker compose down`.

## Fixed Issues

### CR-01: React-Query-Cache überlebt den Logout

**Files modified:** `apps/mobile/app/_layout.tsx`
**Commit:** `6707cf9`
**Status:** fixed: requires human verification
**Applied fix:** Im bereits existierenden CR-01-(05)-Reset-Effekt (Übergang nach
`unauthenticated`, deckt beide Logout-Pfade ab — den natürlichen `!session`-Zweig und
`forceUnauthenticated()`) wird der modul-globale `queryClient` jetzt geleert.

Die Reihenfolge ist bewusst `cancelQueries()` **vor** `clear()`: Damit wird ein noch fliegendes
`GET /me` der ALTEN Session mit einem `CancelledError` abgebrochen, bevor der Cache geleert wird —
sein Result kann danach nicht mehr in den geleerten Cache fallen. Das war die Race, auf die die
Guidance hingewiesen hat. (`clear()` zerstört jede Query und cancelt dabei ihren Retryer ohnehin
selbst — der explizite Cancel ist Gürtel-und-Hosenträger, aber er ist die Hälfte, die die Absicht
ausspricht, und bleibt deshalb stehen.) Beim initialen Cold-Start ist das Paar ein No-op auf leerem
Cache.

Der Begründungskommentar steht vollständig an der Fundstelle, inklusive der Einordnung als dritter
und letzter Kanal derselben Fehlerklasse wie Cold-Start-Redirect und Active-Festival-Slug.

**Warum „requires human verification":** Kein automatisierter Test deckt den Logout→Login-Wechsel auf
demselben Gerät ab (dafür bräuchte es einen RN-Renderer plus zwei echte Sessions). Typecheck und
Lint beweisen nur die Form. Die Wirkung selbst — Account B sieht nach dem Login von Account A
**nichts** mehr von A in Profil/Friends/Home — gehört am Gerät nachgestellt, am besten mit
abgeschaltetem Netz direkt nach dem zweiten Login, weil genau dann der Refetch fehlschlägt und die
alten Daten früher dauerhaft stehen geblieben wären.

### WR-01: Toter Dark-Mode-Switch auf System-Dark-Geräten

**Files modified:** `apps/mobile/app/(tabs)/mehr.tsx`, `apps/mobile/lib/theme.ts`
**Commit:** `8790e1c`
**Status:** fixed: requires human verification
**Applied fix:** `handleDarkModeChange` schreibt beim Ausschalten `'light'` statt `'system'`. Der
Switch spiegelt weiterhin den effektiven Modus (`mode === 'dark'`) — reflektierter und geschriebener
Zustand stimmen damit in **beide** Richtungen überein, und auf einem System-Dark-Gerät lässt sich
Dark Mode jetzt tatsächlich abschalten.

Der Typ und die Persistenz existierten bereits; `resolveEffectiveThemeMode('light', 'dark') ===
'light'` ist in `apps/mobile/lib/__tests__/theme.test.ts` schon vor diesem Fix zugesichert gewesen —
genau die Invariante, auf der der Fix aufsitzt. Die Hell-first-Invariante von ADR-023 ist nicht
angefasst: der `'system'`-Zweig delegiert unverändert an `resolveThemeMode`, und der schützende
Test-Block bleibt Wort für Wort stehen.

**Abweichung von D-08a (bewusst, wie in der Guidance gefordert explizit ausgewiesen):** Plan 06-05
hat den dritten Zustand `'light'` absichtlich writer-los gelassen („off = Gerät folgt"). Diese
Entscheidung ist mit dem Fix aufgehoben: `'light'` hat jetzt einen Writer, und `'system'` überlebt
nur noch als **Default** (nichts gespeichert, oder ein unlesbarer/manipulierter Wert — siehe
`parseThemeOverride`). Kein Control schreibt `'system'` mehr zurück.

Warum das nötig ist: Von den beiden Zuständen, die ein Switch überhaupt ausdrücken kann, ist genau
das die ehrliche Paarung. Die von der Review angebotene Alternative — der Switch spiegelt das
Override statt des effektiven Modus — würde auf einem Dark-Gerät einen Schalter zeigen, der „AUS"
sagt, während die App dunkel bleibt; das ist kein toter Schalter mehr, aber immer noch eine Anzeige,
die der Realität widerspricht. Der Preis der gewählten Variante ist real und steht so im Code:
Wer den Switch einmal anfasst, verlässt den „folgt dem Gerät"-Zustand endgültig. Ihn zurückzubekommen
braucht die explizite Dreier-Auswahl (segmentiertes Light/Dark/System) — eine spätere Änderung, kein
Bestandteil dieses Fixes. Die Kommentare in `mehr.tsx` und `theme.ts` (dort stand noch „`'light'` has
no writer yet") sind entsprechend nachgezogen.

**Warum „requires human verification":** Es gibt keinen Komponententest für den Mehr-Screen; der
Beweis, dass der Schalter auf einem System-Dark-Gerät jetzt wirklich umlegt (und den Zustand über
einen Relaunch hält), ist ein Gerätetest. `.planning/…/06-VERIFICATION.md` sollte das als offenen
Device-Check führen.

### WR-02: `birthDate` ohne Format-Constraint → 500 statt 400

**Files modified:** `packages/db/src/schema/visitor-profile.ts`, `apps/api/test/me-endpoints.spec.ts`
**Commit:** `53c09dc`
**Status:** fixed
**Applied fix:** Im bestehenden `.extend()`-Override-Block von `visitorProfileInsertSchema` (dort, wo
auch die Caps `pronoun` 20 / `gender` 30 leben — keine neue Shape, keine Re-Deklaration):

```ts
birthDate: z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
  .refine(isCalendarDate, 'not a real calendar date')
  .nullable()
  .optional(),
```

Die Regex allein hätte die Review-Vorgabe erfüllt, schließt aber nur die eine Hälfte: `2020-02-30`
und `2026-13-01` passieren sie und wären weiterhin als Treiberfehler → **500** herausgekommen. Das
`.refine` (UTC-komponentenweiser Vergleich, damit keine lokale Zeitzone den Tag verschiebt) schließt
sie. `.nullable().optional()` steht nach dem Refine — ein weggelassenes Feld bleibt gültig,
eingeschränkt wird nur ein tatsächlich vorhandener Wert. `completeProfileBodySchema` pickt weiter aus
derselben Basis, das Feld ist automatisch mit abgedeckt.

`visitorProfileSelectSchema` bleibt bewusst lose (`z.string().nullable()`): Zeilen, die vor diesem
Constraint geschrieben wurden (etwa ein `'infinity'`), müssen serialisierbar bleiben, sonst macht ein
Altwert aus einem `GET /me` einen 500 — also genau den Fehler, den der Fix beseitigen soll.

Neuer Test (`it.each`, 6 Fälle): `2020-02-30`, `2026-13-01`, `infinity`, `today`, `08/12/2026`, `''`
→ jeweils 4xx **und** anschließend `profile: null`, d. h. nachweislich nichts geschrieben. Die drei
mittleren Werte sind die von Postgres akzeptierten Dialekte, die vorher still gespeichert worden
wären. Erklärt die 49→55-Differenz in der API-Suite; alle 6 grün.

Nicht gemacht (bewusst, Review nennt es „optional"): keine Zukunftsdatums-Prüfung. Die wäre
serverseitig zeitzonenabhängig (Server-„heute" vs. Client-„heute") und ist eine
Produkt-/Altersgrenzen-Frage, die zu IDN-02 gehört — nicht zu einem Validierungs-Fix.

### WR-03: Jede 23505-Verletzung wurde zu „Username already taken"

**Files modified:** `apps/api/src/me/me.service.ts`, `apps/api/test/me-endpoints.spec.ts`
**Commit:** `8db31c9`
**Status:** fixed
**Applied fix:** Der `catch` in `completeProfile` unterscheidet die beiden Konfliktquellen am
`constraint_name` (in der postgres.js-Typdeklaration als `constraint_name?: string` vorhanden, also
ohne Cast typsicher):

- `visitor_profile_username_lower_unq` → weiterhin `{ status: 'conflict' }` → 409 „Username already
  taken". Der Name steht jetzt als Modulkonstante `USERNAME_UNIQUE_CONSTRAINT` da.
- alles andere (in der Praxis der `accountId`-PK `visitor_profile_pkey`) → „Profil existiert
  bereits": `getProfile(accountId)` und, wenn eines da ist, `{ status: 'ok', profile: existing }`.
  Findet sich wider Erwarten keines, bleibt es beim alten `conflict`.

Die Diskriminierung läuft absichtlich **positiv auf den bekannten Username-Index** und nicht negativ
auf den PK-Namen: Ein umbenannter oder unbenannter Constraint fällt damit in die
Existenz-Prüfung — also in die harmlose Richtung — und nicht in ein falsches „Name ist vergeben".

Damit landet der Retry nach „Timeout, aber Server hat committed" im 200-Pfad, der Client ruft
`refreshAuthState()` und der Guard löst regulär nach `authenticated` auf. Keine Client-Änderung
nötig, wie von der Review vorhergesagt.

**Geänderter Test — die alte Assertion war falsch:** `me-endpoints.spec.ts` erwartete für den zweiten
`complete-profile`-Aufruf desselben Accounts eine 409 und hat damit exakt die Ambiguität zementiert,
die das Finding beschreibt. Der Test erwartet jetzt 200 und prüft zusätzlich, dass die Antwort das
**bestehende** Profil unverändert ist (weder der neu geschickte Username noch der Display-Name
sickern durch) — idempotent, kein verstecktes Update; Profil-Bearbeitung ist PROF-02 mit eigenem
Endpoint. Der echte Username-Konflikt bleibt beweisbar 409: `username-race.spec.ts` lässt dafür zwei
**verschiedene** Accounts um denselben Namen rennen, dieser Pfad ist unverändert und grün.

### WR-04: SoonToast ist für iOS-VoiceOver stumm

**Files modified:** `apps/mobile/components/SoonToast.tsx`
**Commit:** `4f14feb`
**Status:** fixed: requires human verification
**Applied fix:** `show()` sagt die Nachricht zusätzlich imperativ an
(`AccessibilityInfo.announceForAccessibility(next)`, Import aus `react-native` ergänzt), direkt nach
`setMessage(next)` und vor dem Timer. Das bestehende Android-Verhalten bleibt unangetastet:
`accessibilityLiveRegion="polite"` am Pill bleibt stehen — auf Android ist die Ansage damit redundant,
nicht schädlich, und die Live-Region ist dort der plattformnative Weg.

**Warum „requires human verification":** Off-device nicht prüfbar. Ob VoiceOver die Ansage
tatsächlich spricht, zeigt nur ein echter iOS-Build mit eingeschaltetem VoiceOver auf einer der
Placeholder-Zeilen (Payment methods, Language, Share handle, Show QR, Suche). Der Hinweis steht auch
als Kommentar an der Fundstelle.

## Nicht angefasst

- **IN-01 … IN-05** — außerhalb des Scopes (`fix_scope: critical_warning`), unverändert offen.
- **Lingui-Kataloge** — keiner der fünf Fixes führt einen neuen user-facing String ein, deshalb kein
  `lingui extract`, keine Katalog-Änderung. `git diff 55bdb1a..HEAD -- apps/mobile/locales` ist leer;
  der in dieser Phase erreichte Stand (0 fehlende DE-Werte, `compile --strict` sauber) ist nicht
  angetastet.
- **Keine neuen Dateien**, keine Änderung an `packages/contracts` selbst (das `birthDate`-Constraint
  sitzt in der drizzle-zod-Basis in `packages/db`, aus der `completeProfileBodySchema` pickt — genau
  wie es die Architekturregel verlangt).

---

_Fixed: 2026-08-12T10:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
