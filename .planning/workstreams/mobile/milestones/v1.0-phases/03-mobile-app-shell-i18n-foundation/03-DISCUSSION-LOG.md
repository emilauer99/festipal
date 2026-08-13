# Phase 3: Mobile App Shell & i18n Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-03
**Phase:** 3-mobile-app-shell-i18n-foundation
**Areas discussed:** Sichtbarer Endzustand, App-Identität & Scheme, Sprachverhalten, Dev- & Test-Setup (+ Docker-Env als Zusatzthema des Users)

---

## Sichtbarer Endzustand

| Option | Description | Selected |
|--------|-------------|----------|
| Platzhalter je Route (Empfohlen) | Navigierbare Platzhalter-Screens je Routengruppe mit Lingui-Strings | ✓ |
| Minimales Gerüst | Nur ein Start-Screen; Routengruppen ohne sichtbare Inhalte | |
| Mehr als Platzhalter | Platzhalter schon grob nach geplanter Struktur (Doppelarbeits-Risiko) | |

**User's choice:** Platzhalter je Route

| Option | Description | Selected |
|--------|-------------|----------|
| Rudimentärer OTP-Flow (Empfohlen) | Funktionierender Mini-Login (E-Mail → Code → drin), ungestylt; beweist Auth-Client + SecureStore end-to-end | ✓ |
| Dev-Bypass | Guard lokal umgehen; Auth-Client bliebe unbewiesen | |
| Nur Session per Skript | Session via Test-Skript in SecureStore legen | |

**User's choice:** Rudimentärer OTP-Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Echte Festival-Liste (Empfohlen) | GET /festivals zeigt Seed-Festival „Frequency 2026"; Save → (festival)-Home funktioniert rudimentär | ✓ |
| Nur Lese-Anzeige | Liste ja, Save/Enter tot | |
| Unsichtbar / nur Test | API-Anbindung nur per Test bewiesen | |

**User's choice:** Echte Festival-Liste

| Option | Description | Selected |
|--------|-------------|----------|
| Schlichter Schriftzug (Empfohlen) | Einfarbiger Hintergrund + „festipal"-Schriftzug als Splash/Icon-Platzhalter | ✓ |
| Expo-Standard | Default-Splash/-Icon unverändert | |
| Ich habe Assets | Vorhandenes Logo/Icon/Farben einbauen | |

**User's choice:** Schlichter Schriftzug

---

## App-Identität & Scheme

| Option | Description | Selected |
|--------|-------------|----------|
| „festipal" (Empfohlen) | Anzeigename klein, Slug `festipal` | ✓ |
| „Festipal" | Großgeschriebener Anzeigename | |
| Anderer Name | Eigener Arbeitstitel | |

**User's choice:** „festipal"

| Option | Description | Selected |
|--------|-------------|----------|
| at.festipal.app (Empfohlen) | Österreichische Domain-Konvention | ✓ |
| com.festipal.app | Generische .com-Konvention | |
| at.itkaufmann.festipal | Unter bestehender Firmen-Domain | |

**User's choice:** at.festipal.app

| Option | Description | Selected |
|--------|-------------|----------|
| festipal:// (Empfohlen) | Kurzes Scheme passend zum App-Namen | ✓ |
| at.festipal.app:// | Scheme = Bundle-ID | |

**User's choice:** festipal://

**Notes:** User stellte klar: **„festipal" ist nur ein Working Title** — Name, Bundle-ID
und Scheme können sich noch ändern; das soll dokumentiert werden. Geklärt: alles frei
änderbar bis zum ersten Store-Submit (Bundle-ID danach = neue App); Scheme-Änderung muss
synchron mit better-auth `trustedOrigins` erfolgen.

---

## Sprachverhalten

| Option | Description | Selected |
|--------|-------------|----------|
| Nur Gerätesprache (Empfohlen) | Sprache folgt Systemsprache (ADR-012); Umschalter später additiv | ✓ |
| Umschalter jetzt | Zusätzlich Sprachwechsler + Persistenz | |

**User's choice:** Nur Gerätesprache

