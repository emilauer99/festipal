---
phase: quick-260811-jz6
plan: 01
subsystem: mobile-ui
tags: [ci-v1, typography, guard-test, docs-correction]
status: complete
requires:
  - "packages/ui/src/tokens.ts typeRoles (unverändert übernommen)"
provides:
  - "Angewandtes CI-Outfit-Tracking an 13 Style-Sites in apps/mobile"
  - "Automatisierter Guard gegen die Rückfall-Art 'Token da, niemand liest ihn'"
  - "CLAUDE.md auf dem nach Phase 05.1 gelieferten Light-Mode-Stand"
affects:
  - ".planning/phases/05.1-quiks-rename-ci-v1-0-rollout/05.1-VERIFICATION.md (Truth 16 + 17)"
tech-stack:
  added: []
  patterns:
    - "Guard per Quelltext-Scan: Token-Nutzung wird gezählt statt sichtgeprüft"
    - "Lokale ambiente Node-Builtin-Deklarationen statt @types/node in einer RN-App"
key-files:
  created:
    - apps/mobile/lib/__tests__/type-tracking.test.ts
    - apps/mobile/lib/__tests__/node-builtins.d.ts
  modified:
    - apps/mobile/app/_layout.tsx
    - apps/mobile/app/(auth)/welcome.tsx
    - apps/mobile/app/(auth)/email.tsx
    - apps/mobile/app/(auth)/verify.tsx
    - apps/mobile/app/(profile-setup)/complete-profile.tsx
    - apps/mobile/app/(tabs)/home.tsx
    - apps/mobile/app/(tabs)/festivals.tsx
    - apps/mobile/app/(festival)/f/[festivalSlug].tsx
    - apps/mobile/components/FestivalCard.tsx
    - apps/mobile/components/AvatarTile.tsx
    - CLAUDE.md
    - .planning/WINDOWS.md
decisions:
  - "Kein @types/node in apps/mobile — die Node-Builtins des Guards werden lokal deklariert"
  - "Pre-existierende Prettier-Drift in berührten Dateien NICHT mitformatiert (Scope-Grenze)"
metrics:
  duration: ~35 min
  completed: 2026-08-11
actuals:
  tokens: 41000
  tasks: 3
  commits: 2
---

# Quick Task 260811-jz6: Phase-05.1-Verifikations-Gaps schließen — Summary

Das CI-Outfit-Tracking wird jetzt an allen 13 Style-Sites tatsächlich gerendert statt nur als
Token zu existieren, abgesichert durch einen Quelltext-Scan, der genau diese Rückfall-Art rot
macht — und `CLAUDE.md` beschreibt nicht länger einen Light-Mode-Zustand, den Phase 05.1
widerlegt hat.

## Was gebaut wurde

**Gap 1 — Tracking (Commit `8202efd`).** `typeRoles.<rolle>.letterSpacing` hatte drei korrekte
Werte und null Leser. Jetzt liest jede der 13 Style-Sites das Tracking aus derselben Rolle, aus
der schon die `fontSize` kommt, direkt unter der Größenzeile:

| Datei | Style(s) | Rolle |
|-------|----------|-------|
| `app/_layout.tsx` | `wordmark` | wordmark |
| `app/(auth)/welcome.tsx` | `wordmark`, `tagline` | wordmark, title2 |
| `app/(auth)/email.tsx` | `heading` | display2 |
| `app/(auth)/verify.tsx` | `heading` | display2 |
| `app/(profile-setup)/complete-profile.tsx` | `heading` | display2 |
| `app/(tabs)/home.tsx` | `sectionHead`, `heading` | title2 |
| `app/(tabs)/festivals.tsx` | `heading` | title2 |
| `app/(festival)/f/[festivalSlug].tsx` | `heading`, `name` | title2, display2 |
| `components/FestivalCard.tsx` | `nameHero` | title2 |
| `components/AvatarTile.tsx` | `initialsText` | title2 |

`packages/ui/src/tokens.ts` und `apps/mobile/lib/wordmark-glyph.ts` sind unverändert — die Werte
stimmten bereits, ihnen fehlte nur der Leser (`git diff` zeigt beide Dateien nicht).

