---
phase: 06
slug: profile-friends-placeholders
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
threats_total: 44
threats_closed: 44
register_authored_at_plan_time: true
created: 2026-08-12
---

# Phase 06 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register aus den `<threat_model>`-Blöcken aller zehn Pläne (06-01 … 06-10) gebaut —
> zur Planungszeit modelliert, nicht retroaktiv. Verifiziert von `gsd-security-auditor`
> gegen die tatsächliche Implementierung; jedes `closed` trägt eine Fundstelle.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Gerät → `GET /api/v1/me` | Sessiongebundener Abruf des eigenen Kontoprofils; die Session-Cookie-Grenze ist die Vertrauensgrenze | Personenbezogene Profildaten (Handle, Anzeigename, E-Mail, Geburtsdatum, Geschlecht, Pronomen) |
| Root-Stack → `Stack.Protected(authenticated)` | Alles darunter setzt eine gültige Session voraus; ein daneben registrierter Screen wäre unauthentifiziert erreichbar | Route-Zugriff |
| Client → `POST /api/v1/me/complete-profile` | Unvertrauter Freitext und ein Datum überqueren die Grenze in die Datenbank | Pronomen, Geschlecht, Geburtsdatum |
| `packages/contracts` → Admin-Workstream | Veröffentlichte Typfläche, die ein zweiter, gleichzeitig arbeitender Stream mitliest | Zod-Schemata, Endpunkt-Signaturen |
| Entwicklungsrechner → lokale Docker-Postgres-Instanz | Die Migration schreibt Schemaänderungen; ein falsch aufgelöster Connection-String zielt auf die falsche Datenbank | DDL |
| App → gerätelokaler MMKV-Speicher | Theme-Override und Avatar-URI werden gerätelokal persistiert; ein manipulierter Wert wird beim Lesen zur Eingabe | Darstellungspräferenz, lokaler Foto-URI |
| App → Betriebssystem-Browser (SafeNow-Link) | Ein externer Aufruf verlässt die App; das Ziel bestimmt, wohin die Nutzenden geschickt werden | Ausgehende URL |
| Angemeldete Session → abgemeldeter Zustand | Der Abmeldepfad ist die einzige Stelle, an der eine Session auf einem geteilten Gerät endet | Session-Lebenszyklus |
| npm-Registry → App-Bundle | Zwei neue Drittpakete betreten den Dependency-Graph (nativer Picker, Intl-Polyfill) | Fremdcode |
| App-Entry → jedes Route-Modul | `apps/mobile/index.js` läuft vor allem App-Code ohne Guard darüber; was hier importiert wird, ist maximal privilegiert | Ausführungsreihenfolge |
| Katalogdateien → gerenderte Oberfläche | Jede Meldung wird in beiden Sprachen angezeigt; ein fehlender Satz wirkt unmittelbar auf die Aussage der UI | UI-Copy (DE/EN) |
| Screen → Nutzendenerwartung | Platzhalterflächen, die vorgeben können, mehr zu sein als sie sind | Wahrgenommene Funktionalität |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation (verifizierte Fundstelle) | Status |
|-----------|----------|-----------|----------|-------------|--------------------------------------|--------|
| T-06-01 | Information Disclosure | `app/profil.tsx` (Routen-Registrierung) | high | mitigate | `_layout.tsx:493` innerhalb `Stack.Protected` (`:475`); keine zweite Registrierung | closed |
| T-06-02 | Elevation of Privilege | `GET /api/v1/me` | medium | mitigate | `router.ts:45-50` ohne pathParams/query; `profil.tsx:125` argumentfrei; Server bindet `session.user.id` (`me.controller.ts:17,27`) | closed |
| T-06-03 | Information Disclosure | Gerätelokaler Avatar (MMKV, D-05) | low | accept | Kein Upload-Pfad; URI bleibt in `lib/avatar-storage.ts`, gelesen bei `profil.tsx:160` | closed |
| T-06-04 | Spoofing | Deep-Link auf `/profil` | low | accept | Capture/Replay in `_layout.tsx:234-253` unverändert; gleiche `Stack.Protected`-Grenze | closed |
| T-06-05 | Information Disclosure | `visitorProfilePublicSchema` (+ `birthDate`, `gender`) | high | mitigate | Genau 2 `getProfile(`-Aufrufstellen, beide eigentümergebunden (`me.controller.ts:17,42`); Projektion 2× in `router.ts` (`:11`, `:55`) | closed |
| T-06-06 | Information Disclosure | Künftiger Freundes-Endpunkt auf derselben Projektion | medium | accept | Als Blocker geführt (`STATE.md:277`); kein Fremdprofil-Endpunkt existiert | closed |
| T-06-07 | Denial of Service | Freitext `pronoun` / `gender` | medium | mitigate | `visitor-profile.ts:140` `.max(20)`, `:151` `.max(30)`; fließt via `.pick()` in `schemas.ts:111-118` | closed |
| T-06-08 | Tampering | Migration gegen die falsche Datenbank | medium | mitigate | `drizzle/0004_new_wong.sql` mit Snapshot+Journal; Connection-String-Prüfung `host=localhost db=quiks` (06-02-SUMMARY:180); kein `db:push` | closed |
| T-06-09 | Tampering | Ungültiges Datumsformat in `birthDate` | low | mitigate | Postgres-`date` (`0004_new_wong.sql:2`) + Regex/`isCalendarDate`-Refine (`visitor-profile.ts:145-150`) | closed |
| T-06-10 | Repudiation | Client-setzbares `createdAt` | low | mitigate | `me.controller.ts:29` aus `session.user.createdAt`; nicht im Body-Schema (`schemas.ts:111-118`) | closed |
| T-06-11 | Tampering | Override-Wert im MMKV | low | mitigate | `theme-override-storage.ts:70-72` validiert gegen `ALLOWED_OVERRIDES` (`:30`), sonst `'system'` | closed |
| T-06-12 | Denial of Service | Speicherfehler beim ersten Frame | low | mitigate | `theme-override-storage.ts:75-91` — beide I/O-Funktionen mit try/catch und Fallback | closed |
| T-06-13 | Tampering | Unparsbares/zukünftiges `birthDate` | low | mitigate | `profile-age.ts:60-78` — `null` für leer/unparsbar/kalenderungültig/zukünftig; wirft nie | closed |
| T-06-14 | Information Disclosure | Persistiertes Geburtsdatum auf dem Gerät | low | accept | `query-client.ts:6-8` ohne Persistenz-Wrapper; Alter pro Render abgeleitet (`profil.tsx:187-191`) | closed |
| T-06-15 | Denial of Service | Hinweis verdeckt die FloatingNav | medium | mitigate | `SoonToast.tsx:132-135` Offset aus `navHeight`+`navInset`+`insets.bottom`; `:164` `pointerEvents:'none'` | closed |
| T-06-16 | Denial of Service | Ungeräumter Auto-Schließ-Timer | low | mitigate | `SoonToast.tsx:59` clearTimeout beim Ersetzen, `:80-87` Unmount-Cleanup, Einzel-Slot `:54` | closed |
| T-06-17 | Information Disclosure | Beliebiger Text in der Hinweis-Pille | low | mitigate | `SoonToast.tsx:146` reiner Text-Knoten; Aufrufer übergeben statische Lingui-Sätze (`profil.tsx:332`, `mehr.tsx:175`, `friends.tsx:146`) | closed |
| T-06-18 | Repudiation | Screenreader bemerkt den Hinweis nicht | low | mitigate | `SoonToast.tsx:138` `accessibilityLiveRegion="polite"` + `:71` `announceForAccessibility` (WR-04) | closed |
| T-06-19 | Spoofing | Verschobener Abmeldepfad | high | mitigate | `mehr.tsx:103` Doppeltipp-Ref, `:112-113` try um `signOut()`, `:121-130` finally mit `forceUnauthenticated()`+`clearActiveFestivalSlug()` | closed |
| T-06-20 | Tampering | Externer Link der SafeNow-Karte | medium | mitigate | `mehr.tsx:32` feste Konstante `https://safenow.app`; einzige Verwendung `:285`, nicht zur Laufzeit gebaut | closed |
| T-06-21 | Repudiation | Versehentliches Abmelden | medium | mitigate | `mehr.tsx:143-148` `Alert.alert` mit `style:'cancel'` und `style:'destructive'` | closed |
| T-06-22 | Tampering | Toter Schalter suggeriert Zustand | low | mitigate | `mehr.tsx:216-239`, `:249-255` — alle vier echt `disabled`, `value={false}`, Bald-Badge | closed |
| T-06-23 | Information Disclosure | Aufgelöster UI-Locale | low | accept | `mehr.tsx:75` zeigt nur `i18n.locale`, app-weit bereits sichtbar | closed |
| T-06-24 | Information Disclosure | Eigener Handle in der quiks-Code-Karte | low | mitigate | `friends.tsx:113` einzige sessiongebundene `/me`-Query; Handle nur aus eigenem Profil (`:210-217`) | closed |
| T-06-25 | Elevation of Privilege | Festival-Grenzüberschreitung | low | mitigate | `friends.tsx:1-14` — kein Festival-Kontext-Import, kein Festival-State | closed |
| T-06-26 | Spoofing | Nicht funktionsfähiges Suchfeld | medium | mitigate | `friends.tsx:154-160` `value=""`, `editable={false}`, `pointerEvents:'none'` (`:347`), statisches Bald-Badge (`:161-163`) | closed |
| T-06-27 | Repudiation | Chats-Block suggeriert verborgene Nachrichten | medium | mitigate | `friends.tsx:280-284` — Leerzustand benennt die Voraussetzung statt einer Null-Aussage | closed |
| T-06-28 | Information Disclosure | Alter + Geschlecht im Profilkopf | high | mitigate | `profil.tsx:125` einzige Quelle `/me`; nur hinter dem Auth-Guard (`_layout.tsx:493`); kein Fremdprofil-Renderpfad | closed |
| T-06-29 | Information Disclosure | Gerätelokaler Avatar | low | accept | `profil.tsx:156-161` — MMKV, keyed by accountId, kein Upload/Sync | closed |
| T-06-30 | Spoofing | Gedämpfte Ausblick-Blöcke wirken wie Daten | medium | mitigate | `profil.tsx:303` Dämpfung + `accessibilityState.disabled`; Socials wertlos (`:397-417`), Vibe nur „Not connected" (`:441-450`), Kacheln wertlos (`:469-471`) | closed |
| T-06-31 | Repudiation | Konto-Zeilen wirken bearbeitbar | low | mitigate | `profil.tsx:356-379` — `onPress` nur `showSoonToast`; keine Eingabe, kein Mutations-Aufruf in der Datei | closed |
| T-06-32 | Tampering | Anzeigename/Handle sprengt das Layout | low | mitigate | `profil.tsx:270-283` — beide `numberOfLines={1}` `ellipsizeMode="tail"`, reiner Text | closed |
| T-06-SC-08 | Tampering (supply chain) | `@react-native-community/datetimepicker` | high | mitigate | `package.json:29` gepinnt `9.1.0` = SDK-57-`bundledNativeModules`; blockierender Human-Check vor Installation freigegeben (06-08-SUMMARY:128,175); via `npx expo install` | closed |
| T-06-33 | Denial of Service | Überlange Freitexteingabe (Client) | medium | mitigate | Serverbound autoritativ (`visitor-profile.ts:140,151`); weiche Client-Caps `complete-profile.tsx:456,519` | closed |
| T-06-34 | Tampering | Zeitzonenbedingte Tagesverschiebung | medium | mitigate | `complete-profile.tsx:63-65` — lokale Datumskomponenten + `padStart`; kein `toISOString` im Geburtsdatum-Pfad | closed |
| T-06-35 | Information Disclosure | PII-Erfassung ohne Disclaimer | medium | accept | D-12 bewusst; IDN-02 (Disclaimer, Altersgrenze, Sichtbarkeit) offen in `STATE.md:277` | closed |
| T-06-36 | Repudiation | SafeNow-Distanzierung fehlt in einer Sprache | medium | mitigate | `locales/de/messages.po:659-660` und `en/messages.po:659-660` — in beiden Katalogen mit nicht-leerem msgstr | closed |
| T-06-37 | Spoofing | Grünes Gate aus dem Turbo-Cache | medium | mitigate | 06-09-SUMMARY:80,119 — `lint/typecheck/test --force`, je „0 cached", kein Cache-Treffer | closed |
| T-06-38 | Information Disclosure | Nutzerinhalt gerät in die Kataloge | low | mitigate | Kataloge geprüft: kein Anzeigename/Username/Handle als übersetzbare Meldung; Interpolation nur zur Renderzeit (`profil.tsx:275,282`) | closed |
| T-06-39 | Repudiation | Nicht gelaufene Geräteprüfungen gelten als erledigt | medium | mitigate | 06-09-SUMMARY:186-188 — blockierender Checkpoint, ehrlich als Pauschalabnahme protokolliert; offene Punkte als `human_needed` in 06-VERIFICATION, nie als automatisiert getarnt | closed |
| T-06-SC-10 | Tampering (supply chain) | `@formatjs/intl-pluralrules` | high | mitigate | `package.json:23` `^6.3.13`; Legitimitäts-Gate vor Installation freigegeben (06-10-SUMMARY:45,114); Lockfile-Diff auf `@formatjs/*` + 3 transitive begrenzt, unabhängig geprüft (`:102,207`) | closed |
| T-06-10-01 | Tampering | Neuer App-Entry `apps/mobile/index.js` | medium | mitigate | Genau zwei Side-Effect-Imports; Guard-Test `lib/__tests__/intl-polyfill.test.ts:44-64` prüft `main: 'index.js'` und die Reihenfolge Polyfill-vor-`expo-router/entry` | closed |
| T-06-10-02 | Denial of Service | Android-Kaltstartzeit | low | mitigate | `lib/intl-polyfill.ts:43` `polyfill-force.js` (nicht die Detection-Variante); `:44-45` nur `de.js`/`en.js` | closed |
| T-06-10-03 | Information Disclosure | Startup-Capability-Log | low | accept | `intl-polyfill.ts:52-55` loggt nur einen Capability-String und `typeof Intl.PluralRules`; keine Konto-/Session-Daten an diesem Boot-Punkt erreichbar | closed |

