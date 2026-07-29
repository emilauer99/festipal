# 04 — Identität, Profil & Festival-Beitritt (C2a)

> **Zweck:** Der erste Domänen-Entwurf für **Wer ist der Nutzer**, **wie loggt er sich ein**,
> **wie tritt er einem Festival bei** und **welche Daten hängen global vs. pro Festival**.
> Ergebnis von **Cluster 1 (Fundament)** nach dem Team-Meeting. Verbindlich als **ADR-009**
> (Auth), **ADR-014** (Beitritt/Nav/„wer ist hier") und **ADR-016** (Identitätsmodell).
> Stand: 2026-07-29. Noch kein Code — Grundlage für `packages/contracts` + `packages/db`.

---

## 1. Grundprinzip: ein `Account`, mehrere Rollen

Alle Menschen, die sich einloggen — **Festivalbesucher, Festival-Personal, wir selbst** —
teilen sich **eine Login-Basis**. Die typ-spezifischen Daten hängen als getrennte Profile dran.

```
Account (email verifiziert, OTP-Login)
├─ VisitorProfile?     ← nur Festivalbesucher (App-Nutzer)
├─ FestivalStaff[]     ← Rolle(n) je Festival (Admin-Seite)
└─ PlatformAdmin?      ← nur wir (Super-Admin)
```

Ein Account kann **mehreres gleichzeitig** sein (z. B. Besucher *und* Staff). Ein reiner
Staff-Account hat **keinen** `username`/`avatar` — diese Felder sind Besucher-spezifisch.

---

## 2. `Account` — gemeinsame Basis

| Feld | Typ | Anmerkung |
|---|---|---|
| `id` | uuid | PK |
| `email` | string, **unique, verifiziert** | Identifier für *jeden* Login-Typ; Einladungen; später Newsletter |
| `createdAt` / `updatedAt` | timestamp | — |

- **Login = passwortloses E-Mail-OTP** (ADR-009): E-Mail → 6-stelliger Code → eingeloggt. Kein
  Passwort gespeichert. E-Mail ist durch den Code inhärent verifiziert.
- **SSO (Google/Apple) → 2027:** account-linking-fähig halten, ohne jetzt zu bauen.

---

## 3. `VisitorProfile` — Festivalbesucher (App-Nutzer)

1:1 optional am `Account`. Wird beim **Erst-Login** vervollständigt.

| Feld | Pflicht | Typ | Zweck |
|---|---|---|---|
| `username` | ✅ | string, **unique** | Leute suchen / als Freund adden / teilen — „vergisst man nicht" |
| `displayName` | ✅ | string | Anzeigename / „wie du angesprochen werden willst" (≠ echter Vorname) |
| `avatar` | ✅ | Bild | **Upload *oder* Kamera** (beides erlaubt) |
| `socials[]` | – | `{platform, handle}` | Insta / Snap / TikTok / … beliebig erweiterbar |
| `socialsVisibility` | ✅ | `everyone` \| `friends` | Wer meine Socials sieht |
| `birthDate?` / `gender?` | **OFFEN** | — | → Birgits Safety-/Jugendschutz-Konzept; **nicht** finalisiert, migrationssicher offen |

**Statt In-App-Chat:** Kontaktaufnahme läuft über die verlinkten **Socials** (ADR-Scope,
Cluster 5). Kein eigener Chat im MVP.

---

## 4. `FestivalStaff` & `PlatformAdmin` — Admin-Seite

| Entity | Felder | Zweck |
|---|---|---|
| `FestivalStaff` | `accountId` + `festivalId` + `role[]` | Festival-Personal verwaltet *sein* Festival (Timetable, Lageplan, Tags, Cashless-Link, …) |
| `PlatformAdmin` | `accountId` + Super-Admin-Rolle | nur wir: Festivals anlegen, alles übergreifend |

- Hier — und **nur hier** — greift better-auth **„Organizations = Festivals"** (ADR-009).
- Granulare Rollen (nur News, nur Event-Moderation) sind eine **spätere** Stufe (Cluster 3).

---

## 5. Festival-Beitritt (ohne Ticket-Gate)

Ticket & Band sind **kein** Zugangsmittel mehr. Beitritt ist **gate-los**:

| Entity | Felder | Bedeutung |
|---|---|---|
| `MyFestival` | `visitorId` + `festivalId` + `savedAt`, optional `camp` (Text) | „gespeichertes Festival" (= *Meine Festivals*). `camp` ist manueller Text, kein Ortungswert |

- **Speichern** aus „Alle" (Discovery), geteiltem Link oder QR → landet in „Meine Festivals".
- **„Festival betreten"** = ein (gespeichertes *oder* durchstöbertes) Festival öffnen → Tenant-
  Kontext (ADR-014). Keine Prüfung, kein Ticket.
- Fassade-Tab **„Festivals"**: Segment **„Meine / Alle"**, Default *Meine*.

---

## 6. `FestivalTicket` — Ticket als Anzeige-Feature

Optional, **pro Nutzer pro Festival**. Reine Darstellung, **kein** Bezahl-/Beitritts-Gate,
getrennt von Cashless (ADR-011).

| Feld | Typ | Anmerkung |
|---|---|---|
| `visitorId` + `festivalId` | — | Zuordnung |
| `code` / `payload` | string | QR-/Barcode-Wert |
| `image?` | Bild | falls als Bild hochgeladen |
| `label?` | string | z. B. „Weekend-Ticket" |

- **Einspielung durch den Nutzer:** QR/Barcode **scannen** · Code **einfügen** · Bild **hochladen**.
- **Offline-fähig** (ADR-007) — der QR muss ohne Netz am Einlass funktionieren.
- Echte Ticketing-Anbieter-Integration = spätere Stufe.

---

## 7. „Wer ist hier" — ohne Standort (MVP)

- **Definition:** eigene **Freunde, die dasselbe Festival gespeichert haben** (`MyFestival` ∩
  Freundes-Graph). **Kein GPS**, keine Standorterlaubnis, keine Präsenz-Retention.
- „Crew" ist nur der *interne* Name dieser Schnittmenge — **als UI-Label entfällt es** (heißt
  „Friends"). Der Festival-`Friends`-Tab zeigt diese Freunde.
- **Spätere Ausbaustufe (post-MVP):** interaktiver Lageplan mit **opt-in Standort-Sharing →
  Freunde auf der Karte**. Erst dann kommen Standort-Feld, Sichtbarkeits- und Retention-Regeln
  dazu. Das Modell wird so gebaut, dass das **ohne Migration** nachrüstbar ist.

---

## 8. Scoping-Übersicht (global vs. festival-scoped)

| User-global | Festival-scoped (`festivalId`) |
|---|---|
| `Account`, `VisitorProfile` | `MyFestival` (gespeichert) |
| Freundschaften | `FestivalTicket` (Anzeige) |
| `PlatformAdmin` | `FestivalStaff` (Rolle) |
| — | Aktivitäten, Timetable, Lageplan, News, Vendors (Cluster 2+) |

→ Jede festival-scoped Tabelle trägt `festivalId` + Tenant-Guard (ADR-014). App-Nutzer sind
**global** und keine Org-Member (ADR-009).

---

## 9. Offene Punkte (bewusst nicht entschieden)

1. **`birthDate` / `gender` / Flinta-Filter** → Birgit pitcht ein Safety-/Jugendschutz-Konzept
   (nächstes Meeting). Bis dahin nicht im Pflichtfeld-Set, migrationssicher offen.
2. **Disclaimer bei Anmeldung** (Jugendschutz/Recht) — Teil des Safety-Konzepts, Cluster „offen".
3. **Ticketing-Anbieter-Integration** — später, nur wenn ein Partner es anbietet.
