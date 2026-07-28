# festipal — Entwicklungsentscheidungen (ADR)

> Lebendes Dokument. Jede wesentliche technische Entscheidung wird hier mit Status,
> Begründung, Alternativen und Konsequenzen festgehalten. Stand: 2026-07-28.

## Vision & Scope

festipal ist eine Festival-App für das ganze Wochenende: Übersicht, Lageplan,
Timetable, News/Updates und Cashless-Integration — plus zwei Alleinstellungs-Features:
eine **Festival- & Campingplatz-Tauschbörse** und **Aktivitäten / Freunde connecten**.

**Langfristiges Ziel:** *Eine* App für alle künftigen Festivals des Nutzers, sofern das
Festival mit festipal kooperiert. Daraus folgt der wichtigste Architekturtreiber:
**Multi-Tenancy** (ein Festival = ein Mandant) — von Tag 1 eingeplant, nicht nachträglich.

Anspruch: lupenreiner Code, exzellente Architektur, ausschließlich state-of-the-art
Technologien, langfristige Wartbarkeit.

---

## Entscheidungslog

### ADR-001 — Mobile: React Native + Expo · **ENTSCHIEDEN**
**Entscheidung:** Die App wird mit React Native (New Architecture) + Expo + TypeScript
gebaut, Navigation über Expo Router, Auslieferung über EAS (Build/Submit/Update).

**Begründung:**
1. **Whole-Stack-TypeScript-Unifikation** — App teilt sich Types, Validierung (Zod) und
   API-Contracts mit NestJS-Backend *und* Next.js-Admin in einem Monorepo. Eine Sprache,
   eine Wahrheit, durchgehende Typsicherheit App↔Admin↔Backend. Das ist der stärkste
   Hebel für „lupenreine" Architektur.
2. **OTA-Updates (EAS Update)** — first-class, kritisch für den Live-Betrieb am
   Festival-Wochenende (Fixes/Content-Änderungen in Minuten statt App-Store-Review).

**Alternativen:** Flutter (verworfen: bricht die TS-Unifikation auf, OTA nur via
Drittanbieter Shorebird; Flutter-Erfahrung des Nutzers wog leichter als die Stack-Kohärenz).
Native Swift/Kotlin (verworfen: doppelter Aufwand).

**Konsequenzen:** Team/Nutzer muss RN/Expo lernen (Nutzer hat bisher Flutter-Erfahrung).
Für sehr aufwendige Custom-Animationen minimal weniger Reserve als Flutter/Impeller —
für festipals UI (Listen, Karten, Chat, Forms) irrelevant.

### ADR-002 — Backend: NestJS · **ENTSCHIEDEN**
**Entscheidung:** Backend in NestJS (TypeScript). Modulare, DI-basierte Architektur.

**Begründung:** Struktur- und wachstumsstark (Mandanten, Zahlungen, Social, Realtime).
Klare Trennung (Module, Guards, Interceptors, Pipes) passt zum Qualitätsanspruch.
**Alternative:** Hono + tRPC (schlanker) — verworfen zugunsten von Struktur für ein
langfristig wachsendes System.

### ADR-003 — Admin-Web: Next.js 15 + React 19 · **ENTSCHIEDEN**
Festival-Organisatoren pflegen Timetable, News, Lageplan, Vendors, Cashless-Config.
UI: shadcn/ui + Tailwind. Teilt Contracts/Types mit dem Backend.

### ADR-004 — Monorepo: Turborepo + pnpm · **ENTSCHIEDEN**
Geteilte Packages zwischen App, Admin und Backend (siehe Struktur unten).

### ADR-005 — Datenbank: PostgreSQL + Drizzle ORM · **ENTSCHIEDEN**
Managed Postgres bei Neon (siehe ADR-010). Drizzle für typsichere,
migrationsfreundliche Schemata; Schema lebt in `packages/db`.

**Konkrete Neon-Provisionierung (2026-07-28):**
- **Postgres-Version:** 18 (neueste Stable bei Neon). Version ist pro Projekt fix und nur
  per Migration hochziehbar → gleich die aktuellste, dann am längsten Ruhe. Keine
  Extension-Abhängigkeit, die eine ältere Version erzwingen würde.
- **Region:** AWS Europe **Frankfurt (`eu-central-1`)**. Grund: Die DB-Region richtet sich
  nach dem **Backend, das sie abfragt** (App→API→DB; Latenz zählt auf der Strecke API↔DB),
  nicht nach den Endnutzern. Frankfurt liegt nah an der Railway-EU-Region *und* an den
  Festival-Besuchern in AT/DE, und hält die Daten DSGVO-konform in der EU.