**Der Guard** (`apps/mobile/lib/__tests__/type-tracking.test.ts`, 8 Tests) arbeitet auf drei
Ebenen: Token-Korridor (negativ, Betrag 2–4 % der Rollengröße), Kopplung der überwachten
Rollenliste an die Menge der Rollen mit `letterSpacing`-Token, und der eigentliche
Regressions-Scan über `apps/mobile/app` + `components` — pro Datei und Rolle muss die Anzahl der
Größen-Zuweisungen der Anzahl der Tracking-Zuweisungen entsprechen, und pro Rolle muss mindestens
eine Größen-Zuweisung gefunden werden (sonst liefe der Guard leer durch, falls das Zugriffsmuster
umbenannt wird).

**Gap 2 — Doku (Commit `e28d150`).** Der falsifizierte Satz in `CLAUDE.md` ist durch den
gelieferten Zustand ersetzt (`apps/mobile/lib/theme.ts` löst das Geräteschema auf, nur exakt
`dark` liefert das Nachtschicht-Set). Ergänzt: die Tracking-Regel, die der neue Guard erzwingt.
`.claude/CLAUDE.md` ist unangetastet.

## Gegenprobe: der Guard wurde beim Scheitern beobachtet

Nicht behauptet, sondern ausgeführt. `letterSpacing` aus `components/AvatarTile.tsx` entfernt,
Suite gelaufen:

```
FAIL  lib/__tests__/type-tracking.test.ts > ... > sets title2 tracking in every file that sets title2 size
+   "components\\AvatarTile.tsx: 1 title2 size use(s) vs 0 tracking use(s)"
Tests  1 failed | 147 passed (148)
```

Genau ein Test rot, mit Dateipfad und Rollenname in der Meldung; danach wiederhergestellt,
148/148 grün. Zusätzlich war der erste Lauf des Tests VOR den Consumer-Änderungen rot mit allen
12 betroffenen Dateien (13 Sites, 0 Tracking) — der RED-Zustand ist also an beiden Enden belegt.

## Abweichungen vom Plan

### Rule 3 — Blockierendes Problem: apps/mobile kennt keine Node-Typen

**Gefunden in:** Task 1, nach dem GREEN-Lauf.
**Problem:** `pnpm --filter @quiks/mobile typecheck` brach mit 3× TS2591 ab — `apps/mobile`
setzt bewusst `"types": ["react"]`, der Guard braucht aber `node:fs`/`node:path`/`node:url`.

**Zwei Wege geprüft, beide gemessen statt geschätzt:**

1. `@types/node` als devDependency + `"types": ["react", "node"]`. Der Typecheck lief damit sauber
   durch — aber `pnpm install` brach mit dem bekannten Windows-`_tmp_`-ENOENT ab UND erzeugte
   Kollateral-Churn im Lockfile: 190 Pakete neu verlinkt, der `zod`-Peer von `better-call` kippte
   zwischen Root- und Mobile-Importer, `expo-router` bekam einen neuen Peer-Hash. Gegenprobe
   `pnpm install --lockfile-only` OHNE meine Änderung: null Churn — die Kaskade kam also
   nachweislich von der neuen Abhängigkeit, nicht von vorbestehender Drift. Das hätte das
   `--frozen-lockfile`-Gate der Phase gefährdet. Vollständig zurückgerollt (Lockfile per
   `git checkout`, `package.json`/`tsconfig.json` zurückgesetzt, `pnpm install --frozen-lockfile`
   Exit 0).
2. **Gewählt:** `apps/mobile/lib/__tests__/node-builtins.d.ts` deklariert die vier benutzten
   Funktionen lokal. Kein Eingriff in den Dependency-Graph, und — der eigentliche Vorteil — Nodes
   Globals bleiben aus dem Scope jedes Screens draußen (mit `@types/node` liefert `setTimeout`
   `NodeJS.Timeout` statt der `number`, die RN tatsächlich zurückgibt).

