---
phase: 06-profile-friends-placeholders
plan: 09
subsystem: i18n
tags: [lingui, po-catalog, i18n, turborepo, expo, roadmap-reconciliation]

# Dependency graph
requires:
  - phase: 06-profile-friends-placeholders
    provides: "Pläne 06-01 bis 06-08 — die vier Tabs, der Mehr-Screen, der Friends-Screen, der Profil-Screen und die optionalen Identitätsfelder; alle haben ihre Strings bewusst unübersetzt gelassen"
  - phase: 03-mobile-app-shell-i18n-foundation
    provides: "Lingui-Setup, lingui.config.ts mit sourceLocale en, extract/compile-Skripte, no-literal-string-Lintregel"
provides:
  - "Vollständiger deutscher Lingui-Katalog: 80 neue Meldungen der Phase 6 übersetzt, 0 missing"
  - "Vollständiger englischer Quellkatalog (auto-gefüllt aus den msgids)"
  - "Uncached grünes Monorepo-Gate über Lint, Typecheck, Test und Mobile-Bündelung"
  - "Abgeglichene ROADMAP-Erfolgskriterien der Phase 6 gegen D-01 und D-10"
  - "Geräteabnahme der Phase 6 vom User pauschal freigegeben; WINDOWS 38 geschlossen, 33/34/35 gewaived"
affects: [07-content-screens, ui-review, verify-work, ship]

actuals:
  tokens: 11282
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Katalogpflege gebündelt in EINEM Plan der letzten Welle — die .po-Dateien sind geteilter, nicht partitionierbarer Zustand"
    - "Markenwort-Regel im Katalog: 'Friends' bleibt in DE unübersetzt, während Fließtext weiterhin 'Freunde' sagt"

key-files:
  created: []
  modified:
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po
    - .planning/workstreams/mobile/ROADMAP.md
    - .planning/WINDOWS.md
    - .planning/workstreams/mobile/STATE.md

key-decisions:
  - "06-09: 'Friends' ist im DE-Katalog jetzt das unübersetzte Markenwort (vorher 'Freunde'); in Fließtext-Sätzen bleibt es beim deutschen 'Freunde', genau wie im Design — vom User im Checkpoint mitfreigegeben"
  - "06-09: Die SafeNow-Überschrift 'Stay safe' bleibt auch in DE englisch, weil das Design sie in seiner deutschen Fassung englisch führt — vom User im Checkpoint mitfreigegeben"
  - "06-09: 'Friend requests' wurde als 'Freundschaftsanfragen' übersetzt statt als Marken-Mischform — das Design nutzt 'Friends' nur als Feature-/Tab-Nomen, im Fließtext dagegen 'Freunde'"
  - "06-09: Die überholten Erfolgskriterien SC-1 und SC-3 wurden INLINE durchgestrichen und mit dem ablösenden Entscheid annotiert statt gelöscht — ein späterer Verifikationslauf sieht damit beides"
  - "06-09: WINDOWS 33/34/35 wurden GEWAIVED, nicht als fixed markiert — nur 'waive' trägt eine Begründung, und die Schließung ruht auf einer Pauschalabnahme ohne Einzelbefunde"

patterns-established:
  - "Pauschale Geräteabnahmen werden als solche protokolliert: keine Einzelbefunde erfinden, den nicht selbst gefahrenen Test nicht als eigene Verifikation ausgeben"

requirements-completed: [HOME-03, PROF-01, FRND-01]