- **Neon Auth: NICHT aktiviert.** Auth läuft über better-auth (ADR-009). Zwei parallele
  Auth-Systeme wären Doppelspurigkeit; Neon/Stack Auth bringt ein eigenes User-Modell mit,
  das schwer auf unser Tenant-Konzept zu biegen wäre, und würde Auth an den DB-Provider
  koppeln (Lock-in gegen späteren DB-Umzug). Neon dient rein als Postgres.
- **Connection Pooling:** an (gepoolte URL für serverless/Edge-Zugriffe; Drizzle-Migrations
  nutzen die direkte, nicht-gepoolte URL). Relevant erst beim `packages/db`-Setup.

### ADR-006 — API-Typsicherheit: ts-rest (+ Zod) · **ENTSCHIEDEN**
Ein `contracts`-Package definiert REST-Endpunkte einmal mit Zod-Schemata; NestJS
implementiert die getypten Contracts, App und Admin bekommen automatisch getypte
Clients. Ergebnis: end-to-end Typsicherheit über REST, ohne Doppel-Definitionen.
**Alternative:** OpenAPI-Codegen oder tRPC-NestJS-Adapter — verworfen zugunsten von ts-rest.

### ADR-007 — Offline-first Strategie · **ENTSCHIEDEN**
Festivals = schlechtes Netz. Lageplan, Timetable, News, Ticket/Wallet müssen offline laufen.
**Entscheidung:** pragmatischer Layered-Cache, KEIN bidirektionaler Sync-Engine.
- Read-mostly Daten via **TanStack Query mit Persistenz** (Expo SQLite/MMKV als Cache);
  Updates via Push, Refetch bei Reconnect.
- Die wenigen Offline-Writes (Favoriten, Tauschbörsen-Entwurf) über eine kleine
  **Mutation-Queue**, die bei Reconnect abgearbeitet wird.

**Verworfen:** PowerSync/ElectricSQL — lohnen erst bei vielen Offline-*Writes*, die es hier
nicht gibt; würden nur Komplexität und Betriebslast draufpacken.

### ADR-008 — Karten: MapLibre · **VORGESCHLAGEN**
Eigene Festival-Geländekarte statt Google-Weltkarte; keine Lizenzkosten, volle Kontrolle
über Custom-Tiles. RN: `@maplibre/maplibre-react-native`.

### ADR-009 — Auth: better-auth · **ENTSCHIEDEN**
TS-nativ, integriert mit Drizzle/Postgres, mandantenfähig (Organizations = Festivals),
Social-Login + Passkeys, self-hosted → keine Per-MAU-Kosten (entscheidend bei stoßweise
zehntausenden Festival-Nutzern).
**Verworfen:** Clerk — würde Security auslagern, aber Vendor-Lock-in + MAU-Kosten.
**Konsequenz:** Security-Verantwortung liegt bei uns; Auth-Flows sorgfältig reviewen.

### ADR-010 — Hosting/Infra: Neon + Railway · **ENTSCHIEDEN**
- **DB:** Neon (serverless Postgres, Branching für Preview/CI, skaliert auf null),
  Region `eu-central-1` (Frankfurt, siehe ADR-005).
- **Backend:** Railway (NestJS-Container + Redis; einfacher DX-Einstieg, WebSocket-freundlich).
  Bei globaler Latenz später nach Fly.io migrierbar. **Region EU wählen**, um mit der
  Neon-DB (Frankfurt) co-located zu bleiben — API↔DB-Latenz ist der kritische Pfad.
- **Realtime:** NestJS WebSocket-Gateway mit Redis-Adapter (horizontale Skalierung).
- **CI/CD:** GitHub Actions.

**Verworfen:** Supabase (Auth/Realtime gebündelt) — wir kontrollieren Auth/Realtime selbst in TS.

### ADR-011 — Cashless: eingebettete URL pro Festival · **ENTSCHIEDEN**
Die meisten Festivals haben ihr eigenes Cashless-System. festipal integriert kein eigenes
Bezahlsystem und verarbeitet **nie** Karten-/Zahlungsdaten. Stattdessen kann pro Festival
eine **Cashless-URL** hinterlegt werden, die in der App eingebettet angezeigt wird:
- **App:** `react-native-webview` (kein echtes iframe in RN), nur HTTPS, auf die
  konfigurierte Domain beschränkt, sandboxed.
- **Admin:** iframe-Vorschau beim Konfigurieren der URL.
- Das Feld liegt am Festival-(Tenant-)Datensatz; fehlt die URL, wird der Cashless-Bereich ausgeblendet.

So bleibt PCI-DSS komplett draußen. Tiefergehende Integrationen (Guthaben in-App etc.) nur,
falls ein späterer Kooperationspartner das explizit anbietet.

---

## Tech-Stack (Kurzüberblick)

