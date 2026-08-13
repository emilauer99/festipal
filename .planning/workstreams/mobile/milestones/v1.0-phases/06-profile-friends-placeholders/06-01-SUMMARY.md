---
phase: 06-profile-friends-placeholders
plan: 01
subsystem: ui
tags: [expo-router, react-native, tabs, navigation, lingui, tanstack-query, ts-rest]

# Dependency graph
requires:
  - phase: 05-festival-selection-home
    provides: "FloatingNav als eigener tabBar-Renderer, (tabs)-Shell mit home/festivals, Stack.Protected-Guardmodell in app/_layout.tsx"
  - phase: 04-visitor-auth-profile-completion
    provides: "AvatarTile + deriveInitials, gerätelokaler MMKV-Avatarspeicher (avatar-uri:${accountId}), GET /me über apiClient"
  - phase: 05.1-quiks-rename-ci-v1-0-rollout
    provides: "createStyles(colors)/useTheme() hell-first, fontFamilyForRole, typeRoles-Tracking-Gate"
provides:
  - "Vier echte, registrierte Tab-Routen: home · festivals · friends · mehr (D-01)"
  - "FloatingNav ohne jeden nicht navigierenden Platzhalter — alle Tabs laufen durch einen Renderzweig"
  - "app/profil.tsx als Root-Stack-Push-Screen außerhalb (tabs), registriert im authentifizierten Stack.Protected-Block"
  - "View-only Profilkopf + Konto-E-Mail aus GET /api/v1/me"
  - "Screen-Shells für Friends und Mehr, auf die 06-05/06-06/06-07 additiv aufsetzen"
affects: [06-04, 06-05, 06-06, 06-07, 06-09]

# Actuals (#2632) — estimateTokens-Skala (chars/4 über die tatsächlich geänderten Dateien),
# KEIN Harness-Tokenzähler. Der Planwert (70000) lag deutlich darüber.
actuals:
  tokens: 14458
  tasks: 2
  commits: 1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Root-Level-Push-Screen als Geschwister der (tabs)-Gruppe versteckt die FloatingNav ohne eigene Sichtbarkeitslogik"
    - "Tab-Label-Auflösung als per-Render-Record mit einem textuellen Lingui-t-Aufruf je Route"

key-files:
  created:
    - apps/mobile/app/profil.tsx
    - apps/mobile/app/(tabs)/mehr.tsx
    - apps/mobile/app/(tabs)/friends.tsx
  modified:
    - apps/mobile/app/(tabs)/_layout.tsx
    - apps/mobile/app/_layout.tsx
    - apps/mobile/components/FloatingNav.tsx

key-decisions:
  - "Menu ist das Mehr-Glyph, UserRound bleibt für Avatar-/Profilkontext reserviert (RESEARCH Open Question 2)"
  - "Anzeigename nutzt die bestehende Rolle title2 statt eines neuen title1-Tokens — vermeidet die packages/ui-Kollisionszone mit dem Admin-Stream und den Guard-Test-Umbau"
  - "Quellsprachen-Strings bleiben Englisch (lingui sourceLocale: 'en'); die deutschen Designtexte sind DE-Katalogwerte und landen in 06-09"
  - "Header/Titel des Profil-Screens setzt der Screen selbst — useLingui() ist in app/_layout.tsx nicht aufrufbar, weil diese Komponente den I18nProvider rendert"
  - "requirements mark-complete bewusst NICHT ausgeführt: HOME-03/PROF-01/FRND-01 werden von 06-05..06-09 weitergebaut"

patterns-established:
  - "Deklarationsreihenfolge der Tabs.Screen-Einträge ist die Tab-Reihenfolge (state.routes) — dokumentiert in (tabs)/_layout.tsx"
  - "Ein pushbarer Vollbild-Screen wird explizit im authentifizierten Stack.Protected-Block registriert; der Block hat keinen Auto-Discovery-Fallback"

requirements-completed: []