coverage:
  - id: D1
    description: "Beide Lingui-Kataloge enthalten alle 80 neuen Meldungen der Phase 6; keine Meldung bleibt ohne Übersetzungswert"
    requirement: "HOME-03"
    verification:
      - kind: other
        ref: "pnpm --filter @quiks/mobile extract (de: 0 missing) && pnpm --filter @quiks/mobile compile (--strict)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Der SafeNow-Distanzierungssatz existiert vollständig und ungekürzt in beiden Katalogen"
    verification:
      - kind: other
        ref: "grep -ci 'SafeNow' apps/mobile/locales/{de,en}/messages.po -> 4 / 4"
        status: pass
    human_judgment: false
  - id: D3
    description: "Kein nutzergenerierter Inhalt (Anzeigename, Benutzername, Handle) steht als übersetzbare Meldung im Katalog"
    verification:
      - kind: other
        ref: "grep -in 'feli|Feli Auer|feli.quiks|feli@quiks|Festival-Mix 2026' über beide .po -> 0 Treffer"
        status: pass
    human_judgment: false
  - id: D4
    description: "Das gesamte Monorepo besteht Lint, Typecheck und Testsuite in einem erzwungenen, uncached Durchlauf; die Mobile-App bündelt für iOS und Android"
    verification:
      - kind: integration
        ref: "pnpm install --frozen-lockfile && pnpm lint --force (10/10, 0 cached) && pnpm typecheck --force (10/10, 0 cached) && pnpm test --force (7/7, 0 cached; api 49/49, mobile 188/188) && pnpm --filter @quiks/mobile build"
        status: pass
    human_judgment: false
  - id: D5
    description: "Die überholten ROADMAP-Erfolgskriterien SC-1 und SC-3 sind sichtbar gegen D-01 und D-10 abgeglichen"
    requirement: "FRND-01"
    verification:
      - kind: other
        ref: "grep -c 'D-01' / 'D-10' .planning/workstreams/mobile/ROADMAP.md -> 6 / 3; git diff --stat bleibt im Umfang des Phase-6-Abschnitts (8 Zeilen)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Geräteabnahme der gesamten Phase 6 über 18 Punkte: Navigation, Friends-Leerzustände, Mehr inkl. persistiertem Dark-Mode, Profil mit Sunset-Ring und Identitätszeile, die drei neuen optionalen Felder, Sprachdurchlauf auf Englisch"
    requirement: "PROF-01"
    verification: []
    human_judgment: true
    rationale: "Der apps/mobile-Vitest-Runner ist node-env und rendert keine React-Native-Komponenten; Navigation, natives Verhalten (Force-Quit-Persistenz, Date-Picker, Alert) und rein visuelle Zustände sind für ihn strukturell unsichtbar. Der User hat am Gerät abgenommen — pauschal mit 'approved', OHNE Einzelbefunde je Punkt. Der Executor hat den Test nicht selbst gefahren."

duration: ~35min
completed: 2026-08-12
status: complete
---

# Phase 6 Plan 09: Kataloge, uncached Gate und Phasenabschluss — Summary

**80 neue Phase-6-Meldungen in beiden Lingui-Katalogen übersetzt und strikt kompiliert, ein erzwungen uncached grünes Monorepo-Gate gefahren, die zwei durch D-01/D-10 überholten ROADMAP-Erfolgskriterien inline abgeglichen und die 18-Punkte-Geräteabnahme der Phase abgenommen.**

## Performance

- **Duration:** ~35 min reine Ausführung (dazu die Wartezeit am blockierenden Geräte-Checkpoint)
- **Started:** 2026-08-12T00:06:21Z
- **Completed:** 2026-08-12T09:29:00Z
- **Tasks:** 3
- **Files modified:** 5 (+ diese SUMMARY, + 2 bislang untracked GSD-Artefakte)

## Accomplishments

