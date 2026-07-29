# 02 — Abgeleitete Konzepte, offene Fragen & Abstimmungs-Roadmap

> **Zweck:** Aus der Analyse ([`01`](./01-design-analysis.md)) abgeleitete **Konzept-Bereiche**
> und **Widersprüche zu bestehenden ADRs**, plus die Reihenfolge, in der wir sie abstimmen.
> Jeder Block ist ein eigener Abstimmungs-Schritt. Ergebnisse wandern als ADR nach
> [`../DEVELOPMENT_DECISIONS.md`](../DEVELOPMENT_DECISIONS.md). Stand: 2026-07-28.

---

## Teil A — Zentrale Ableitungen (mein Vorschlag, noch abzustimmen)

### A1. Global ↔ Festival = die Mandantengrenze
Die zwei Navigationskontexte des Designs sind faktisch die **Multi-Tenancy-Grenze**:
- **Global Shell** = User-Ebene, festivalübergreifend (ein User, viele Festivals).
- **Festival-Kontext** = genau **ein Mandant** (Tenant). `openFestival()` = „Tenant betreten".

Das passt perfekt zu ADR (Multi-Tenancy von Tag 1). **Vorschlag:** Wir machen den Tenant-Kontext
explizit in Routing, State und API (jeder Festival-scoped Request trägt die `festivalId`).

### A2. Zwei Datenklassen: User-global vs. Festival-scoped
Daraus folgt eine saubere Trennung fürs Domänenmodell und die API:

| User-global (kein Tenant) | Festival-scoped (Tenant = Festival) |
|---|---|
| Konto/Profil, Einstellungen | Timetable/Acts/Stages |
| Festival-Liste (angemeldet/empfohlen/vorbei) | Lageplan, Vendors |
| Gefolgte Artists | Tauschbörse-Listings |
| Freundes-Graph (Crew) | Aktivitäten (Crew vor Ort) |
| Globale News | Festival-News |
| Tickets/Wallet *(strittig, siehe B1)* | Cashless-Buchungen *(strittig, siehe B1)* |

### A3. ✅ GELÖST (2026-07-28) — Design-System-Fundament → ADR-015
Brand Guide (Juli 2026) als verbindliches visuelles + sprachliches Fundament übernommen; wird
`packages/ui` (Tokens + 32 Komponenten, RN-portiert). **Festival-Theming-Vertrag:** 4 CI-Farbtokens
+ optionales Logo + Name (Schrift/Layout/Wortmarke bleiben festipal); Kontrast-Validierung im Admin.
Voice/Tone bindend (Content-Style-Guide + i18n-Basis). Schriften/Icons/Logo/Fotos = austauschbare
Platzhalter. Vollständig in `03-design-system.md`. Portierung nach RN = C8 (beim Scaffolding).