| Ebene | Technologie |
|---|---|
| Mobile App | React Native (New Arch) + Expo + Expo Router + TypeScript |
| App-Deployment | EAS Build / Submit / **Update** (OTA) |
| Offline | Expo SQLite/MMKV + Drizzle + TanStack Query (persistiert) + Mutation-Queue |
| Karten | MapLibre |
| Admin-Web | Next.js 15 + React 19 + shadcn/ui + Tailwind |
| Backend | NestJS (TypeScript) |
| Auth | better-auth (TS, self-hosted, mandantenfähig) |
| Realtime | NestJS WebSocket-Gateway + Redis-Adapter |
| API-Contracts | ts-rest + Zod (`packages/contracts`) |
| Datenbank | PostgreSQL + Drizzle ORM (Neon) |
| Hosting | Neon (DB) + Railway (Backend/Redis) |
| Cashless | pro Festival hinterlegte URL, eingebettet (WebView/iframe) |
| Monorepo | Turborepo + pnpm |
| Tests | Vitest (Unit) + Playwright (E2E Web) + Maestro/Detox (App-E2E) |
| CI/CD | GitHub Actions |

---

## Geplante Monorepo-Struktur

```
festipal/
├─ apps/
│  ├─ mobile/          # Expo React Native App
│  ├─ admin/           # Next.js Admin-Web
│  └─ api/             # NestJS Backend
├─ packages/
│  ├─ contracts/       # ts-rest + Zod API-Contracts (single source of truth)
│  ├─ db/              # Drizzle Schema + Migrationen
│  ├─ ui/              # geteilte Design-Tokens / Primitives
│  └─ config/          # geteilte eslint/tsconfig/prettier
├─ docs/
│  ├─ DEVELOPMENT_DECISIONS.md   # dieses Dokument
│  └─ ...
├─ turbo.json
├─ pnpm-workspace.yaml
└─ CLAUDE.md
```

---

## Querschnittsprinzipien

- **Multi-Tenancy von Tag 1** — jedes fachliche Modell und jede Query ist festival-scoped.
- **Offline-first von Tag 1** — nicht nachträglich draufsetzen.
- **End-to-end Typsicherheit** — keine untypisierten API-Grenzen; Contracts sind Vertrag.
- **Sicherheit** — keine Kartendaten im eigenen System; Secrets nie im Repo; Auth mandantenfähig.
- **Design-Treue** — Frontend orientiert sich an den Vorlagen aus Claude Design (claude.ai/design).

---

## Deployment- & Release-Strategie

- **Builds/Submit:** EAS Build (Cloud, kein lokales Xcode nötig) → EAS Submit in App Store & Play Store.
- **Content-/Fix-Auslieferung:** EAS Update (OTA) für JS-/Content-Änderungen ohne Store-Review.
  Native Änderungen (neue Native-Module) erfordern weiterhin einen Store-Build.
- **Kanäle:** getrennte EAS-Update-Kanäle für `preview` und `production`.
- **CI:** GitHub Actions triggert Builds, Tests, Deploys.

---

## Claude-Code-Betriebsmodell (siehe auch CLAUDE.md)

- **Modell:** Opus 4.8 als Default (Architektur, Planung, Reviews); Sonnet 5 gezielt für
  hochvolumige, mechanische Arbeit. `/fast` für flüssigeres Arbeiten.
- **MCP-Server:** Context7 (aktuelle Doku), Playwright/Chrome-DevTools (Browser & E2E),
  PostgreSQL (Schema-Introspection). Kein Figma-MCP nötig (Designs kommen aus Claude Design).
- **Subagents:** u. a. `architect`, `code-reviewer`, `test-writer`.
- **Hooks:** Lint/Format/Typecheck automatisch nach Änderungen.
- **Permissions:** Allowlist für pnpm/git/eas/Test-Runner in `.claude/settings.json`.

---

## Vorzubereiten (Nutzer)

- **Accounts:** ✅ Expo/EAS (Personal Account) · ✅ Neon (DB) · Apple Developer Program
  (99 $/Jahr, erst vor Store-Release) · Google Play Console (25 $ einmalig, erst vor
  Store-Release) · Railway (Backend/Redis) · GitHub.
- **Lokale Toolchain:** Node LTS, pnpm, Git, EAS CLI, Docker (lokales Postgres); für
  Gerätetests optional Xcode (iOS) / Android Studio.

---

## Nächste Schritte

Alle Kern-ADRs sind entschieden. Als Nächstes:
1. Monorepo-Scaffolding (Turborepo + pnpm; `apps/mobile`, `apps/admin`, `apps/api`; `packages/contracts`, `db`, `ui`, `config`).
2. Claude-Code-Setup vervollständigen (Subagents, Hooks, Permissions-Allowlist).
3. Datenmodell v1 (festival-scoped) + erste ts-rest-Contracts.
4. Design-Tokens aus Claude Design übernehmen, sobald erste Designs vorliegen.