| Option | Description | Selected |
|--------|-------------|----------|
| Englisch (Empfohlen) | EN-Fallback, entspricht DEFAULT_LOCALE='en' | |
| Deutsch | DE-Fallback für deutschsprachiges Erstpublikum | ✓ |

**User's choice:** Deutsch (Fallback bei Systemsprache ≠ DE/EN)

| Option | Description | Selected |
|--------|-------------|----------|
| Deutsch im Code (Empfohlen) | Quell-Strings DE, EN-Katalog übersetzt | |
| Englisch im Code | Quell-Strings EN, DE-Katalog übersetzt | ✓ |

**User's choice:** Englisch im Code (bindende deutsche Konzept-Begriffe werden im DE-Katalog exakt gepflegt)

---

## Dev- & Test-Setup

**Testgeräte:** Freitext-Antwort des Users: „echtes Android und echtes iOS Gerät"
(Optionen waren: echtes Android-Gerät / echtes iPhone / Android-Emulator / Empfehlung).

**Build-Weg:** Auf die Frage Expo Go vs. EAS antwortete der User: „ich habe einen Mac,
kann dann in Xcode testen oder?" — Geklärt und festgehalten: lokale Dev-Builds beidseitig;
Android via `npx expo run:android` (Windows-PC), iOS via `npx expo run:ios`/Xcode am Mac
mit kostenloser Apple-ID-Provisionierung (7-Tage-Signatur); Repo auch am Mac auschecken;
kein EAS in dieser Phase.

| Option | Description | Selected |
|--------|-------------|----------|
| Lokale API im WLAN (Empfohlen) | Geräte + PC im selben WLAN; LAN-IP via Env; Cleartext nur im Dev-Build | ✓ |
| Jetzt auf Railway deployen | API erstmals deployen, App gegen HTTPS-URL | |
| Beides vorbereiten | Primär lokal, mehrstufige Env-Konfiguration | |

**User's choice:** Lokale API im WLAN

---

## Docker-Env (vom User eingebrachtes Zusatzthema)

Der User fragte, ob ein Docker-(Compose-)Environment für API + DB lokal sinnvoll wäre
(auch um Neon-Kosten zu sparen) und ob es dafür zu spät sei. Einschätzung: nicht zu spät,
geringer Aufwand; Empfehlung Postgres + Mailpit im Compose, API nativ via `pnpm dev`.

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, in Phase 3 (Empfohlen) | docker-compose.yml (Postgres 18 + Mailpit), lokale Migration + Seed; Neon bleibt Staging | ✓ |
| Vorher als Quick-Task | Getrennt per /gsd-quick | |
| Später / deferred | Weiter mit Neon als Dev-DB | |

**User's choice:** Ja, in Phase 3

---

## Claude's Discretion

- Route-Group-Dateilayout, Guard-Implementierung (Dreiwege-Zustand inkl.
  profile-incomplete), Splash-Gating-State-Machine.
- Metro/pnpm-Monorepo-Konfiguration, Lingui-Wiring, Wahl der No-Literal-String-Lint-Regel.
- docker-compose-Details, Env-Datei-Layout, `EXPO_PUBLIC_API_URL`-Handhabung je Rechner.
- DEFAULT_LOCALE global ändern vs. UI-Achsen-Fallback (im PLAN.md ausweisen).
- Platzhalter-Inhalte jenseits der entschiedenen Elemente (unstyled, minimal).

## Deferred Ideas

- In-App-Sprachumschalter (+ Persistenz) → mit echtem Profil-Screen
- Echtes Branding (Logo/Farben/Splash/Icon) → sobald Claude-Design-Assets existieren
- Finale App-Identität (Name/Bundle-ID/Scheme) → vor erstem EAS Submit
- EAS Build/Submit/Update + Apple-Developer-Account → Store-Release-Phase
- Railway-Deploy + HTTPS/CORS/trustedOrigins für deployte URL → Staging-Bedarf
- TanStack-Query-Persistenz (Offline-Cache) → mit cachebaren Content-Features
