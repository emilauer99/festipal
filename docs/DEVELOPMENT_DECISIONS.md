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

**Version-Constraint (2026-07-28):** ts-rest 3.52 verlangt als Peer **zod v3** (nicht zod 4).
Daher workspace-weit **zod 3.x** (aktuell 3.25.76) pinnen. zod 3 ist voll unterstützt und
stabil; Upgrade auf zod 4, sobald ts-rest v4 mit zod-4-Support erscheint.

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

**Konkretisierung nach Design-Abgleich (2026-07-28) — Screen 12:** Der erste Designentwurf
zeigt ein *natives* Wallet (Guthaben, Aufladen per Apple Pay, Bezahl-QR, Buchungsliste,
Auto-Aufladung). Das wird **bewusst nicht gebaut** — Sicherheit (dieses ADR) schlägt
Design-Treue (Prinzip 5). Verbindliche Auslegung: **strikt eingebettete URL**.
- **Cashless-Screen = reine WebView** auf die Cashless-Seite des Festivals. Kein natives
  Guthaben-Element, keine native Buchungsliste, kein Bezahl-QR, kein Aufladen in der App.
- festipal **speichert kein Guthaben und keine Buchungen**; alles lebt beim Anbieter. Am
  Festival-(Tenant-)Datensatz liegt nur die Cashless-URL (+ optional ein Deep-Link-Parameter,
  um den User in sein Anbieter-Konto zu leiten — **nie** Zahlungsdaten).