- **Beide Kataloge vollständig.** `lingui extract` sammelte 80 neue msgids aus `friends.tsx`, `mehr.tsx`, `profil.tsx`, `complete-profile.tsx`, `_layout.tsx` und `FloatingNav.tsx`. Alle in DE gefüllt; EN ist Quell-Locale und füllt sich aus den msgids selbst. Nachlauf: **de 0 missing**, `lingui compile --strict` fehlerfrei, `eslint .` sauber. Beide Dateien: 149 aktive Meldungen, 20 obsolete, 0 leere Übersetzungswerte.
- **Der SafeNow-Distanzierungssatz steht ungekürzt** in beiden Sprachen: *„Wir stehen in keiner Verbindung zu SafeNow — finden die App aber richtig gut. Nutz sie am Gelände."* / *„We have no connection to SafeNow — we just think the app is genuinely good. Use it on-site."*
- **Uncached Phasen-Gate grün.** Frozen Install ohne Drift; `lint --force` 10/10, `typecheck --force` 10/10, `test --force` 7/7 (api 49/49, mobile 188/188) — jeweils **0 cached**, kein einziger Cache-Treffer. `expo export` erzeugte iOS- und Android-Bundle, was zumindest die JS-Auflösbarkeit des in 06-08 dazugekommenen nativen Moduls belegt.
- **ROADMAP abgeglichen.** SC-1 und SC-3 tragen jetzt inline den ablösenden Entscheid (D-01 bzw. D-10), der alte Wortlaut steht durchgestrichen daneben.
- **Geräteabnahme abgenommen** und die davon abgedeckten Ledger-Einträge geschlossen.

## Task Commits

1. **Task 1: Alle neuen Strings extrahieren, in beiden Sprachen übersetzen und strikt kompilieren** — `2b7bf8c` (feat)
2. **Task 2: Uncached Phasen-Gate über das Monorepo und Abgleich der überholten ROADMAP-Formulierungen** — `4840ac2` (docs)
3. **Task 3: Geräteabnahme der gesamten Phase — Abschluss im Ledger** — `540dbd8` (docs)

**Plan metadata:** siehe Abschluss-Commit dieses Plans (docs: complete plan)

## Files Created/Modified

- `apps/mobile/locales/de/messages.po` — 80 neue deutsche Übersetzungen; `Friends` von „Freunde" auf das Markenwort „Friends" umgestellt
- `apps/mobile/locales/en/messages.po` — Quellkatalog, 80 neue Einträge automatisch aus den msgids gefüllt
- `.planning/workstreams/mobile/ROADMAP.md` — SC-1/SC-3 annotiert, Planliste und Zählstand der Phase 6 fortgeschrieben
- `.planning/WINDOWS.md` — Eintrag 38 angelegt und geschlossen; 33/34/35 gewaived
- `.planning/workstreams/mobile/STATE.md` — offene Frage zur Tab-Umbenennung, Position, Metriken, Entscheidungen

## Decisions Made

- **„Friends" ist im DE-Katalog jetzt das unübersetzte Markenwort.** Der Wert stand seit Phase 5 auf „Freunde"; Design und UI-SPEC führen den Tab, die Meta-Zeile und die Stat-Kachel durchgängig als „Friends". In Fließtext-Sätzen („Sobald du erste Freunde hast …", „Nur am Gelände, nur mit Freunden.") bleibt es beim deutschen Wort — genau die Aufteilung, die das Design selbst macht. **Vom User im Checkpoint mitfreigegeben.**
- **„Stay safe" bleibt auch in DE englisch.** Die SafeNow-Karte trägt diese Überschrift im Design auch in der deutschen Fassung englisch (`quiks-screens.template.html` Z. 1516). **Vom User im Checkpoint mitfreigegeben.**
- **„Friend requests" → „Freundschaftsanfragen".** Eine Mischform wie „Friend-Anfragen" wurde verworfen: die Markenwort-Regel greift beim Nomen „Friends", nicht in jeder Wortzusammensetzung.
- **SC-1/SC-3 wurden durchgestrichen statt gelöscht.** Ein späterer Verifikationslauf sieht so beides — den überholten Wortlaut und den Entscheid, der ihn ablöst.
- **WINDOWS 33/34/35 wurden gewaived, nicht als fixed markiert.** `gsd-tools windows fixed` nimmt keine Begründung entgegen, `waive` schon. Weil die Schließung dieser drei auf einer Pauschalabnahme ohne Einzelbefunde ruht, gehört genau das in die Begründungsspalte — als „fixed" hätte es wie itemisierte Evidenz ausgesehen.

## Deviations from Plan

### 1. [Rule 3 — Blockierend] Der Plan setzte deutsche msgids voraus; die Quellsprache ist Englisch

