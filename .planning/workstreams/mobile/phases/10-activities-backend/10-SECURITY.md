---
phase: 10
slug: activities-backend
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-15
---

# Phase 10 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Mobile-Client → `/api/v1/*` | Untrusted input; einzige Identitätsquelle ist das better-auth-Session-Cookie (globaler AuthGuard, SEC-01) | Session-Cookie, Aktivitäts-Payloads |
| API → Postgres | Tenant-Scoping in WHERE-Prädikaten und DB-Constraints (CHECKs, zusammengesetzte FKs, Trigger), nicht in JS-Filtern | Tenant-gescopte Zeilen |
| Festival A ↔ Festival B | Jede tenant-gescopte Zeile trägt `festivalId`; `activity_tag` ist die eine bewusste nullable-Ausnahme (ADR-017 §3) | Aktivitäten, Tags, Teilnahmen |
| Fremdprofil-Sichtbarkeit | Teilnehmerlisten laufen ausschließlich über `foreignProfileColumns`/`pickForeignProfile` (Sechs-Feld-Fremdsicht) | Profil-Teilmenge (6 Schlüssel) |
| Zukünftige Phasen ↔ Invarianten | `activity-tenant-structure.spec.ts` (Verbotslisten-Walk + `information_schema`) macht Verstöße späterer Phasen rot | Contract-/Schema-Struktur |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-10-01 | Information Disclosure | `ActivityService.listEffectiveTags` WHERE-Prädikat | high | mitigate | `effectiveTagWhere`: `or(isNull(activityTag.festivalId), eq(activityTag.festivalId, festivalId))` in SQL (activity.service.ts:154–157); Spec Fall 4 prüft serialisierten Body | closed |
| T-10-02 | Information Disclosure | Nullable `activity_tag.festivalId` | high | mitigate | Nullable-Zweig auf `isNull` beschränkt; eigener Test (activity-tags Spec Fall 4, activity-tenant-isolation.spec.ts) | closed |
| T-10-03 | Elevation of Privilege | `listActivityTags`-Handler | high | mitigate | `festivalId` nur aus `params`; kein Besucher-Identifier aus Body/Query (Contract-Walk in activity-tenant-structure.spec.ts Teil 2) | closed |
| T-10-04 | Information Disclosure | Existenz-Orakel über unbekanntes `festivalId` | low | accept | 200 mit `[]` statt 404 — siehe Accepted Risks R-10-1 | closed |
| T-10-05 | Tampering | Doppelter globaler Slug | medium | mitigate | Partieller Unique-Index `activity_tag_global_slug_unq` (activity-tag.ts:45) + `activity_tag_festival_slug_unq` | closed |
| T-10-06 | Denial of Service | Ungepaginierte Tag-Liste | low | accept | Kuratierter Katalog zweistelliger Größe — siehe Accepted Risks R-10-2 | closed |
| T-10-07 | Elevation of Privilege | `createActivity`-Handler | high | mitigate | `creatorId = session.user.id`, `festivalId` = Pfad (activity.controller.ts:23–31); `createActivityBodySchema` deklariert keinen der Schlüssel | closed |
| T-10-08 | Spoofing | Aktivität mit Fremd-Festival-Tag | high | mitigate | `isTagEffective` nutzt dasselbe Effektiv-Prädikat, gebunden ans Pfad-`festivalId` (activity.service.ts:170–181) | closed |
| T-10-09 | Information Disclosure | Existenz-Orakel über fremde/deaktivierte Tags | medium | mitigate | Beide Fälle liefern dieselbe 404 mit identischem Body (activity-create Spec Fall 4+5) | closed |
| T-10-10 | Tampering | Teilnehmerzeile mit fremdem `festivalId` | high | mitigate | Zusammengesetzter FK `activity_participant_activity_fk` auf `(activity.id, activity.festivalId)` (activity-participant.ts:35–38) | closed |
| T-10-11 | Tampering | Aktivität ohne Creator-Teilnehmerzeile | medium | mitigate | Beide Inserts in `db.transaction` (activity.service.ts:279) | closed |
| T-10-12 | Denial of Service | Unbegrenzte Freitextlängen | low | mitigate | Serverseitige Kappen title 80 / subtitle 120 / description 2000 / location 200 (schemas.ts:114–117) | closed |
| T-10-13 | Information Disclosure | Geo-Punkt als verdecktes Präsenzsignal | medium | mitigate | Einmalige optionale Punkt-Erfassung; `activity_geo_pair_chk` + `activity_geo_range_chk` (activity.ts:78–82); kein Watcher/Update-Endpunkt; UAT P2 bestätigt | closed |
| T-10-14 | Tampering | Nebenläufige Beitritte auf den letzten Platz | high | mitigate | `SELECT ... FOR UPDATE` im `BEFORE INSERT`-Trigger (drizzle/0010_activity_capacity_guard.sql); DB-Ebene ≥10 Runden, HTTP ≥5 Runden (activity-capacity-db.spec.ts) | closed |
| T-10-15 | Tampering | Creator verlässt eigene Aktivität | high | mitigate | `leave` antwortet dem Creator 409, Zeile bleibt (activity.service.ts:398 `status: 'creator'`); Ausweg ist expliziter Delete (D-09) | closed |
| T-10-16 | Elevation of Privilege | Fremde Aktivität auflösen | high | mitigate | `remove` vergleicht `creatorId` gegen `session.user.id`, sonst 409 (activity.service.ts:419–424) | closed |
| T-10-17 | Elevation of Privilege | Beitritt zu Aktivität eines fremden Festivals | high | mitigate | Alle drei Abfragen filtern auf `id` UND `festivalId` (activity-join-leave Spec Fall 6+10) | closed |
| T-10-18 | Denial of Service | Wiederholter Beitritt an voller Aktivität | medium | mitigate | Trigger lässt bestehende Teilnahme durch; `onConflictDoNothing()` (activity.service.ts:362) | closed |
| T-10-19 | Repudiation | Auflösen hinterlässt keine Spur | low | accept | Kein Audit-Log in v1.1 — siehe Accepted Risks R-10-3 | closed |
| T-10-20 | Information Disclosure | Zeitpunktprüfung gegen Client-Angabe | medium | mitigate | Vergleich serverseitig gegen DB-Zeit: `sql\`now() >= start_time\`` (activity.service.ts:350, 554) | closed |
| T-10-21 | Information Disclosure | Teilnehmerliste im Detail (VIS-02) | high | mitigate | `{ profile: pickForeignProfile }` über `foreignProfileColumns` (activity.service.ts:635–644); Schlüsselgleichheit in projection-uniqueness.spec.ts + activity-discovery Fall 4; UAT P3 bestätigt | closed |
| T-10-22 | Information Disclosure | Namen in der Listenantwort | medium | mitigate | `activitySummarySchema` ohne `participants`-Schlüssel; Abwesenheit von `username`/`displayName` am serialisierten Listen-Body (Spec Fall 3, D-12) | closed |
| T-10-23 | Information Disclosure | Fremd-Festival-Aktivitäten in Liste/Detail | high | mitigate | Listen + Detail filtern auf `festivalId`; Spec Fall 8 prüft `id` UND Titel im Body | closed |
| T-10-24 | Elevation of Privilege | Teilnahmeliste einer fremden Person | high | mitigate | `my-activities` nimmt keinen Besucher-Parameter; Aufrufer = `session.user.id` (activity.controller.ts:120) | closed |
| T-10-25 | Information Disclosure | Präsenz-/Ortssignal aus Aktivitätsdaten | medium | mitigate | Kein Endpunkt gibt aus, wer gerade wo ist; `joined` = Absichtserklärung; UAT P2 bestätigt (ADR-014 vs. ADR-017 §2) | closed |
| T-10-26 | Denial of Service | Ungepaginierte Aktivitätenliste | low | accept | Bewusste v1.1-Entscheidung — siehe Accepted Risks R-10-4 | closed |
| T-10-27 | Information Disclosure | Existenz-Orakel über unbekanntes `festivalId` (Listen) | low | accept | 200 mit `[]` — siehe Accepted Risks R-10-1 | closed |
| T-10-28 | Information Disclosure | Cross-Tenant-Leck über neue Flächen | high | mitigate | Nachweis pro Tabelle über serialisierten Antwortkörper mit Nicht-Vakuum-Gegenprobe (activity-tenant-isolation.spec.ts) | closed |
| T-10-29 | Information Disclosure | Nullable `festival_id` wird Generalausnahme | high | mitigate | Eigener `describe`-Block mit drei Teilfällen; strukturell als *ausdrücklich nullable* festgeschrieben (activity-tenant-structure.spec.ts Teil 1) | closed |
| T-10-30 | Elevation of Privilege | Spätere Route mit client-gesetztem Scope | high | mitigate | Contract-Walk über Verbotsliste (visitorId/creatorId/callerId/accountId/userId/participantId/festivalId/activityId/sessionId) mit Auslöse-Gegenprobe (Teil 2); UAT P1 bestätigt | closed |
| T-10-31 | Tampering | Spätere Tabelle ohne Mandantenspalte | high | mitigate | `information_schema`-Prüfung mit benannten, begründeten Ausnahmen (activity-tenant-structure.spec.ts Teil 1) | closed |
| T-10-32 | Repudiation | SEC-03 ohne dokumentierte Belegkette | medium | mitigate | Traceability-Zeile nennt beide Spec-Dateien; Werkzeugfehler im Workstream-Layout als Grund für Handarbeit vermerkt (10-05-SUMMARY.md) | closed |
| T-10-SC | Tampering | npm/pnpm-Installationen (alle 5 Pläne) | low | accept | Kein neues Paket in Phase 10 installiert — siehe Accepted Risks R-10-5 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-10-1 | T-10-04, T-10-27 | Routen antworten 200 mit `[]` statt 404 auf unbekanntes `festivalId` — bestätigen weder Existenz noch Nichtexistenz; gleiche Haltung wie `friendsInFestival` | Plan 10-01/10-04 (register, plan-time) | 2026-08-15 |
| R-10-2 | T-10-06 | v1.1 hat einen kuratierten Tag-Katalog zweistelliger Größe (D-06); Pagination bewusst vertagt (CONTEXT.md §Deferred), additiv nachrüstbar | Plan 10-01 (register, plan-time) | 2026-08-15 |
| R-10-3 | T-10-19 | v1.1 führt kein Audit-Log; Delete ist creator-gebunden und in der Wirkung sichtbar. Audit-Trail wäre ein eigenes, phasenübergreifendes Thema | Plan 10-03 (register, plan-time) | 2026-08-15 |
| R-10-4 | T-10-26 | Ungepaginierte Aktivitätenliste ist bewusste v1.1-Entscheidung; Index `activity_festival_start_idx` trägt Filter und Sortierung; Pagination additiv nachrüstbar | Plan 10-04 (register, plan-time) | 2026-08-15 |
| R-10-5 | T-10-SC | Phase 10 installiert kein neues npm/pnpm-Paket; das manuelle Paket-Legitimitäts-Gate aus Phase 8 bleibt für künftige Installationen bestehen | Pläne 10-01…10-05 (register, plan-time) | 2026-08-15 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-15 | 32 | 32 | 0 | /gsd-secure-phase (L1 grep-depth, short-circuit: register plan-authored, threats_open 0, ASVS L1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-15