### A4. MVP-Schnitt entlang der Signatur-Features
Die App ist groß. Vorschlag für einen ersten vertikalen Schnitt (statt „alle 13 Screens
gleichzeitig") — abzustimmen in C:
1. **Fundament:** Onboarding/Auth, Festival betreten, Shell + Navigation, `packages/ui`.
2. **Read-only Kern (offline-first):** Timetable, Lageplan, News, Dashboard.
3. **Differenzierer:** Tauschbörse, Crew/Aktivitäten.
4. **Integrationen:** Cashless (nach Klärung B1), SafeNow (nach Klärung B2).

---

## Teil B — Widersprüche zu bestehenden ADRs (Entscheidung nötig)

### B1. ✅ GELÖST (2026-07-28) — Cashless: strikt eingebettete URL
**Entscheidung:** Reine WebView auf die Cashless-Seite des Festivals; **kein** natives Wallet.
festipal speichert kein Guthaben/keine Buchungen. Festgehalten in **ADR-011** (Konkretisierung
nach Design-Abgleich). Sicherheit schlägt Design-Treue.

**Ripple-Effekte im Design, die daraus folgen (umzusetzen, wenn wir Screens bauen):**
- **Screen 12 (Cashless):** `BalanceCard`, Bezahl-QR-Sheet, Aufladen-Sheet, Buchungsliste
  **entfallen** → ersetzt durch eine eingebettete WebView (Anbieter-Seite). Optional dünner
  nativer Header „Cashless · {Festival}".
- **Dashboard-Cashless-Kachel:** zeigt **kein** Guthaben (48,50 €) mehr → reiner
  „Cashless öffnen"-Einstieg ohne Betrag.
- **Settings/Profil:** Eintrag „Cashless & Zahlungen 48,50 €" → „Cashless" ohne Betrag;
  **Switch „Auto-Aufladung" entfällt** (Zahlungsfunktion).
- **Domänenmodell:** keine `balance`/`chip`/`Transaction`-Felder bei uns; am Festival-Tenant
  nur `cashlessUrl` (+ optional Deep-Link-Parameter). Fehlt die URL → Bereich ausgeblendet.
- **Ticket ≠ Cashless:** ✅ geklärt (2026-07-29, Cluster 1) — Ticket ist ein **Anzeige-Feature**
  (QR pro Nutzer/Festival, manuell hinterlegt, offline), **kein Beitritts-Gate** und getrennt von
  Cashless (ADR-011). Details: ADR-014 / ADR-016 + `04-domain-identity.md`.

**Verworfen:** Hybrid (Read-only nativ via Anbieter-API), volles natives Wallet.

### B2. ⏸️ OFFEN & ZUGEWIESEN (Update 2026-07-29) — Safety/Jugendschutz (inkl. SafeNow)
Nicht im MVP, aber **rechtlich relevant** (Meeting): **Birgit** erarbeitet ein Safety-/Jugendschutz-
Konzept — Alter/Geschlecht/Flinta-Filter, **Disclaimer bei Anmeldung**, SafeNow nur *empfehlen*
(echte Integration TBD). SafeNow-Elemente im Design bleiben zunächst weg. Pitch beim nächsten Meeting.

### B3. ✅ GELÖST (2026-07-28) — Festivalübergreifende User-Daten
**Entscheidung** (Teil von **ADR-014**): Zwei Datenklassen (user-global vs. festival-scoped);
Freundschaften global, **Präsenz/Standort/Crew festival-scoped und nur während des Events**.
Damit ist die A2-Tabelle bestätigt und der Freundes-/Crew-Split entschieden. Kein Widerspruch —
Scope-Regel jetzt präzise. Cashless-Guthaben ist gar keine unserer Datenklassen (B1/ADR-011).

**Präzisierung (2026-07-28) — Fassade zeigt vorerst nur Festivals:**
- **Artists werden im MVP weggelassen.** Kein Artists-Tab in der Fassade (Global Shell).
  „Deine Artists spielen bald" (Home) und der Artists-Screen entfallen vorerst. Später evtl.
  festivalübergreifendes Favorisieren von Artists — dann als eigener Schritt.
- **Fassade-Navigation (MVP) = 3 Tabs: Festivals · Friends · Profil/Mehr.**
  - *Festivals* ist die Landing (gespeicherte / angelegte / entdeckbare Festivals). Der
    separate „Home"-Overview-Screen des Designs **entfällt** und geht in die Festival-Liste auf.
  - *Friends* = globale Freundschaftsverwaltung (Freunde, Anfragen); Präsenz/Standort bleibt
    festival-scoped (ADR-014).
  - *Profil/Mehr* = Konto + Einstellungen.
  - **Globale News** bleiben über das Glocken-Icon (Push-Screen) erreichbar, kein eigener Tab.
- **Cashless** ist in der Fassade komplett irrelevant — es existiert nur *im* Festival-Kontext
  (ein Iframe-/WebView-Link pro Festival, ADR-011). Kein Guthaben, kein Wallet, nirgends.

---

## Teil C — Themen, die wir noch ausarbeiten (je eigener Schritt/Doc)

1. **Informationsarchitektur & Navigation** — Kontextwechsel Global↔Festival als Routing
   (Expo Router), Deep-Links, Push-Screens, Zustand bei „Tenant betreten/verlassen".
2. **Domänenmodell v1** — die Entitäten aus §3 in typisierte Zod-Contracts + Drizzle-Schema
   überführen; Tenant-Scoping pro Tabelle; echte Typen (Geld, Zeit, Geo).
3. **Feature-Scope / MVP-Roadmap** — welcher Schnitt zuerst (Vorschlag A4), was bewusst später.
4. **Offline-Matrix** — pro Screen: was muss offline funktionieren (Timetable/Map/Ticket/Wallet
   laut ADR-007), was ist Cache, was braucht Netz. Mutation-Queue für welche Writes (Merken,
   Tausch-Entwurf, Aktivität, Anfrage)?
5. **Fehlende Screens/Flows** — ✅ tlw. geklärt (Cluster 1): Onboarding + **Auth passwortlos**
   (E-Mail-OTP, ADR-009), Ticket **hinterlegen/anzeigen** (QR, kein Beitritts-Gate — ADR-014/016).
   Offen: Artist-Detail (post-MVP), globale Suche, expliziter Offline-Zustand.
6. **Multi-Tenancy-Mechanik** — Festival als Tenant, CI-Theming (4 Variablen), festivalspezifische
   Inhalte (Vendors, Lageplan-Tileset, Cashless-URL) und Feature-Flags pro Festival.
7. **Cashless- & SafeNow-Konzept** — abhängig von B1/B2, dann eigene ADR(s).
8. **Design-System-Portierung** — Web-DS (CSS/JSX) → React-Native-tauglich (Tokens als JS,
   Komponenten in RN), gemeinsame Nutzung mit dem Next.js-Admin.

---

## Vorgeschlagene Reihenfolge der Abstimmung

Ich schlage vor, wir klären **zuerst die Weichenstellungen** (weil davon vieles abhängt), dann
das Modell, dann den Schnitt:

1. ✅ **B1 Cashless** (→ ADR-011) · ✅ **B3 Scope-Definition** (→ ADR-014)
2. ✅ **A1/A2 Tenant-Grenze & Datenklassen** (→ ADR-014) · offen: **C6 Multi-Tenancy-Mechanik**
3. **C2 Domänenmodell v1** ← als Nächstes vorgeschlagen
4. **C3 MVP-Schnitt** (inkl. A4) + **C4 Offline-Matrix**
5. **C5 fehlende Flows** (Onboarding/Auth/Ticket) — parallel planbar
6. **B2 SafeNow** + **C7** (kann warten, bis MVP-Scope steht)
7. **A3/C8 Design-System-Portierung** (begleitend, sobald Scaffolding startet)

> **Stand 2026-07-29:** Cluster 1 (Fundament) nach Team-Meeting entschieden → ADR-009 (Auth
> passwortlos), ADR-014 (Festival-Nav / Beitritt / Ticket / „wer ist hier" ohne GPS),
> ADR-016 (Identität) + `04-domain-identity.md`.
> **Cluster 2** (2026-07-29) entschieden → ADR-017 + `05-activities-social.md`: Aktivitäten
> (Tags global+festival, Klonen, Standort→Route), Timetable-Social (Act-Interest), Dashboard
> (Announcement-Hero, Cashless oben).
> **Cluster 3** (2026-07-29) entschieden → ADR-018 + `06-admin.md`: Admin zweistufig
> (Platform + Festival), eine Manager-Rolle, Staff-Login Passwort+OTP, Einladung per E-Mail,
> News im Festival + Admin-editierbar, Analytics vertagt.
> **Cluster 4** (2026-07-29) → ADR-019 + `07-lageplan.md`: Bild-Lageplan + DB-Marker-Typen.
> **Cluster 5** (2026-07-29) → ADR-020 + `08-scope-notes.md`: Hilfe-Börse (post-MVP),
> Aktivitäts-Lobby-Chat (kein 1:1-DM), User-Content ohne Übersetzung, **Light+Dark** beide.
> **→ Die Meeting-Runde ist durchgearbeitet.** Offen/zugewiesen: **Birgit** (Alter/Geschlecht/
> Safety-Konzept + Anmelde-Disclaimer, B2).
> **Onboarding-/Auth-Flow** ausgearbeitet → `09-onboarding-auth.md` (login-first, Avatar optional).
> **Nächster sinnvoller Schritt:** Offline-Matrix, oder Domänenmodell → `packages/contracts`+`db`,
> oder Scaffolding.