- **Gefunden bei:** Task 1
- **Sachlage:** Der Plan spricht vom „Füllen beider Sprachen". `lingui.config.ts` hat aber `sourceLocale: 'en'` (Entscheid aus 06-01, vom User im dortigen Checkpoint abgenommen), also sind die msgids englisch und der EN-Katalog füllt sich beim Extrahieren selbst.
- **Vorgehen:** Nur der DE-Katalog wurde inhaltlich befüllt (80 Werte); EN wurde über die Extraktion vollständig und ist als Quell-Locale per Definition ohne Lücke. Die Akzeptanzkriterien („kein leerer Übersetzungswert", „gleiche Schlüsselmenge") sind für beide Dateien belegt.
- **Committet in:** `2b7bf8c`

### 2. [Rule 3 — Blockierend] Die geforderte Katalogpflege ließ sich nicht als 80 Einzeledits fahren

- **Gefunden bei:** Task 1
- **Sachlage:** 80 Werte per Hand-Edit in eine .po-Datei zu schreiben ist fehleranfällig und nicht prüfbar.
- **Vorgehen:** Ein Einweg-Skript im Scratchpad (nicht im Repo) setzte die msgstr-Zeilen deterministisch anhand der msgids; danach `extract` + `compile --strict` als eigentliches Gate. Das Skript liegt außerhalb des Projekts und wurde nicht committet.
- **Committet in:** `2b7bf8c`

### 3. [Kein Rule-Fall — Doppelung vermieden] Der T-06-06-Blocker stand bereits in STATE.md

- **Gefunden bei:** Task 2
- **Sachlage:** Der Plan verlangt, den in 06-02 bewusst getragenen Punkt zur getrennten Profilprojektion unter Blockern zu vermerken. Er stand dort seit 06-02 bereits wortgleich.
- **Vorgehen:** Nicht dupliziert. Nur der zweite, tatsächlich fehlende Punkt — die offene Frage zur Tab-Umbenennung „Home" → „Start" — wurde ergänzt.
- **Committet in:** `4840ac2`

### 4. [Kein Rule-Fall — Abweichung sichtbar gemacht] Die ROADMAP trug bereits einen Reconciliation-Absatz

- **Gefunden bei:** Task 2
- **Sachlage:** Unter „Notes" stand seit der Planung ein Absatz, der D-01 und D-10 benennt. Die Erfolgskriterien SELBST trugen aber weiter den überholten Wortlaut — genau das, was der Plan abstellen wollte.
- **Vorgehen:** Der Absatz blieb unangetastet; SC-1 und SC-3 wurden zusätzlich inline annotiert. Die Änderung bleibt mit 8 Zeilen im Umfang des Phase-6-Abschnitts.
- **Committet in:** `4840ac2`

---

**Total deviations:** 2 auto-fixed (beide Rule 3, blockierend), 2 dokumentierte Abweichungen ohne Codewirkung
**Impact on plan:** Kein Scope-Zuwachs. Abweichung 1 ist die Fortschreibung eines bereits vom User abgenommenen Entscheids aus 06-01, Abweichung 2 reine Ausführungsmechanik.

## Issues Encountered