**Kosten der Entscheidung, offen benannt:** handgeschriebene Typ-Stubs sind Wartungsschuld. Die
Datei nennt im Kopfkommentar den Grund und die Auflösung („wird `@types/node` je sauber ergänzt,
lösche diese Datei").

### Rule 3 — Plan-Kommando falsch: `pnpm lint -- --force`

Der Plan schrieb `pnpm lint -- --force` für die uncached Gates. Das `--` reicht `--force` an
**eslint** durch (`Invalid option '--force'`), nicht an turbo — 4 von 10 Tasks, Exit 2. Korrekt
ist `pnpm exec turbo run <task> --force`; damit gefahren.

## Deferred Issues (nicht von dieser Aufgabe verursacht)

**Prettier-Drift in `apps/mobile`.** `prettier --check` schlägt in 5 Dateien an:
`app/(auth)/email.tsx`, `app/(auth)/verify.tsx`, `app/(profile-setup)/complete-profile.tsx`,
`app/(tabs)/festivals.tsx` und `components/OtpBoxes.tsx`. Es geht ausschließlich um
JSX-Zeilenumbrüche in `<Text>`-Blöcken, offenbar bei einer engeren print-width formatiert. Belege,
dass es vorbestehend ist: `OtpBoxes.tsx` wurde von dieser Aufgabe nie angefasst, und in den vier
berührten Dateien enthält der Prettier-Diff **null** `letterSpacing`-Zeilen. Nicht mitformatiert
(Scope-Grenze — das hätte große, sachfremde Diffs erzeugt). Prettier ist kein Turbo-Gate, die
Gates sind grün. Kandidat für einen eigenen Formatierungs-Commit vor dem PR.

## Bekannte Stubs

Keine.

## Verifikation

| Gate | Ergebnis |
|------|----------|
| `turbo run lint --force` | 10/10 Tasks, 0 cached |
| `turbo run typecheck --force` | 10/10 Tasks, 0 cached |
| `turbo run test --force` | 7/7 Tasks (api 45/45, **mobile 148/148**, i18n 6/6) |
| `pnpm install --frozen-lockfile` | Exit 0, „Already up to date" |
| `prettier --check` auf beiden neuen Dateien | sauber |
| `git diff` tokens.ts / wordmark-glyph.ts / `.claude/CLAUDE.md` / `pnpm-lock.yaml` | leer |
| `CLAUDE.md`: „not wired up" | 0 Treffer; `apps/mobile/lib/theme.ts` 1 Treffer |
| WINDOWS-Ledger | `open_count` 22 → 23, Eintrag 31 `open` |

Mobile-Suite: 140 → 148 Tests (8 neu), keine bestehende Suite verändert.

## TDD-Gate-Compliance

RED wurde beobachtet und ist oben protokolliert (erster Lauf: 3 Tests rot, 13 Sites ohne
Tracking; Gegenprobe: 1 Test rot). RED und GREEN liegen jedoch in **einem** Commit statt in
getrennten `test(...)`/`feat(...)`-Commits — Task 3 des Plans verlangt ausdrücklich „ein oder
zwei Conventional Commits" für die gesamte Aufgabe. Die spezifischere Anweisung gewinnt; ein
absichtlich roter Commit auf einem Branch, der auf einen PR zuläuft, hätte zudem `git bisect`
verschlechtert.

## Was NICHT behauptet wird (D-D)

Diese Aufgabe hat ausschließlich in Node/Vitest verifiziert. Wie sich das engere Tracking auf
echten Screens liest — Umbrüche in Wortmarke/Display/Titel, Kartenhöhen im FestivalCard-Hero, die
Splash-Wortmarke, und ob die zentrierten AvatarTile-Initialen durch das Tracking hinter dem
letzten Zeichen (≈0,26 pt, D-B) sichtbar aus der Mitte laufen — ist eine Geräteaussage und läuft
als **offener** Ledger-Eintrag WINDOWS 31 weiter. Nichts davon ist hier abgehakt.

## Wirkung auf die Phasen-Verifikation

`05.1-VERIFICATION.md` steht auf `gaps_found` (14/16). Truth 16 (Tracking) und Truth 17
(CLAUDE.md) sind jetzt ohne Override erfüllbar; der Datenfluss
`typeRoles.*.letterSpacing` → Consumer wechselt von DISCONNECTED auf FLOWING. Eine
Re-Verifikation der Phase muss das bestätigen — dieses Summary setzt sie nicht selbst um.

## Commits

| Commit | Betreff |
|--------|---------|
| `8202efd` | `fix(mobile): apply CI outfit tracking in every wordmark/display2/title2 style` |
| `e28d150` | `docs: correct the falsified light-mode claim and record the open device look` |

Beide auf `docs/quiks-rebrand-ci`, ohne `Co-Authored-By`-Trailer. Die untrackte Root-`tsconfig.json`
wurde plangemäß nicht angefasst.

## Self-Check: PASSED

Alle vier genannten Dateien existieren auf der Platte, beide Commit-Hashes in `git log`
auffindbar.