*Status: open · closed · open — below `high` threshold (non-blocking)*
*Severity: critical > high > medium > low — nur offene Threats ab `block_on: high` zählen in `threats_open`*
*Disposition: mitigate (Umsetzung nötig) · accept (dokumentiertes Risiko) · transfer (Dritte)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-06-01 | T-06-03, T-06-29 | Gerätelokaler Avatar bleibt in MMKV, kein Upload, kein Server-Sync (D-05). Restrisiko entspricht dem eines beliebigen lokalen Fotos auf einem entsperrten Gerät. | Emil Auer | 2026-08-12 |
| AR-06-02 | T-06-04 | Deep-Link auf `/profil` läuft durch dieselbe `Stack.Protected`-Grenze wie jede geschützte Route; keine neue Fläche. | Emil Auer | 2026-08-12 |
| AR-06-03 | T-06-06 | **Live-Constraint, kein Restposten:** `visitorProfilePublicSchema` muss in Eigentümer- und Freundes-Sicht getrennt werden, BEVOR ein Endpunkt ein fremdes Profil ausliefert. D-12 setzt fest, dass in Phase 6 keine Sichtbarkeits-Policy entsteht; IDN-02 bleibt Birgits Konzept. Geführt in `STATE.md` §Blockers/Concerns. | Emil Auer (D-12) | 2026-08-12 |
| AR-06-04 | T-06-14 | Alter wird nicht persistiert (D-12a); das Geburtsdatum liegt serverseitig und lebt clientseitig nur im nicht-persistierten React-Query-Cache. | Emil Auer | 2026-08-12 |
| AR-06-05 | T-06-23 | Der angezeigte UI-Locale ist app-weit bereits sichtbar; keine neue Offenlegung. | Emil Auer | 2026-08-12 |
| AR-06-06 | T-06-35 | Kein Signup-Disclaimer, keine Altersgrenze, keine Sichtbarkeitssteuerung in dieser Phase (D-12, im Discuss benannt und überstimmt). Rest von IDN-02 als Blocker in `STATE.md` verzeichnet. | Emil Auer (D-12) | 2026-08-12 |
| AR-06-07 | T-06-10-03 | Die Startup-Zeile loggt nur `typeof Intl.PluralRules`; an diesem Punkt der Boot-Sequenz sind weder Konto- noch Session-Daten erreichbar. | Emil Auer | 2026-08-12 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-12 | 44 | 44 | 0 | gsd-security-auditor (fable), ASVS L1, block_on high |

---

## Carry-Forward für spätere Phasen

- **T-06-06 / AR-06-03** ist die einzige Auflage, die in eine spätere Phase hineinwirkt:
  der erste Endpunkt, der ein FREMDES Profil ausliefert (FRND-02 / PROF-02), darf
  `visitorProfilePublicSchema` nicht wiederverwenden, ohne sie vorher in eine
  Eigentümer- und eine Freundes-Sicht zu trennen.
- **T-06-39** ist geschlossen, weil die Geräteabnahme ehrlich als Pauschalabnahme
  protokolliert ist — nicht, weil jeder Punkt einzeln nachgewiesen wäre. Die offenen
  Beobachtungen gehören zu `/gsd-verify-work`, nicht zu diesem Audit.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-12
