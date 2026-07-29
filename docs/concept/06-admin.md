# 06 — Admin: Platform- & Festival-Ebene (Cluster 3)

> **Zweck:** Die **zweistufige Admin-Struktur** (wir vs. Festival-Personal), Rollen, Login und
> der Editier-Scope pro Festival. Ergebnis von **Cluster 3** nach dem Team-Meeting. Verbindlich
> als **ADR-018** (erweitert ADR-003). Stand: 2026-07-29. Noch kein Code.

---

## 1. Zwei Ebenen — ein Admin

Ein **Next.js-Admin** (ADR-003), Login über `Account` (ADR-009), Zugriff **rollenbasiert**.

| Ebene | Wer | Kann |
|---|---|---|
| **Platform-Admin** (`PlatformAdmin`) | nur wir | Festivals anlegen · Staff einladen · **globaler Tag-Katalog** · festivalübergreifende Insights · **alles, was ein Festival-Admin kann — für jedes Festival** |
| **Festival-Admin** (`FestivalStaff`) | Festival-Personal | verwaltet **sein** Festival (Scope §3) |

- **Tenant-Workspace:** Festival auswählen → alle Aktionen laufen tenant-gescopt. better-auth
  „Organizations = Festivals" greift hier (ADR-009).
- Der **Platform-Admin ist ein Superset** — im Support kein Sonderfall, er kann in jedes Festival.

---

## 2. Login (Admin/Staff)

- **E-Mail + Passwort *und* OTP** — beides möglich (ADR-009). Passwort = optionale Credential am
  `Account`, primär für den bequemen Desktop-Login; OTP als passwortloser Fallback.
- **App-Nutzer (Visitor) bleiben OTP-only** — der Unterschied liegt am Kontotyp, nicht am System.

---

## 3. Festival-Admin — Editier-Scope

| Bereich | Inhalt | Bezug |
|---|---|---|
| **Branding/Stammdaten** | Name, Logo, **4 CI-Farben** (+ Kontrast-Check), allg. Infos, Social Media | ADR-015 |
| **Cashless** | Cashless-Link + iframe-Vorschau | ADR-011 |
| **Timetable** | Stages + Acts anlegen/bearbeiten | ADR-017 (Acts) |
| **Lageplan** | Bild-Upload (+ Marker, Detail Cluster 4) | — |
| **Aktivitäts-Tags** | globale aus-/abwählen + eigene anlegen | ADR-017 |
| **Announcements** | Dashboard-Hero setzen/planen | ADR-017 |
| **News/Blog** | Artikel anlegen/bearbeiten (im App-Festival sichtbar) | — |
| **Analytics** | User-Zahl, Nutzung, angelegte Events | **vertagt** (Platzhalter) |

---

## 4. Rollen

- **MVP: eine Rolle „Festival-Manager"** — darf alles fürs Festival.
- Das `role[]`-Modell (ADR-016) ist so gebaut, dass **granulare Rollen** (nur News, nur
  Event-Moderation) später **ohne Migration** dazukommen (Meeting: 2027/28).

---

## 5. Einladungs-Flow

1. **Platform-Admin** legt ein Festival an und **lädt Staff per E-Mail** ein.
2. Der Eingeladene bekommt einen `Account` (OTP oder Passwort setzen) + eine
   **`FestivalStaff`-Rolle** am jeweiligen Festival.
3. Danach: tenant-gescopter Zugriff auf genau dieses Festival.

---

## 6. News — Zusammenspiel App ↔ Admin

- **News ist festival-scoped Content:** im **App-Festival sichtbar** (Dashboard + eigener
  News-Bereich) **und** im **Admin editierbar**.
- Die operative Frage „*wer* pflegt News während des Festivals" ist ein Betriebsthema, kein
  technisches — die Fähigkeit existiert, die Besetzung klärt das Team.

---

## 7. Offene Punkte / später

- **Analytics/KPIs** konkret definieren (welche Kennzahlen, Zeiträume) — vertagt.
- **Granulare Rollen** (News-only, Event-Moderation) — 2027/28.
- **Startbestückung des globalen Tag-Katalogs** — beim Aufbau festlegen.
- **Audit-Log / Change-History** im Admin — später erwägen.
