# 08 — Scope-Notizen (Cluster 5)

> **Zweck:** Kleinere, aber verbindliche Scope-Klarstellungen aus dem Team-Meeting. Verbindlich
> als **ADR-020** (+ Berührungen zu ADR-012/015/017). Stand: 2026-07-29.

---

## 1. Tauschbörse → Hilfe-/Leih-Börse (post-MVP)

- **Umdeutung:** kein Handel/Verkauf/Bezahlen, sondern **biete/suche Hilfe** (Werkzeug leihen:
  Hammer, Schere …). „Nichts mit Pauscheln."
- **Nicht im MVP:** kein Tausch-Tab; stattdessen sind **Aktivitäten** und **Friends** getrennte
  Tabs (ADR-014). Bleibt langfristiger Differenzierer.
- **Spätere Form (Annahme):** festival-scoped **„Angebot | Gesuch"-Board** — Eintrag mit
  Beschreibung, **ohne Geld**. Wird bei Aktivierung als eigene Entität ausgearbeitet.

## 2. Chat: keine 1:1-DMs, aber Aktivitäts-Lobbies

- **Kein** normaler 1:1-/DM-Chat zwischen Usern/Freunden.
- **Aber:** **Gruppen-Chat-Lobby pro Aktivität** für **beigetretene** Teilnehmer
  (`ActivityMessage`, ADR-017, über WebSocket-Gateway ADR-010).
- Kontakt **außerhalb** einer Aktivität → **Profil-Socials** (Sichtbarkeit jeder/Friends, ADR-016).
- **Folge:** Realtime-Scope umfasst Aktivitäts-Lobbies (nicht nur Präsenz/Live-Daten).

## 3. User-Content ohne Übersetzung

- **User-generierter Content** (z. B. Aktivitäts-Titel/-Beschreibung) wird **nicht übersetzt** —
  auch **nicht automatisch/per AI**.
- Übersetzung (Lingui-UI + Übersetzungstabellen) gilt nur für **kuratierten** Content (News,
  Timetable). Präzisiert **ADR-012**. **Kein Disclaimer** nötig.

## 4. Light + Dark Mode (beide)

- Die App unterstützt **beide** Modi vollwertig: **System-Folge + manueller Umschalter**
  (nicht nur dark-first). Aktualisiert **ADR-015** / `03` §2.
- **Navigations-Kontraste** müssen in *beiden* Modi WCAG erfüllen; die Nav trägt **keine**
  Markenfarbfläche (der im Meeting bemängelte unlesbare „Home"-Text darf nicht auftreten).

---

## 5. Offen / zugewiesen (keine ADR)

- **Birgit (nächstes Meeting):** Alter/Geschlecht/Flinta-Filter **+** Safety-/Jugendschutz-Konzept
  (**Disclaimer bei Anmeldung**, SafeNow nur *empfehlen*, rechtliche Absicherung). Siehe `02` B2.