coverage:
  - id: D1
    description: "Die globale Tab-Leiste zeigt vier echte, tappbare Routen in der Reihenfolge Start · Festivals · Friends · Mehr; kein Eintrag ist mehr dekorativ-deaktiviert"
    requirement: HOME-03
    verification:
      - kind: other
        ref: "pnpm --filter @quiks/mobile typecheck && lint && test (14 Dateien / 148 Tests) + Akzeptanz-Greps name=\"friends\" / name=\"mehr\" / disabled==0"
        status: pass
      - kind: manual_procedural
        ref: "06-01-PLAN.md Task 2, Geräteabnahme Schritte 2-4 + 7 — vom User am Gerät durchlaufen und mit \"approved\" abgenommen (2026-08-11)"
        status: pass
    human_judgment: true
    rationale: "Routenregistrierung, Tab-Reihenfolge und Tappbarkeit sind mit dem node-env-Vitest-Runner dieses Projekts strukturell nicht beweisbar (es rendert keine RN-Komponenten). Nur ein Gerätelauf zeigt sie."
  - id: D2
    description: "Mehr → Konto → Profil pusht app/profil.tsx (kein Unmatched-Route-Screen); der Screen zeigt displayName, @username und E-Mail aus GET /me view-only und blendet die FloatingNav aus"
    requirement: PROF-01
    verification:
      - kind: other
        ref: "Akzeptanz-Greps: name=\"profil\" in app/_layout.tsx, router.push('/profil') in (tabs)/mehr.tsx, getMe in app/profil.tsx, profil.tsx auf Root-Ebene und nicht unter (tabs)"
        status: pass
      - kind: manual_procedural
        ref: "06-01-PLAN.md Task 2, Geräteabnahme Schritte 5, 6 und 8 (inkl. Flugmodus-Fehlerzweig) — vom User am Gerät durchlaufen und mit \"approved\" abgenommen (2026-08-11)"
        status: pass
    human_judgment: true
    rationale: "Pitfall 1 (Unmatched Route) ist genau die Fehlerklasse, die im Repo schon einmal als first-login-unmatched-route zuschlug und die kein Unit-Test sieht; die Sichtbarkeit der FloatingNav ist reines Renderverhalten."
  - id: D3
    description: "Friends-Tab rendert als globaler Screen ohne Festival-State mit der Anfragen-Sektion und deren eigenem Leerzustandstext"
    requirement: FRND-01
    verification:
      - kind: manual_procedural
        ref: "06-01-PLAN.md Task 2, Geräteabnahme Schritt 3 — vom User am Gerät durchlaufen und mit \"approved\" abgenommen (2026-08-11)"
        status: pass
    human_judgment: true
    rationale: "Leerzustands-Copy ist genau das Phasenrisiko aus D-11 (sechs leere Sektionen dürfen nicht kaputt wirken) — eine reine Ermessensfrage, die nur am gerenderten Screen zu beurteilen ist. Zudem sind die DE-Katalogwerte erst nach 06-09 sichtbar."

# Metrics
duration: ~2h50m (davon ~20min Umsetzung, Rest Wartezeit auf die Geräteabnahme)
completed: 2026-08-11
status: complete
---

# Phase 6 Plan 01: Tracer — vier echte Tabs und der Pfad Mehr → Profil Summary

**Vier registrierte Tab-Routen (Start · Festivals · Friends · Mehr) plus ein Root-Stack-Push-Screen `app/profil.tsx`, der `GET /api/v1/me` view-only rendert — der komplette Phasen-Durchstich von der Tab-Leiste bis zur API, am Gerät abgenommen.**

## Performance

- **Duration:** ~2h50m Wanduhr (~20min Umsetzung + Verifikation, der Rest Wartezeit auf die menschliche Geräteabnahme)
- **Started:** 2026-08-11T18:00:00Z (ca.)
- **Completed:** 2026-08-11T20:48:34Z
- **Tasks:** 2 von 2 (Task 1 Implementierung, Task 2 Geräte-Checkpoint)
- **Files modified:** 6 (3 neu, 3 geändert)

## Accomplishments

