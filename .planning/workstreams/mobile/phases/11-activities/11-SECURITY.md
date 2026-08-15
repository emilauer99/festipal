---
phase: 11
slug: activities
status: draft
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-15
---

# Phase 11 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register-Herkunft: dieser Plan (11-02) enthielt zur Planzeit einen `<threat_model>`-Block
> (`register_authored_at_plan_time: true`). Diese Datei wird über die Phase hinweg von jedem
> weiteren Plan (11-03…11-05) um seine eigenen Einträge ergänzt; `status: draft` bis
> `/gsd-secure-phase` den Abschlussaudit für die gesamte Phase fährt.

---

## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm-Registry → `apps/mobile`-Abhängigkeitsbaum | ein neues natives Paket überschreitet sie und läuft danach mit App-Rechten |
| App → Betriebssystem-Standortdienst | eine neue OS-Berechtigung wird angefragt |
| App → fremde Karten-App | ein selbstgebauter URI verlässt die App und wird von fremdem Code interpretiert |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-11-SC | Tampering | `expo-location` (npm, Supply Chain) | high | mitigate | Manuelles Paket-Legitimitäts-Gate als blockierender Human-Checkpoint VOR dem Install, freigegeben durch den User ("approved") am 2026-08-15. Beleg unten. | closed |
| T-11-01 | Tampering | `lib/geo-link.ts` | high | mitigate | Der URI wird ausschließlich aus den beiden vertragsvalidierten Zahlenfeldern gebaut; die Funktionssignatur hat keinen Freitext-Eingang, die Härtung ist damit typgeprüft statt sorgfaltsabhängig; locale-unabhängige Zahlenumwandlung verhindert eine gebrochene Zielanwendungs-Eingabe. Umgesetzt in Task 3 dieses Plans. | closed |
| T-11-02 | Information Disclosure | `expo-location` Fähigkeitsumfang | high | mitigate | Es wird ausschließlich die Vordergrund-Berechtigung konfiguriert; kein Hintergrund-Schlüssel, kein kontinuierliches Abonnement, keine Hintergrundaufgabe — die Absage ist im `app.json`-Konfigurationsobjekt maschinell prüfbar (Akzeptanzkriterium mit Exit-Code 2 bei Verstoß) | closed |
| T-11-03 | Information Disclosure | Berechtigungs-Begründung | medium | mitigate | Die dem Nutzer vom OS vorgelegte Begründung benennt Einmaligkeit und Zweck und verneint Tracking ausdrücklich — die Zusage steht dort, wo der Nutzer sie zum Zeitpunkt der Entscheidung liest | closed |
| T-11-04 | Elevation of Privilege | `Linking.openURL`-Ziel | medium | accept | Welche App den `geo:`-URI bzw. die Maps-URL öffnet, entscheidet das Betriebssystem bzw. der System-Chooser (D-14). Das ist bewusst so: die App maßt sich nicht an, die Karten-App des Nutzers zu bestimmen. Der URI trägt keine Geheimnisse, nur ein Koordinatenpaar | closed |
| T-11-05 | Denial of Service | nativer Rebuild auf Windows | low | mitigate | Der Rebuild ist ein Human-Checkpoint mit ausdrücklicher Verzeichnis- und Metro-Vorbedingung; ein Lauf aus dem Repo-Root oder mit laufendem Watcher ist der bekannte Fehlerpfad und wird in der Anweisung benannt | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## T-11-SC — Package-Legitimacy Evidence (`expo-location`)

Evidenz, per `npm view` gegen `registry.npmjs.org` erhoben, VOR jedem Install-Befehl. Freigabe
durch den Menschen erfolgte per Checkpoint-Antwort ("approved") vor Ausführung von
`npx expo install expo-location`.

| Feld | Wert |
|---|---|
| Exakter Paketname | `expo-location` |
| Publisher / npm-Org | Expo-Team — Maintainer-Liste: `brentvatne`, `ide`, `tsapeta`, `expoadmin`, `exponent`, `bycedric`, `kudochien`, `alanhughes`, `philpl`, `ccheever`, `wschurman`, `expo-bot` — dieselbe Publisher-Menge wie `expo-camera` (T-08-SC) und `expo-image-picker`, bereits in diesem Repo vertraut |
| Repository | `git+https://github.com/expo/expo.git` — das offizielle Expo-Monorepo (übereinstimmend mit `homepage: https://docs.expo.dev/versions/latest/sdk/location/`) |
| Lizenz | MIT |
| Aufgelöste Version für diese SDK | `apps/mobile/package.json` bindet `expo: ~57.0.9`; der `latest`/`next`-Dist-Tag von `expo-location` ist `57.0.10` (stabiler Release, kein Canary) — dies ist die SDK-57-kompatible Version, die `npx expo install expo-location` auflöst |
| Direkter Abhängigkeitsbaum | Genau eine direkte Abhängigkeit: `@expo/image-utils@^0.11.4` — ebenfalls ein offizielles Expo-Paket im selben Monorepo/derselben Publisher-Menge, nichts Unerwartetes |
| Vorab-Version-Check | `57.0.10` ist ein regulärer stabiler Release; kein `-canary-`-Suffix |
| Prüfdatum | 2026-08-15 |
| Freigabe | User, Checkpoint-Antwort "approved", 2026-08-15 — VOR dem Install-Befehl |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-11-01 | T-11-04 (11-02) | Welche App den `geo:`-URI öffnet, entscheidet OS/System-Chooser (D-14) — die App maßt sich nicht an, die Karten-App zu bestimmen; der URI trägt nur ein Koordinatenpaar, kein Geheimnis | Plan 11-02 (Planzeit) | 2026-08-15 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-15 | 6 | 6 | 0 | Plan 11-02 (register authored at plan time, T-11-SC evidence human-verified before install) |

*This table accumulates across every plan in Phase 11; the final row is written by `/gsd-secure-phase` at phase close.*

---

## Sign-Off

- [ ] All threats have a disposition (mitigate / accept / transfer) — pending remaining Phase 11 plans (11-03…11-05)
- [x] Accepted risks documented in Accepted Risks Log (this plan's entries)
- [ ] `threats_open: 0` confirmed for the WHOLE phase — pending phase close
- [ ] `status: verified` set in frontmatter — pending `/gsd-secure-phase`

**Approval:** in progress — Plan 11-02 threats closed 2026-08-15; phase-wide sign-off pending.