- **Keine.** Weder Lint noch Typecheck noch Tests schlugen an; es gab keine Acceptance-Grep-Fehlalarme in dieser Runde (die Warnung aus 06-02/06-06/06-08 kam nicht zum Tragen, weil dieser Plan keine „darf-nicht-vorkommen"-Greps über Quelldateien fährt).

## Geräteabnahme — ehrlicher Stand

**Der Executor hat den Gerätetest NICHT selbst gefahren.** Die 18 Punkte wurden dem User als blockierender Checkpoint vorgelegt; die Antwort lautete exakt **„approved"** — eine **pauschale Freigabe aller 18 Punkte als Ganzes, ohne Einzelbefunde je Schrittnummer**. Es liegt damit **keine punktweise Evidenz** vor, sondern eine menschliche Gesamtabnahme am Gerät. Gleiche Lage wie bei 05.1-07 und 06-01.

Mit derselben Pauschalabnahme freigegeben wurden auch die beiden zur Mitprüfung vorgelegten Übersetzungsentscheide („Friends" als Markenwort, „Stay safe" englisch).

Ledger-Wirkung:

| Eintrag | Vorher | Jetzt | Grundlage |
|---|---|---|---|
| 38 (18-Punkte-Abnahme dieser Phase) | open | **fixed** | die Abnahme selbst; die Schließbedingung des Eintrags ist wörtlich erfüllt |
| 33 (MMKV-Rundlauf des Theme-Overrides) | open | **waived** | Punkt 7 der Abnahme (Force-Quit-Persistenz des Dunkelmodus) |
| 34 (native Picker-Darstellung) | open | **waived** | Punkte 15–17 |
| 35 (`toLocalDateOnly()` ohne Unit-Test) | open | **waived** | Punkte 15–17 |
| 32 (T-06-06, Profilprojektion ohne Sichtbarkeits-Policy) | open | **bleibt open** | von der Abnahme nicht berührt; hängt an IDN-02 / Birgits Konzept |
| 36, 37 (bewusste Platzhalter in Friends und Profil) | open | **bleiben open** | absichtsvolle Stubs, aufgelöst durch FRND-02 / PROF-02 |

Die Begründungsspalte von 33/34/35 hält fest, dass die Schließung auf einer Pauschalabnahme ruht und nicht auf itemisierter Evidenz.

## Known Stubs

Keine neuen. Dieser Plan hat keinen Code angefasst — die Platzhalter der Phase sind als WINDOWS 36 und 37 bereits verzeichnet und bleiben offen.

## User Setup Required

Keine — keine externe Dienstkonfiguration nötig.

## Next Phase Readiness

**Bereit.** Alle neun Pläne der Phase 6 sind ausgeführt, das Monorepo-Gate ist uncached grün, die Kataloge sind vollständig und die Geräteabnahme liegt vor. Offen und bewusst weitergetragen:

- **T-06-06 / WINDOWS 32 (offen, wichtig):** `visitorProfilePublicSchema` trägt `birthDate` und `gender` ohne jede Sichtbarkeits-Policy. Heute eigentümergebunden und damit unkritisch — **bevor der erste Endpunkt ein FREMDES Profil ausliefert** (FRND-02 / PROF-02), muss die Projektion in eine Eigentümer-Sicht und eine Freundes-Sicht getrennt werden.
- **Offene Frage für den Phasenübergang:** Der erste Tab heißt in der App weiterhin `Home` (DE-Katalogwert „Start"), das neue Design nennt ihn „Start". Die Umbenennung war ausdrücklich nicht beauftragt.
- **WINDOWS 36/37:** die bewussten Platzhalter in Friends und Profil bleiben offen bis FRND-02 bzw. PROF-02.
- **Hinweis zum Bauen:** Vor jedem weiteren Gerätetest gilt weiterhin `cd apps/mobile && npx expo run:android` — seit 06-08 hängt natives Modul-Code am Build (`@react-native-community/datetimepicker`).
- **Nicht von diesem Plan verursacht, jetzt mit eingecheckt:** `.planning/workstreams/mobile/config.json` und `.planning/workstreams/mobile/.verification-ledger.json` lagen untracked im Baum. Es sind GSD-Artefakte des Workstreams (Verifikationshistorie der Phasen 01–05.1) und gehören ins Repo — sie wandern in den Abschluss-Commit dieses Plans.

## Self-Check: PASSED

- `apps/mobile/locales/de/messages.po` — vorhanden
- `apps/mobile/locales/en/messages.po` — vorhanden
- `.planning/workstreams/mobile/phases/06-profile-friends-placeholders/06-09-SUMMARY.md` — vorhanden
- Commits `2b7bf8c`, `4840ac2`, `540dbd8` — alle in der Historie auffindbar

---
*Phase: 06-profile-friends-placeholders*
*Completed: 2026-08-12*
