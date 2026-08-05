# festipal — App-Konzept (aus Claude Design abgeleitet)

Dieser Ordner arbeitet den **kompletten App-Konzept** aus, bevor eine Zeile Produktionscode
entsteht. Grundlage ist der erste Designentwurf aus Claude Design
(„Festipal App Screens", 13 Screens).

## Arbeitsweise

Wir stimmen das Konzept **Schritt für Schritt** ab. Nichts hier ist final, solange es nicht
als ADR in [`../DEVELOPMENT_DECISIONS.md`](../DEVELOPMENT_DECISIONS.md) steht. Ablauf:

1. **Analyse** (faktisch, keine Entscheidungen) → `01-design-analysis.md`
2. **Offene Fragen & Spannungen** identifizieren → `02-open-questions.md`
3. Pro Themenbereich gemeinsam entscheiden → jeweils eigenes `NN-*.md`, Ergebnis als ADR
4. Erst wenn das Konzept steht: Scaffolding + Implementierung

## Dokumente

| # | Datei | Inhalt | Status |
|---|---|---|---|
| 01 | `01-design-analysis.md` | Präzise Extraktion des Designs: Screens, Navigation, Domänenmodell, Design-System, Interaktionsmuster | ✅ Entwurf |
| 02 | `02-open-questions.md` | Abgeleitete Konzept-Bereiche, Widersprüche zu bestehenden ADRs, Reihenfolge der Abstimmung + **Abstimmungs-Log** | ✅ laufend |
| 03 | `03-design-system.md` | Design-System-Fundament aus dem Brand Guide: Tokens, Voice/Tone, Theming-Vertrag (→ ADR-015) | ✅ Entwurf |
| 04 | `04-domain-identity.md` | Identität & Profil (Account → Visitor/Staff/Admin), Festival-Beitritt, Ticket-Anzeige, „wer ist hier" — Cluster 1 (→ ADR-009/014/016) | ✅ Entwurf |
| 05 | `05-activities-social.md` | Aktivitäten (Tags global+festival, Klonen), Timetable-Social, Dashboard — Cluster 2 (→ ADR-017) | ✅ Entwurf |
| 06 | `06-admin.md` | Admin zweistufig (Platform + Festival), Rollen, Tenant-Workspace, Einladung, Login-Methoden — Cluster 3 (→ ADR-018) | ✅ Entwurf |
| 07 | `07-lageplan.md` | Lageplan-MVP (Bild + DB-Marker-Typen mit Icon-String), Route via Geo, offline — Cluster 4 (→ ADR-019) | ✅ Entwurf |
| 08 | `08-scope-notes.md` | Hilfe-Börse (post-MVP), Aktivitäts-Lobby-Chat (kein 1:1-DM), User-Content ohne Übersetzung, Light+Dark — Cluster 5 (→ ADR-020) | ✅ Entwurf |
| 09 | `09-onboarding-auth.md` | Onboarding & Auth: login-first, Visitor-OTP + Profil, Staff Passwort+OTP, Einladung, Session (→ ADR-009/016) | ✅ Entwurf |
| 10 | `10-offline-matrix.md` | Offline-Matrix (offline-kritisch/Cache/online), Mutation-Queue, Prefetch-Bundle, Offline-UX (→ ADR-007) | ✅ Entwurf |
| … | (folgen beim Durcharbeiten) | Domänenmodell → contracts/db, Safety/Recht (Birgit), … | offen |

## Screen-Designs

Aus Claude Design abgeleitete Screen-Entwürfe (Referenz, gegen die gebaut wird — Prinzip 5):

| Bereich | Ordner | Screens |
|---|---|---|
| Onboarding & Auth (Visitor) | [`designs/auth/`](designs/auth/) | Welcome · E-Mail · Code · Profil (8 Frames, dark+light) — siehe [Doc 09](09-onboarding-auth.md) |

`preview.html` im jeweiligen Ordner öffnen (self-contained). Rohexport unter `source/`.

## Abstimmungs-Stand (Kurz)

| Bereich | Ergebnis | ADR |
|---|---|---|
| B1 Cashless | strikt eingebetteter Link, kein Wallet | ADR-011 |
| A1/A2/B3 Tenant-Grenze & Datenklassen | Global↔Festival; Freundschaft global, Präsenz festival-scoped | ADR-014 |
| MVP-Scope | Fassade = Festivals·Friends·Profil; Artists/SafeNow/Wallet raus | ADR-014 |
| A3 Design-System | Brand Guide als Fundament; Theming = 4 Farben + Logo + Name | ADR-015 |
| B2 SafeNow | zurückgestellt (Meeting: Recht/Jugendschutz → Birgit) | — |
| A4 MVP-Schnitt | bestätigt (Fundament → Read-only-Kern → Differenzierer → Integrationen) | — |
| **C1** Auth passwortlos | E-Mail-OTP, E-Mail-Verifizierung, SSO→2027, App-User vs. Staff-Org | ADR-009 |
| **C1** Festival-Nav/Beitritt/Ticket | 5 Tabs; gate-loser Beitritt; Ticket = Anzeige-QR; „wer ist hier" ohne GPS | ADR-014 |
| **C2a** Identität & Profil | Account → Visitor/Staff/Admin; Ticket/Band raus (Ticket nur Anzeige) | ADR-016 |
| **C2** Aktivitäten/Timetable/Dashboard | Tags global+festival, Klonen, Standort→Route, Act-Interest, Announcement-Hero | ADR-017 |
| **C3** Admin zweistufig | Platform + Festival-Admin, eine Manager-Rolle (granular später), Staff-Login Passwort+OTP, Einladung per E-Mail | ADR-018 |
| **C4** Lageplan-MVP | Bild-Upload + Admin-Marker (Typen in DB, Icon-String), Route via Geo/externe Maps, offline; MapLibre später | ADR-019 |
| **C5** Scope-Notizen | Hilfe-Börse post-MVP; Aktivitäts-Lobby-Chat (kein 1:1-DM); User-Content nicht übersetzt; **Light+Dark** beide | ADR-020 |
| **Flows** Onboarding/Auth | **login-first**; Visitor-OTP + Profil (username/displayName Pflicht, **Avatar optional**); Staff Passwort+OTP; Einladung/Reset | ADR-009/016 |
| **Offline** Matrix | Ticket/Timetable/Lageplan/Meine Festivals offline; Queue (Merken/Like/Profil/Ticket); Prefetch beim Speichern | ADR-007 |

## Quelle

- Claude-Design-Projekt: `Festipal App Screens.dc.html`
- Importierte Dateien: `festipal-screens.jsx` (Daten + 13 Screens + Shell),
  `festipal-ds.js` (Design-System-Bundle, 31 Komponenten), `festipal-tokens.css` (Tokens),
  `vendor/lucide.js` (Icons), `support.js` (Canvas-Runtime)
- Der Entwurf ist **dark-first**, mobil (Designbreite 430 px), deutschsprachige Copy,
  fiktives Beispiel-Festival „Nova Rise".