- **Ripple-Effekte im Design** (in Konzept-Doc `concept/02` als „B1 gelöst" vermerkt): die
  Dashboard-Cashless-Kachel und der Settings-Eintrag zeigen **kein** Guthaben mehr, sondern
  sind ein reiner „Cashless öffnen"-Einstieg; die Settings-Option **Auto-Aufladung entfällt**.
- **Verworfen:** Hybrid (native Read-only-Anzeige via Anbieter-API) und volles natives Wallet —
  Ersteres bringt pro Anbieter einen API-Adapter und uneinheitliche UX, Letzteres PCI-Scope.

### ADR-012 — Mehrsprachigkeit (i18n) · **ENTSCHIEDEN**
App **und** Admin müssen mehrsprachig sein. Bei einem Multi-Festival-Produkt mit
internationalen Besuchern ist i18n von Tag 1 einzuplanen. Zwei klar getrennte Ebenen:

**(A) UI-Strings (Entwickler-Texte: Buttons, Labels, Fehler) → Lingui**
- **Lingui** (ICU MessageFormat) — korrekte Plurale/Genus/Datums-/Zahlformate je Sprache,
  Compile-time-Extraktion + **Typsicherheit** auf Message-Keys, funktioniert in React Native
  *und* Next.js (App Router, SWC-Plugin). Kataloge liegen geteilt in `packages/i18n`.
- **Formatierung** (Datum/Zahl/Währung) über die JS-**`Intl`-API** (Hermes hat Intl in Expo aktiv).
- **Locale-Erkennung:** App via `expo-localization` + persistiertem Nutzer-Override;
  Admin via Next.js Locale-Routing (`/[locale]/…`) bzw. Cookie.
- **Verworfen:** i18next (reif, aber ohne ICU/Typsicherheit out-of-the-box) und Paraglide
  (schlanker/typsicher, aber jünger und RN/Metro-Integration weniger erprobt).

**(B) Dynamischer Content (Festival-Daten: News, Timetable, Marketplace) → Übersetzungstabellen**
- Übersetzbare Entities bekommen eine Companion-Tabelle `*_translation(entity_id, locale, …felder)`.
  Sauber indexier- und filterbar, zeigt dem Admin, welche Übersetzungen **fehlen**.
- **Server-seitige Locale-Resolution:** angefragte Locale → Festival-Default-Locale → Fallback.
  API liefert Clients bereits lokalisierten Content; dem Admin **alle** Übersetzungen zum Pflegen.
- **Verworfen:** JSONB-Feld `{de,en}` pro Spalte — einfacher, aber schlecht für „fehlende
  Übersetzung finden", Indexierung und Locale-Filterung.

**Multi-Tenant-i18n:** Jedes Festival deklariert `supportedLocales` + `defaultLocale`. Nutzer
sehen ihre bevorzugte Locale, sonst den Festival-Default. `LocalizedText` wird in
`packages/contracts` einheitlich modelliert.

**RTL:** Layout von Anfang an RTL-fähig halten (RN `I18nManager`, CSS logical properties),
auch wenn initial nur LTR-Sprachen ausgeliefert werden.

**Sprachen (Start):** Deutsch + Englisch; globaler App-Default = **Englisch** (neutral
international), jederzeit erweiterbar; jedes Festival wählt eine Teilmenge.

**Content-Vollständigkeit (pragmatisch, ENTSCHIEDEN):** Nur die Festival-**Default-Sprache**
ist beim Anlegen Pflicht; weitere Sprachen optional. Fehlt eine Übersetzung, greift der
Fallback auf den Festival-Default; der Admin sieht ein **„Übersetzung fehlt"-Badge**.
(Optionaler Per-Festival-Schalter „alle Übersetzungen erzwingen" erst bei Bedarf.)
System-Tags (globale Kategorien) übersetzen wir zentral, nicht je Festival.

**Locale-Resolution — zwei unabhängige Achsen:**
1. *App-UI-Sprache* (Lingui-Strings): persistierter Nutzer-Override → sonst **System-/Gerätesprache**
   (`expo-localization`), falls von uns unterstützt (DE/EN) → sonst globaler App-Default (EN).
   → Bei Neuinstallation gewinnt die Systemsprache, **nicht** unser Default.
2. *Festival-Content-Sprache*: effektive App-UI-Sprache, falls das Festival sie unterstützt →
   sonst Festival-`defaultLocale`. Die Achsen sind unabhängig: engl. App-UI + reines DE-Festival
   → UI englisch, Content deutsch (Fallback).

### ADR-013 — TypeScript-Version: 6.0.x (vorerst) · **ENTSCHIEDEN**
TypeScript 7.0 ist der neue native (Go-)Compiler `tsgo`; das Tooling-Ökosystem braucht aber
noch die TS-**6.0**-API (u. a. typescript-eslint — Tracking: typescript-eslint#10940). TS 6.0
ist derselbe Sprachstand als API-kompatibler JS-Compiler und voll unterstützt.
**Entscheidung:** projektweit **TypeScript 6.0.x** pinnen (aktuell 6.0.3). Migration auf TS 7
(nativ) als reines Performance-Upgrade ohne Sprachänderung, sobald typescript-eslint und die
Build-Tools (Nest/Next/Expo) es tragen.

### ADR-014 — Mandantengrenze & Datenklassen (Global ↔ Festival) · **ENTSCHIEDEN**
Abgeleitet aus dem ersten Designentwurf (zwei Navigationskontexte) und der Multi-Tenancy-Regel.
Konkretisiert, *wie* „Multi-Tenancy von Tag 1" fachlich geschnitten ist.

**Entscheidung:**
1. **Global ↔ Festival ist die Mandantengrenze.** Ein User gehört keinem Festival; er *betritt*
   ein Festival (`openFestival` = „Tenant betreten"). Der Festival-Kontext ist genau ein Mandant.
   Jeder festival-scoped Request/Query trägt eine geprüfte `festivalId` (nie cross-tenant ohne
   expliziten Kontext).
2. **Zwei Datenklassen:**
   - *User-global (kein Tenant):* Konto/Profil, Einstellungen, Festival-Liste (angemeldet/
     empfohlen/vorbei), **gefolgte Artists**, **Freundschaften**, globale News.
   - *Festival-scoped (Tenant = Festival):* Timetable/Acts/Stages, Lageplan/Vendors,
     Tauschbörse-Listings, Aktivitäten, Festival-News, **Präsenz/Standort der Crew**.
3. **Freundes-Graph:** Freundschaften sind **user-global** (bleiben über Festivals bestehen).
   **Präsenz, Standort, Distanz und „wer ist hier" sind strikt festival-scoped** und existieren
   **nur während des Events**. „Crew" = die eigenen Freunde, die auf *diesem* Festival sind
   (globale Freundesliste ∩ Anwesende). Datenschutz: Standortdaten sind nie global, nur pro
   Festival und zeitlich begrenzt.
4. **Cashless-Guthaben** ist **keine** unserer Datenklassen (lebt beim Anbieter, ADR-011).

**Begründung:** Deckt sich 1:1 mit dem Design, minimiert Standort-/Präsenz-Datenhaltung (DSGVO),
und gibt API + Drizzle-Schema eine klare Scoping-Regel (jede Tabelle ist entweder user- oder
festival-scoped; festival-scoped Tabellen haben `festivalId` + Tenant-Guard).

**Konsequenz:** Auth/Session müssen den aktiven Festival-Kontext führen; `packages/contracts`
trennt user- und festival-scoped Endpunkte; Präsenz-/Standortdaten bekommen eine Retention-/
Sichtbarkeitsregel (nur aktives Festival, nur Freunde, nur mit aktiviertem Teilen).

**MVP-Scope (2026-07-28, Design-Abgleich):**
- **Fassade (Global Shell) = 3 Tabs: Festivals · Friends · Profil/Mehr.** Festivals ist die
  Landing (gespeicherte / angelegte / entdeckbare Festivals); der „Home"-Overview des Designs
  entfällt und geht in die Festival-Liste auf. Globale News über Glocken-Icon (Push-Screen).
- **Artists werden im MVP weggelassen** (kein Tab, kein Screen). Festivalübergreifendes
  Artist-Favorisieren ist ein möglicher späterer Schritt (eigene Entscheidung).
- **SafeNow** ist nicht im MVP (zurückgestellt).
- **Cashless** existiert nur *im* Festival-Kontext als ein eingebetteter Link pro Festival
  (ADR-011); in der Fassade kommt Cashless nicht vor.

### ADR-015 — Design-System-Fundament & Festival-Theming-Vertrag · **ENTSCHIEDEN**
Basis: der **festipal Brand Guide** (Juli 2026) + die Token-Datei. Details in
`docs/concept/03-design-system.md`.

**Entscheidung:**
1. **Brand Guide ist das verbindliche visuelle + sprachliche Fundament** (Prinzip 5, Design-Treue)
   und wird als `packages/ui` (Tokens + Komponenten, auf React Native portiert) umgesetzt. Tokens
   sind Single Source of Truth; **Komponenten nutzen nur semantische Aliase**, nie rohe Rampenwerte.
2. **Voice/Tone ist bindender Content-Style-Guide** und Quelle der i18n-Basis-Strings (Deutsch,
   Du-Form, „Freundin mit Plan", Satz-Schreibweise, keine Emoji, Numerisches in Mono). Koppelt an
   ADR-012; Formatierung über `Intl`.
3. **Festival-Theming-Vertrag:** Ein Festival darf **die 4 CI-Farbtokens** (`--ci-primary`,
   `--ci-secondary`, `--ci-tint`, `--ci-on-primary`), **ein optionales Logo** (Kopfzeile, Fallback =
   Name als Text) und den **Festival-Namen** anpassen. **Nicht** änderbar: Schrift, Layout, Radien,
   Motion, Komponenten, Wortmarke-Systematik. Tenant-Datensatz speichert die 4 CI-Werte + `logoAsset?`
   + `name`. **Kontrast-Validierung** (`--ci-on-primary` vs. `--ci-primary`, WCAG) erzwingt der Admin.
   Fehlende Werte → Fallback auf festipal-Basis (grün/violett); fehlendes Logo → Name als Text.
4. **Platzhalter/Ersetzungen** (produktionsreife Defaults, austauschbar): Schriften Outfit /
   Plus Jakarta Sans / JetBrains Mono (Google Fonts, **OFL**, via `expo-font` gebündelt); Icons
   Lucide (`<Icon name>`, Ein-Datei-Tausch); Logo/Fotos = Platzhalter (`Photo` → Initialen-Kachel);
   Lageplan = Blockschema bis MapLibre (ADR-008).

**Divergenzen zum Brand Guide** (durch Scope-Beschlüsse überschrieben): `BalanceCard`/natives Wallet
entfällt (ADR-011); `SafeNowCard` zurückgestellt (B2); Artists-Komponenten zurückgestellt (ADR-014).

**Konsequenz:** RN-Portierungsstrategie (Styling-Ansatz, Theme-Provider für CI-Tokens, Font-Loading)
ist beim Scaffolding zu entscheiden (Konzept-Punkt C8). Admin braucht einen Theming-Editor mit
Kontrast-Check.

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
| i18n | Lingui (UI-Strings) + Intl (Formatierung) + DB-Übersetzungstabellen (Content) |
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
│  ├─ i18n/            # Lingui-Kataloge, Locale-Config, LocalizedText-Helfer
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
- **Mehrsprachigkeit von Tag 1** — App & Admin i18n-fähig; keine hartkodierten UI-Strings; Content pro Festival-Locale.
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
1. Monorepo-Scaffolding (Turborepo + pnpm; `apps/mobile`, `apps/admin`, `apps/api`; `packages/contracts`, `db`, `ui`, `i18n`, `config`).
2. Claude-Code-Setup vervollständigen (Subagents, Hooks, Permissions-Allowlist).
3. Datenmodell v1 (festival-scoped) + erste ts-rest-Contracts.
4. Design-Tokens aus Claude Design übernehmen, sobald erste Designs vorliegen.