- **Die Wurzelnavigation ist umgestellt (D-01).** `(tabs)/_layout.tsx` registriert vier `Tabs.Screen`; die Deklarationsreihenfolge — jetzt ausdrücklich als solche kommentiert — erzeugt `state.routes` und damit die Leistenreihenfolge.
- **`FloatingNav` hat keinen zweiten Renderzweig mehr.** `LiveRouteName` und `LIVE_TAB_ICON` decken alle vier Routen ab, die Labelauflösung ist ein per-Render-Record mit je einem textuellen `t`-Aufruf, und die beiden nicht navigierenden Platzhalter-Items samt ihrer Hilfskomponente und Styles sind gelöscht. Labels sind einzeilig mit Abschneiden am Ende (UI-SPEC #42), die Items teilen sich die Leiste zu gleichen Teilen (UI-SPEC #41).
- **Der architektonisch riskanteste Teil der Phase ist bewiesen.** `app/profil.tsx` liegt auf Root-Ebene außerhalb `(tabs)` und ist explizit im authentifizierten `Stack.Protected`-Block registriert — die Zeile, deren Fehlen laut Pitfall 1 zum Unmatched-Route-Screen führt. Am Gerät erscheint das Profil, nicht der Unmatched-Screen.
- **Der Profil-Screen ist echt und schreibfrei.** Eine `useQuery(['me'])` mit den drei Zweigen Loading / Error+Retry / Populated; Avatar aus dem gerätelokalen MMKV-Speicher (D-05, ohne jeden Upload-Hinweis), `displayName` in `title2`, `@username` in `countdown`/Beere, E-Mail als Konto-Zeilenwert. Kein Eingabefeld, keine Mutation, kein Account-Parameter im Aufruf (T-06-02).
- **Zwei Screen-Shells stehen für die Folgepläne.** Friends (Anfragen + Leerzustand, kein Festival-State per D-10) und Mehr (Konto + Profil-Zeile) folgen dem `createStyles(colors)`/`useMemo`/`fontFamilyForRole`-Muster, sodass 06-05/06-06/06-07 rein additiv danebenbauen können.

## Task Commits

1. **Task 1: Tracer — vier echte Tabs und der Pfad Mehr → Profil mit echten /me-Daten** — `b8182d9` (feat)
2. **Task 2: Geräteabnahme des Tracer-Pfads** — **kein Commit.** Reine Verifikations-Task ohne Dateiänderungen; das Ergebnis ist hier und in STATE.md protokolliert, nicht als Artefakt committet.

**Plan metadata:** siehe der abschließende `docs(06-01)`-Commit dieses Summarys.

## Files Created/Modified

- `apps/mobile/app/(tabs)/_layout.tsx` — registriert zusätzlich `friends` und `mehr`; Kommentar hält fest, dass die Deklarationsreihenfolge die Tab-Reihenfolge ist.
- `apps/mobile/components/FloatingNav.tsx` — vier Live-Routen, `Menu`-Glyph für Mehr, einzeilige/abgeschnittene Labels, Platzhalterzweig und `NavStyles`-Typ entfernt (−79 Zeilen alter Pfad).
- `apps/mobile/app/_layout.tsx` — `<Stack.Screen name="profil" />` im `Stack.Protected guard={… === 'authenticated'}`-Block, mit Begründung zu Pitfall 1 und T-06-01.
- `apps/mobile/app/(tabs)/mehr.tsx` **neu** — Konto-Sektion, eine tappbare Profil-Zeile (`minHeight: layout.hitMin`) → `router.push('/profil')`.
- `apps/mobile/app/(tabs)/friends.tsx` **neu** — Anfragen-Sektion mit eigener Leerzustands-Copy, kein Netzwerkaufruf, kein Festival-State.
- `apps/mobile/app/profil.tsx` **neu** — Root-Level-Push-Screen mit `useQuery(['me'])`, Loading/Error+Retry/Populated, `AvatarTile` + MMKV-Avatar, Identitätszeilen und Konto-E-Mail.

## Decisions Made

- **`Menu` statt `UserRound` für den Mehr-Tab** (RESEARCH Open Question 2, vom Plan an den Executor delegiert). `UserRound` bleibt damit für Avatar-/Profilkontexte frei — es kennzeichnet innerhalb von Mehr die Konto-Zeile, die zum Profil führt. Ein geteiltes Glyph hätte Tab und Zielzeile visuell verschmelzen lassen.
- **Anzeigename auf `title2`, kein neues `title1`-Token.** Vom Plan so vorgegeben und hier umgesetzt: der ui-checker hatte die Herleitung des neuen Tokens als inkonsistent markiert, `packages/ui/src/tokens.ts` liegt in der Admin-Kollisionszone, und der Kopplungs-Guard in `lib/__tests__/type-tracking.test.ts` hätte für eine einzige Verwendungsstelle mit geändert werden müssen. Jede `title2`-Größenverwendung setzt entsprechend auch `letterSpacing` — das Gate ist grün.
- **Kein `requirements mark-complete` in diesem Plan.** HOME-03, PROF-01 und FRND-01 stehen in der Frontmatter, werden aber von 06-05 bis 06-09 weitergebaut (fünf weitere Friends-Blöcke, vier weitere Mehr-Sektionen, Sunset-Ring/Meta-Zeile/Ausblick-Blöcke, DE-Katalog). Sie jetzt abzuhaken hätte ein falsches „fertig" an den Audit-Scanner gemeldet; `requirements-completed` ist deshalb leer.
- **Die drei probe-erhobenen Planner-Annahmen bleiben unresolved-sichtbar.** Der Plan hat HOME-03/PROF-01/FRND-01 ausdrücklich NICHT als Backstop-Truths authored; dieser Plan ändert daran nichts und erfindet keine Auflösung.

## Deviations from Plan

Zwei Abweichungen, beide vor der Umsetzung sichtbar gemacht und im Checkpoint vom User **ausdrücklich abgenommen**.

### Auto-fixed Issues

**1. [Rule 2 - Projektkonvention] Quellsprachen-Strings bleiben Englisch statt Deutsch**
- **Found during:** Task 1 (alle sechs Dateien)
- **Issue:** Der Plan schreibt wörtlich ``t`Mehr` `` bzw. ``t`Profil` ``. `apps/mobile/lingui.config.ts` setzt aber `sourceLocale: 'en'`, und der gesamte Bestand nutzt englische msgids (``t`Festivals` ``, `<Trans>Loading festivals…</Trans>`). Deutsche msgids hätten die Katalogbasis gespalten und für EN-Nutzer deutschen Text erzeugt.
- **Fix:** Alle neuen Strings als englische Quellstrings (``t`More` ``, ``t`Profile` ``, ``t`Friends` ``, `<Trans>Account</Trans>`, `<Trans>Requests</Trans>`, die Anfragen-Leerzustands-Copy, `<Trans>Loading profile…</Trans>`). Die deutschen Designtexte sind die DE-Katalogwerte und werden von Plan **06-09** eingetragen — diese Pläne fassen `messages.po` bewusst nicht an (Pitfall 5). **Bis 06-09 zeigt die App diese neuen Strings auf Englisch.**
- **Files modified:** alle sechs Dateien des Plans
- **Verification:** `pnpm --filter @quiks/mobile lint` grün (die `no-literal-string`-Regel greift für `app/`, `lib/`, `components/`); Geräteabnahme durch den User bestätigt.
- **Committed in:** `b8182d9`

**2. [Rule 3 - Blocking] Header/Titel des Profil-Screens setzt der Screen, nicht das Root-Layout**
- **Found during:** Task 1, Schritt 3
- **Issue:** Der Plan verlangt ``<Stack.Screen name="profil" options={{ headerShown: true, title: t`Profil` }} />`` in `app/_layout.tsx`. Dort ist `useLingui()` nicht aufrufbar: genau diese Komponente rendert `<I18nProvider>`, der Hook läge also oberhalb seines eigenen Providers und würde werfen. Ein Ausweichen über die `Stack`-Kinder scheidet aus — Expo Router liest die `Stack.Screen`-Kinder strukturell aus, sie dürfen nicht in eine eigene Komponente gekapselt werden.
- **Fix:** `app/_layout.tsx` registriert `<Stack.Screen name="profil" />` (die für Pitfall 1 load-bearing Zeile, unverändert im authentifizierten Block); `app/profil.tsx` setzt ``<Stack.Screen options={{ headerShown: true, title: t`Profile` }} />`` in seinem eigenen Render — exakt das Muster, das `festivals.tsx`, `welcome.tsx`, `email.tsx`, `verify.tsx` und `complete-profile.tsx` bereits verwenden.
- **Files modified:** `apps/mobile/app/_layout.tsx`, `apps/mobile/app/profil.tsx`
- **Verification:** `typecheck` grün; nativer Header „Profil" mit Zurück-Chevron am Gerät bestätigt (Checkpoint-Schritt 5/7).
- **Committed in:** `b8182d9`

---

**Total deviations:** 2 auto-fixed (1 Projektkonvention/Rule 2, 1 blockierend/Rule 3)
**Impact on plan:** Beide betreffen die Umsetzungsform, nicht den Umfang. Kein Akzeptanzkriterium und keine `must_haves`-Zeile ist dadurch verletzt — insbesondere steht `name="profil"` weiterhin im authentifizierten `Stack.Protected`-Block. Kein Scope Creep.

## Issues Encountered

- **`typedRoutes` blockierte den Typecheck.** `router.push('/profil')` schlug fehl, weil `apps/mobile/.expo/types/router.d.ts` (generiert, gitignored) die drei neuen Routen noch nicht kannte. Gelöst durch einen kurzen `npx expo start`-Lauf aus `apps/mobile`, der die Typen neu erzeugt; danach war der Typecheck grün. Es gibt für diesen Schritt keinen Standalone-Befehl — die Datei entsteht beim Start des Dev-Servers.
- **Portkollision beim Aufräumen.** Ein erster, im Hintergrund gestarteter Metro belegte den Port weiter und ließ einen zweiten Start mit `EADDRINUSE` scheitern. Beide Instanzen wurden nach der Typgenerierung beendet; **Port 8081 ist wieder frei für die Dev-API** (`EXPO_PUBLIC_API_URL=http://192.168.8.138:8081`), es läuft kein verwaister Watcher mehr.
- **Verifikationsgrenze, ehrlich benannt.** Die Vitest-Suite (14 Dateien, 148 Tests) beweist Routenerreichbarkeit und Tab-Rendering nicht — sie ist node-env. Task 2 war deshalb ein blockierender Checkpoint. **Die Abnahme aller acht Schritte ist eine menschliche Geräteabnahme („approved", 2026-08-11), keine automatisierte Prüfung.** Der Executor hat den Gerätetest nicht selbst gefahren und keine Einzelbefunde je Schritt erhalten — dieselbe Protokolllage wie bei 05.1-07.

## User Setup Required

Keine — keine neue Abhängigkeit, kein natives Modul, keine Umgebungsvariable. Ein APK-Neubau ist nicht nötig; ein Metro-Start mit geleertem Cache reicht, weil sich die Routentabelle geändert hat.

## Next Phase Readiness

**Freigegeben für Wave 2/3.** Der Tracer hat die Annahme bewiesen, auf der alle Folgepläne stehen: die Route unter Mehr ist erreichbar und der Root-Push-Screen versteckt die Tab-Leiste von selbst.

- `06-04` (ListRow, SettingsSwitch, SoonToast) kann starten — es hängt nur an `06-01` und an `app/_layout.tsx`, das hier bereits angefasst wurde. Die Provider-Montage des `ToastProvider` liegt in derselben Datei; sie ist konfliktfrei, weil dieser Plan dort nur eine `Stack.Screen`-Zeile ergänzt hat.
- `06-05` (restliche Mehr-Sektionen, Logout-Umzug), `06-06` (fünf weitere Friends-Blöcke) und `06-07` (Sunset-Ring, Identitäts-/Meta-Zeile, Ausblick-Blöcke) bauen additiv auf die drei Screens — an keinem ist eine Architekturänderung nötig.
- **Offene Punkte, die aus diesem Plan mitgehen:** die neuen Strings sind bis `06-09` englisch; `requirements-completed` ist bewusst leer; und die Mehr-/Profil-Zeilen sind noch inline gebaut und werden von `06-04`/`06-05`/`06-07` auf die geteilte `ListRow` umgestellt.

## Self-Check: PASSED

- `apps/mobile/app/profil.tsx` — vorhanden
- `apps/mobile/app/(tabs)/mehr.tsx` — vorhanden
- `apps/mobile/app/(tabs)/friends.tsx` — vorhanden
- Commit `b8182d9` — in der Historie vorhanden
- Alle 11 Akzeptanz-Greps des Plans erfüllt; `typecheck` / `lint` / `test` (14 Dateien, 148 Tests) grün

---
*Phase: 06-profile-friends-placeholders*
*Completed: 2026-08-11*
