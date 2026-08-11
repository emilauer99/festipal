# quiks — Git-Konventionen

> Verbindliche Regeln für Branching, Commits und Merges. Ziel: eine **lineare,
> lesbare, automatisierbar auswertbare** Historie. Diese Regeln gelten für Menschen
> **und** für Claude Code. Stand: 2026-07-28.

---

## 1. Grundmodell — Trunk-Based Development

- **`main` ist immer deploybar.** Lint, Typecheck und Tests sind auf `main` stets grün.
- **Nie direkt auf `main` committen** — jede Änderung läuft über einen kurzlebigen
  Feature-Branch und einen Pull Request.
- **Branches sind kurzlebig** (Stunden bis wenige Tage). Kleine, fokussierte PRs statt
  wochenlanger Monster-Branches. Lieber zweimal mergen als einen Riesen-PR.
- Kein `develop`-Branch, keine Git-Flow-Release-Branches. Nur `main` + Feature-Branches.

---

## 2. Branch-Namen

Schema: **`<type>/<kurz-beschreibung-in-kebab-case>`**

```
feat/swap-marketplace-listing
fix/timetable-timezone-offset
chore/repo-setup
docs/git-conventions
refactor/api-tenant-guard
```

- `type` = derselbe Satz wie bei Commits (siehe §3.1).
- Optional mit Scope, wenn es hilft: `feat/mobile/offline-map-cache`.
- Kleinbuchstaben, Bindestriche, keine Umlaute/Leerzeichen. Kurz und sprechend.
- Kein Personen-Präfix (`emil/...`) — der Branch beschreibt die **Arbeit**, nicht die Person.

---

## 3. Commits — Conventional Commits

Format (Spec: <https://www.conventionalcommits.org/>):

```
<type>(<scope>)<!>: <subject>

<body>

<footer>
```

### 3.1 Erlaubte Types

| Type | Wofür |
|---|---|
| `feat` | neues fachliches Feature |
| `fix` | Bugfix |
| `docs` | nur Dokumentation |
| `refactor` | Code-Umbau ohne Verhaltensänderung |
| `perf` | Performance-Verbesserung |
| `test` | Tests hinzufügen/ändern |
| `build` | Build-System, Dependencies, Tooling-Config |
| `ci` | CI/CD-Pipelines |
| `chore` | Sonstiges ohne Produktions-Code (Repo-Setup, Aufräumen) |
| `revert` | macht einen früheren Commit rückgängig |

### 3.2 Scopes (Monorepo)

Scope = betroffenes Paket/App, damit die Historie pro Bereich filterbar ist:

`mobile` · `admin` · `api` · `contracts` · `db` · `ui` · `config` · `repo` · `docs`

Beispiel: `feat(api): add tenant-scoped booking guard`

### 3.3 Regeln für die Subject-Zeile

- **Imperativ, Präsens, Englisch:** „add", nicht „added"/„adds".
- Kleinbuchstabe am Anfang, **kein** Punkt am Ende.
- Ziel ≤ 50 Zeichen, **hart ≤ 72**.
- Beschreibt **was & warum**, nicht das offensichtliche Wie.

### 3.4 Body & Footer

- **Body** (optional, umbrochen bei ~72 Zeichen) erklärt das **Warum**, wenn nicht offensichtlich.
- **Breaking Change:** `!` nach Type/Scope **und** Footer `BREAKING CHANGE: <erklärung>`.
- **Issues verlinken:** Footer `Closes #123`.

### 3.5 Granularität

- **Ein Commit = eine logische Änderung.** Nicht mehrere Themen bündeln.
- Jeder Commit ist für sich lauffähig (baut & Tests grün) — erleichtert `bisect`/`revert`.
- Formatierungs-/Rename-Rauschen von inhaltlichen Änderungen trennen.

---

## 4. Pull Requests

- **PR-Titel folgt derselben Conventional-Commit-Syntax** wie ein Commit
  (er wird beim Squash-Merge zur Commit-Message — siehe §5).
- **PR-Beschreibung:** Was, Warum, wie getestet; ggf. Screenshots (UI) und verlinkte Issues.
- **Klein halten** — idealerweise < ~400 geänderte Zeilen; sonst aufteilen.
- **Merge erst wenn grün:** Lint, Typecheck, Tests, Build müssen in CI durchlaufen.
- **Review:** Kein verpflichtendes Code-Review. PR dient der grünen CI und einer sauberen,
  squash-baren Historie; nach grünen Checks kann direkt gemergt werden. (Wenn das Team
  später wächst, kann optional ein Approve-Zwang aktiviert werden.)
- **Branch nach Merge löschen** (remote automatisch, lokal `git branch -d`).

---

## 5. Merge-Strategie — Squash & Merge

- **Squash-Merge ist Standard.** Ein PR → genau ein Commit auf `main` → **lineare Historie**.
- Der Squash-Commit trägt den (Conventional-Commit-)PR-Titel als Message.
- **Kein Merge-Commit-Wust**, keine `main`-in-den-Branch-Merges. Feature-Branch bei Bedarf
  per **Rebase** auf `main` aktualisieren, nicht mergen.
- **`main` ist niemals force-gepusht.** Rebase/Force-Push nur auf dem **eigenen** Feature-Branch,
  solange niemand sonst darauf arbeitet.

---

## 6. Automatisierte Durchsetzung (State of the Art)

Sobald das Monorepo scaffolded ist, wird Folgendes verdrahtet — Regeln sollen **erzwungen**,
nicht nur dokumentiert sein:

- **commitlint** (`@commitlint/config-conventional`) — prüft jede Commit-Message.
- **Husky** Git-Hooks:
  - `commit-msg` → commitlint
  - `pre-commit` → **lint-staged** (Prettier + ESLint nur auf geänderte Dateien)
  - `pre-push` → `pnpm typecheck` (+ schnelle Unit-Tests)
- **GitHub Branch Protection** auf `main`: PR erforderlich, Status-Checks (Lint/Typecheck/
  Test/Build) müssen grün sein, lineare Historie erzwungen, keine direkten Pushes.
- **CI (GitHub Actions):** bei jedem PR Lint + Typecheck + Test + Build über Turborepo.

> Bis diese Automatisierung steht, gelten die Regeln oben **manuell** — auch für Claude Code.

---

## 7. Was NICHT ins Repo gehört

- `node_modules/`, Build-Output, Caches — via `.gitignore`.
- **Secrets / `.env`** — niemals committen. Nur `.env.example` mit leeren Platzhaltern.
- Generierte native Ordner (`ios/`, `android/`) — via Expo Prebuild reproduzierbar.
- Persönliche Editor-Configs (`.idea/`, lokale `.vscode`-Einstellungen).
- Große Binärdateien — falls nötig, Git LFS.

---

## 8. Claude-Code-spezifisch

- **Commit/Push nur auf ausdrückliche Aufforderung** des Nutzers.
- **Nie auf `main` committen** — immer erst Feature-Branch nach §2 anlegen.
- Commit-Messages nach diesem Dokument; **kein** `Co-Authored-By`-Trailer.
- **Hooks nie umgehen** (`--no-verify` verboten), außer der Nutzer verlangt es explizit.
- Vor „fertig": Lint, Typecheck und relevante Tests laufen lassen, Fehler ehrlich melden.
