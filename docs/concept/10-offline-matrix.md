# 10 — Offline-Matrix (Cluster: Offline)

> **Zweck:** Konkretisiert **ADR-007** (Offline-first): pro Bereich was **offline-kritisch**,
> **Cache** oder **online** ist, der **Mutation-Queue**-Umfang, die **Prefetch**-Strategie und die
> **Offline-UX**. Grundlage: TanStack Query (persistiert, SQLite/MMKV) + kleine Mutation-Queue,
> **kein** bidirektionaler Sync-Engine. Stand: 2026-07-29. Noch kein Code.

---

## 1. Matrix

| Bereich | Offline-Verhalten | Klasse |
|---|---|---|
| **Ticket-QR** | voll offline anzeigbar (Einlass ohne Netz) | 🔴 offline-kritisch |
| **Timetable** | voll gecached; eigene Likes offline setzbar (Queue) | 🔴 offline-kritisch |
| **Lageplan** | Bild + Marker gecached; „Route" braucht externe Maps | 🔴 offline-kritisch |
| **Meine Festivals** | gecached, offline sichtbar | 🔴 offline-kritisch |
| **Dashboard** | gecachter Snapshot (Announcement / Now-Playing / News) | 🟡 Cache |
| **News** | gecached (read) | 🟡 Cache |
| **Aktivitäten-Liste** | gecached (read) | 🟡 Cache |
| **Friends-Liste** | gecached (read) | 🟡 Cache |
| **Profil ansehen** | gecached | 🟡 Cache |
| **Alle Festivals (Discovery)** | letzter Stand gecached; Suche braucht Netz | 🟡 Cache |
| **Aktivität anlegen / Beitreten** | **online** (Kapazität serverseitig prüfen) | 🟢 online |
| **Lobby-Chat senden** | **online** (Realtime); History offline lesbar | 🟢 online |
| **Friend adden / annehmen** | **online** | 🟢 online |
| **Cashless** | **online** (WebView auf externe URL) | 🟢 online |
| **Login / OTP** | **online**; Session hält offline | 🟢 online |

---

## 2. Mutation-Queue (Offline-Writes → bei Reconnect abgearbeitet)

- **Merken** (Festival speichern/entfernen)
- **ActInterest** (Act liken/entliken)
- **Profil-Feld-Änderungen**
- **Ticket lokal hinzufügen** (Payload lokal gespeichert, Upload bei Reconnect)

> Alles andere Schreibende ist **online** (Kapazität/Realtime/Validierung nötig). Ersetzt die
> veraltete ADR-007-Formulierung „Favoriten, Tauschbörsen-Entwurf" (Tausch ist post-MVP).

---

## 3. Prefetch-Strategie

- **Beim Speichern eines Festivals** wird sein **Offline-Bundle** vorgeladen:
  **Timetable · Lageplan (Bild + Marker) · Festival-Meta · letzte News**.
- So funktioniert das Wichtige am Gelände ohne Netz, ohne dass der Nutzer manuell laden muss.
- Aktualisierung: Refetch bei Reconnect / Push; das Bundle bleibt persistiert.

---

## 4. Offline-UX

- **Expliziter Offline-Zustand** (Banner: „offline — zeigt gespeicherten Stand").
- **Stale-Kennzeichnung** bei veralteten Daten.
- **Queue-Status** je Aktion („wird gesendet, sobald online").
- Online-only-Aktionen (Beitreten, Lobby, Cashless) sind offline **klar deaktiviert** mit Hinweis.

---

## 5. Offen / später

- **Prefetch-Budget** (max. Bildgröße / Speicher pro Festival) beim Bau festlegen.
- **Offline-Draft** für Aktivität anlegen — bewusst nicht im MVP (Kapazität braucht Server).
- **Cache-Invalidierung / TTL** pro Datentyp beim `packages/db`-Setup verfeinern.
