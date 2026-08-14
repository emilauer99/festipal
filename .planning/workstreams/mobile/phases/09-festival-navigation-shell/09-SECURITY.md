---
phase: 09
slug: festival-navigation-shell
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-15
---

# Phase 09 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register-Herkunft: alle 7 Pläne (09-01 … 09-07) enthielten zur Planzeit einen
> `<threat_model>`-Block (`register_authored_at_plan_time: true`). Klassifikation nach der
> L1-Short-Circuit-Regel (grep-Tiefe): Mitigations gegen Code, Test-Specs und die
> Geräte-UAT-Runden 1+2 geprüft; kein Auditor-Spawn erforderlich.
>
> Hinweis: Die IDs T-09-25/26/27 wurden von 09-06 und 09-07 doppelt vergeben (unabhängige
> Threats). Im Register unten sind sie über die Plan-Angabe in der Component-Spalte eindeutig.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| externer Deep Link / Dev-Client-Launch-URL → Expo-Router-Linking | von außen gesetzte URL entscheidet, welcher Screen mountet | Routen-/Tooling-URLs |
| HTTP-Client → `:festivalId`-Pfadparameter | untrusted Eingabe bestimmt den Mandantenscope | Festival-UUID |
| Session-Cookie → `session.user.id` | einzige zugelassene Quelle der Aufruferidentität | Identität |
| `visitor_profile` / `my_festival` → Response-Body | Owner-Felder und Mandanten-Beziehungswerte dürfen die Fremd-View nie verlassen | Profil-/Beziehungsdaten |
| `:festivalSlug` (Deep Link / Cold Start / MMKV) → Gate-Abfrage | untrusted bzw. persistierte Eingabe entscheidet, welcher Mandant lädt | Festival-Slug |
| Auth-Guard-Zustand → sichtbare Chrome (Header, native Leisten) | Chrome mit Kontodaten darf nur authentifiziert erscheinen | Kontoanzeige |
| React-Query-Cache (`['me']`, Friends-Keys) → UI | zwischengespeicherte Kontodaten dürfen einen Kontowechsel nicht überleben | Profil-/Freundesdaten |
| npm-Registry → `node_modules` / natives APK | fremder (auch nativer) Code landet in der App | Code (Supply Chain) |
| `festival.cashlessUrl` (Serverwert) / Routenparameter → WebView | DB-Wert bzw. veränderbarer Parameter steuert, was die App lädt | URL |
| eingebettete Fremdseite → App | fremdes Web-Dokument läuft im Prozess der App | Web-Inhalt |
| UI-Beschriftung → behauptete Fähigkeit | ein Label darf keine Daten behaupten, die es nicht gibt (NAV-02, ADR-014) | — |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-09-01 | Denial of Service | 09-01: Expo-Router-Linking-Map nach dem Rename | high | mitigate | Harter Rename ohne Alias (D-19), genau eine Datei pro Route; node-env-Href-Tests + Gerätechecks (UAT R1) | closed |
| T-09-02 | Tampering | 09-01: Deep-Link-Capture in `app/_layout.tsx` | medium | mitigate | `lib/deep-link.ts` unverändert: `isIgnorableDeepLinkRoute` + `AUTH_FLOW_PATHS` weiterhin vorhanden (grep-verifiziert) | closed |
| T-09-03 | Information Disclosure | 09-01: Lingui-Katalog | low | accept | Navigationslabel ohne Nutzerdaten → Accepted Risks Log | closed |
| T-09-04 | Information Disclosure | 09-02: `listFriendsInFestival` Join-Bedingung | high | mitigate | `callerId` nur aus `session.user.id`, `festivalId` nur aus dem Pfad; `apps/api/test/festival-friends-isolation.spec.ts` (Cross-Tenant- + Fremde-Sicht-Fall) | closed |
| T-09-05 | Information Disclosure | 09-02: Fremd-View-Projektion | high | mitigate | `select` nur über `foreignProfileColumns` / `pickForeignProfile`; `apps/api/test/projection-uniqueness.spec.ts` + Feld-Absenz-Assertions | closed |
| T-09-06 | Information Disclosure | 09-02: `my_festival`-Zeitstempel als Ankunftssignal | medium | mitigate | Keine Spalte aus `my_festival` selektiert — Tabelle ist reiner Filter; Feld-Absenz-Assertion im Spec | closed |
| T-09-07 | Spoofing | 09-02: Enumeration über `:festivalId` | low | accept | `200 []` statt 404, kein Existenz-Orakel; Antwort enthält nur EIGENE Freunde → Accepted Risks Log (09-02-SUMMARY) | closed |
| T-09-08 | Elevation of Privilege | 09-02: fehlende Authentifizierung | high | mitigate | Kein `@AllowAnonymous` am Handler (grep: nur Health-Controller trägt es); globaler AuthGuard SEC-01; 401-Testfall im Spec | closed |
| T-09-09 | Information Disclosure | 09-03: Festival-Tab-Bereich ohne aufgelöstes Festival | medium | mitigate | D-10-Gate auf Layout-Ebene VOR dem Navigator; Gerätechecks (09-03, UAT R1) | closed |
| T-09-10 | Denial of Service | 09-03: veralteter persistierter Festival-Slug | medium | mitigate | `clearActiveFestivalSlug` feuert nur beim 404 genau des persistierten Slugs | closed |
| T-09-11 | Spoofing | 09-03: Routenkonflikt `[festivalSlug].tsx` vs. `[festivalSlug]/` | medium | mitigate | `git mv` statt Kopie; Abwesenheit als Akzeptanzkriterium geprüft (Phase-5-Lehre) | closed |
| T-09-12 | Information Disclosure | 09-03: Platzhalter-Tabs | low | accept | Kein Fetch, keine Mandanten-Props, keine Datenquelle → Accepted Risks Log | closed |
| T-09-13 | Information Disclosure | 09-04: `AppHeader` über unauthentifiziertem Screen | high | mitigate | `resolveHeaderContext` fail-closed für unbekannte Segmente/Guard-Gruppen/Wurzel; `apps/mobile/lib/__tests__/app-chrome.test.ts` + Gerätecheck 9 | closed |
| T-09-14 | Information Disclosure | 09-04: gecachte Kontodaten nach Kontowechsel | medium | mitigate | Header liest nur den geteilten `['me']`-Eintrag; bestehender `cancelQueries`+`clear`-Reset beim Übergang nach `unauthenticated` deckt ihn ab | closed |
| T-09-15 | Spoofing | 09-04: Route-zu-Titel-Zuordnung (Push) | low | accept | Kompilierte endliche Tabelle; unbekanntes Segment ⇒ kein Header statt falschem Titel → Accepted Risks Log | closed |
| T-09-16 | Denial of Service | 09-04: Festival-Ausstieg ohne Historie | medium | mitigate | `closePushScreen` mit `canGoBack()`-Verzweigung (gleiche Form wie `leaveFestival`); Gerätecheck 3 | closed |
| T-09-17 | Information Disclosure | 09-05: Festival-Friends-Tab als Anwesenheitssignal | high | mitigate | `PersonRow` trägt nur `profile`/`onPress`/`accessibilityLabel` — keine Präsenz-/Orts-/Distanz-Prop; Endpunkt liefert kein Aufenthaltssignal; Gerätecheck 4 | closed |
| T-09-18 | Information Disclosure | 09-05: Mandantenscope der Abfrage | medium | mitigate | `festivalId` nur aus `useFestivalContext()`; Query erst `enabled` nach Gate-Auflösung; Serverisolation in 09-02-Spec | closed |
| T-09-19 | Elevation of Privilege | 09-05: zweite Navigationsposition `friends-find` | medium | mitigate | Reiner Re-Export INNERHALB desselben `Stack.Protected`-Blocks; keine zweite Implementierung, keine neue Deep-Link-Fläche | closed |
| T-09-20 | Information Disclosure | 09-05: Chat-/DM-Fläche | high | mitigate | Kein Chat-/Nachrichten-Einstieg (ADR-020); seit 07-05 per Contract-Test verriegelt; Gerätecheck 5 | closed |
| T-09-21 | Information Disclosure | 09-05: Query-Cache nach Kontowechsel | low | accept | `friendKeys.inFestival` unter bestehendem Präfix, vom Cache-Reset erfasst → Accepted Risks Log | closed |
| T-09-SC | Tampering | 09-06: `npx expo install react-native-webview` (Supply Chain) | high | mitigate | Blockierendes Human-Checkpoint mit Registry-Evidenz (Name, Herausgeber, Historie, Dependency-Baum, Expo-Kompatibilität) VOR Installation freigegeben (09-06-SUMMARY Decisions) | closed |
| T-09-22 | Tampering | 09-06: Ursprungswechsel innerhalb der WebView | high | mitigate | `originWhitelist` auf exakt den konfigurierten Ursprung + `onShouldStartLoadWithRequest`-Origin-Vergleich (zwei unabhängige Sperren, grep-verifiziert in `app/cashless.tsx`); Gerätecheck 4 | closed |
| T-09-23 | Tampering | 09-06: nicht-HTTPS oder manipulierte Adresse | high | mitigate | `resolveCashlessTarget` akzeptiert nur `https:` mit nicht-leerem Host (`lib/cashless-url.ts:54`), geprüft VOR der Kachel UND erneut im Screen gegen den Routenparameter; node-env-Testfälle | closed |
| T-09-24 | Information Disclosure | 09-06: Datenaustausch mit der Fremdseite | medium | mitigate | Kein `injectedJavaScript`, kein `onMessage` — keine Brücke in beide Richtungen | closed |
| T-09-25 | Information Disclosure | 09-06: Zahlungs-/Kartendaten | high | mitigate | Keinerlei native Zahlungsverarbeitung/-anzeige: Cashless ist ausschließlich der eingebettete Rahmen (ADR-011); Gerätecheck 6 | closed |
| T-09-26 | Denial of Service | 09-06: fehlender nativer Rebuild | medium | mitigate | Als `user_setup` + WINDOWS.md #46 geführt; Rebuild aus `apps/mobile`, Geräteabnahme setzte ihn voraus | closed |
| T-09-27 | Spoofing | 09-06: inerter Cashless-Platzhalter | medium | mitigate | Kachel entfällt hart ohne Adresse (`{cashlessTarget ? … : null}`, kein Else-Zweig, ADR-011); Gerätecheck 2 | closed |
| T-09-25 | Denial of Service | 09-07: `app/friend-detail.tsx` unter neuem Navigator-Default | medium | mitigate | Header in den In-Screen-Optionen des Modals reaktiviert; `native-header-default.test.ts`-Assertion; Modal-Schließen am Gerät verifiziert (UAT R2 Test 1) | closed |
| T-09-26 | Information Disclosure | 09-07: native Header-Leiste auf Anmeldeflächen | low | mitigate | Default an beiden Gruppen-Layouts entfernt die Leiste; Welcome/E-Mail/Code am Gerät ohne native Leiste verifiziert (UAT R2 Test 1) | closed |
| T-09-27 | Spoofing | 09-07: Tab-Beschriftung `Live` am Dashboard-Tab | low | accept | User-Entscheid (UAT 2026-08-14); kein statischer Live-Punkt gebaut — am Gerät verifiziert (UAT R2 Test 2) → Accepted Risks Log | closed |
| T-09-28 | Information Disclosure | 09-07: Tab-Beschriftung `Crew` und Präsenz-Erwartung | low | mitigate | Tab-Inhalt unverändert (Schnittmenge Freunde × Festival), Kachel-Eyebrow spricht von Freunden; ADR-014-Änderungsnotiz trennt Sprachregel von Datenregel (UAT R2 Tests 2+3) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-09-01 | T-09-03 (09-01) | Geändertes Lingui-Label ist reines Navigationslabel ohne Nutzer-/Mandantendaten | Plan 09-01 (Planzeit) | 2026-08-13 |
| AR-09-02 | T-09-07 (09-02) | `200 []` statt 404: kein Existenz-Orakel; Antwort enthält nur eigene Freunde des Aufrufers — gewollte ADR-014-Funktion | Plan 09-02 + 09-02-SUMMARY | 2026-08-13 |
| AR-09-03 | T-09-12 (09-03) | Platzhalter-Tabs ohne Fetch, Props oder Datenquelle — nichts kann leaken | Plan 09-03 (Planzeit) | 2026-08-13 |
| AR-09-04 | T-09-15 (09-04) | Push-Titel-Zuordnung ist endliche kompilierte Tabelle; unbekanntes Segment ⇒ kein Header, nie falscher Titel | Plan 09-04 (Planzeit) | 2026-08-13 |
| AR-09-05 | T-09-21 (09-05) | Friends-Query-Key liegt unter bestehendem Präfix des Cross-Account-Cache-Resets — kein Zusatzmechanismus nötig | Plan 09-05 (Planzeit) | 2026-08-13 |
| AR-09-06 | T-09-27 (09-07) | Label `Live` ist User-Entscheid aus den Screen-Designs; der statische Zustandspunkt wurde bewusst NICHT gebaut (NAV-02) — ein echtes Live-Signal führt den Punkt später ein (Deferred Follow-Up in 09-UAT.md) | User (UAT 2026-08-14) | 2026-08-14 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-15 | 32 | 32 | 0 | gsd-secure-phase (Orchestrator, L1-Short-Circuit: Register zur Planzeit + grep-verifizierte Mitigations + Geräte-UAT R1/R2) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-15
