---
status: testing
phase: 11-activities
source: [11-VERIFICATION.md]
started: 2026-08-15T17:30:00Z
updated: "2026-08-16T17:50:48Z"
---

## Current Test

number: 9
name: Sechs-Fälle Tag/Titel-Prefill (Re-Test nach Gap-Closure 11-06, G-11-3)
expected: |
  Create-Form öffnen: Placeholder zeigt den Beispieltext OHNE Klammer-Anmerkung. Tag antippen →
  Label steht als echter, editierbarer Text im Titel-Feld. Zweites Tag antippen → Titel folgt.
  Titel editieren, dann Tag wechseln → getippter Text bleibt. Abwählen solange Titel == Label →
  Feld leert sich. Abwählen nach Editieren → Text bleibt. Submit mit unverändertem Label + Zeit →
  Aktivität erscheint in „Deine Aktivitäten" mit dem erwarteten (locale-aufgelösten) Titel.
awaiting: user response

## Tests

### 1. Activities-Tab — echte Daten, zwei Sektionen (11-01 T1/T2)

expected: „Deine Aktivitäten" über „Wer kommt mit?"; „Gestartet"-Chip am Sektionsende; capacity-null ohne Plätze-Hinweis; „Dabei"-Badge; Sektionen unabhängig in Loading/Error/Empty.
result: pass

### 2. Push-Routen-Regression (11-01 T3)

expected: Karten-Tap öffnet /activity-detail als Push mit statischem, lokalisiertem Header-Titel — auf einem deutschen Gerät „Aktivität", auf einem englischen „Activity" — und Zurück-Pfeil; Zurück landet am Tab; App-Kill + Relaunch vom Detail-Screen zeigt NIE Expo Routers Unmatched-Route-Screen.
result: issue
reported: "pass. aber im header schreib Aktivität (quiks)"
severity: minor
note: Routing-Verhalten bestätigt (Push, Zurück, Kill+Relaunch ohne Unmatched) — Issue betrifft nur den Header-Titeltext.

### 3. Create-Flow end-to-end inkl. D-05-Live-Regel und Idempotenz (SC1)

expected: Leer abschicken → Inline-Fehler unter Titel + Wann-Block (kein Toast); Tag wählen → Tag-Label steht als echter, editierbarer Text im Titel-Feld, Titel bleibt optional, Untertitel-Feld erscheint (Abwählen leert einen unveränderten Titel wieder); Tag+Zeit → Submit → Aktivität erscheint in „Deine Aktivitäten"; Doppel-Tap auf Submit erzeugt GENAU eine Aktivität; Flugmodus + Submit → Fehlertext, Eingaben bleiben erhalten. Nach Submit landet der Detail-Screen (kein ewiges Loading — CR-01-Fix).
result: issue
reported: "pass. aber ich will dass wenn man ein Tag will dieser dann als echter text im titel input steht und nicht nur wie aktuell als placeholder. und die anmerkung in den klammern bitte weggeben"
severity: minor
note: Flow selbst bestätigt (Validierung, Idempotenz, Offline-Fehler, CR-01-Navigation) — Issue betrifft das Titel-Prefill-Verhalten bei Tag-Auswahl.

### 4. Location-Capture Permission-Lifecycle (11-04 T2)

expected: System-Dialog genau einmal pro Create-Screen-Mount; Grant → „Pin location"-Tap wird zum entfernbaren „Location pinned"-Chip, Entfernen stellt den Button wieder her; Deny → Callout mit vollständiger Non-Tracking-Begründung + „Open Settings", Freitext bleibt tippbar, Aktivität weiterhin postbar; Remount nach Entscheidung → kein erneuter Prompt.
result: pass
note: Feature-Idee (optionaler Maps-Link als Standort) als Deferred Follow-Up erfasst — kein Defekt dieser Phase.

### 5. Zwei-Account Join/Leave/Voll/Gestartet/Auflösen (WINDOWS.md #53 — SC2+SC3)

expected: Account C sieht Join bei voller Aktivität ECHT deaktiviert mit „Full — 2/2 spots"; Aktivität nach startTime zeigt „Already started"; Creator A sieht rotes Auflösen (nie Verlassen) → nativer Confirm-Dialog nennt Teilnehmerzahl → nach Confirm landet A am Activities-Tab, Aktivität aus beiden Listen verschwunden; capacity-1-Aktivität ist direkt nach Erstellung voll (ACT-03-Annahme). Join/Leave aktualisiert Sitzzähler sofort; Kill + Relaunch zeigt weiterhin korrekten Stand.
result: pass

### 6. Teilnehmerliste + Sitzzeile (WINDOWS.md #52)

expected: Creator zuerst (Join-Reihenfolge), kein Creator-Badge; frische Aktivität zeigt „Nobody else yet." statt Ein-Zeilen-Liste; unbegrenzte vs. nummerierte Sitzzeilen-Variante; lange Beschreibung bricht vollständig um (keine Truncation).
result: pass

### 7. Klonen + Routen-Handoff (WINDOWS.md #54 — SC4+SC5)

expected: Fremdes Detail → Clone → Formular prefilled (Tag/Titel/Untertitel/Beschreibung/Freitext-Ort/Kapazität), startTime LEER, Geo LEER; Zurück landet am Quell-Detail. D-15-Lesart explizit bestätigen: Freitext-Ort BLEIBT, nur Geo + Zeit geleert. Detail mit Geo: „Open route" neben dem Freitext → öffnet Karten-App/Chooser am Punkt; ohne Geo: nur Freitext, keine Routen-Affordance; weder Ort noch Geo: Treffpunkt-Block komplett absent.
result: pass

### 8. Formular-Primitives unter Last + EN-Locale (WINDOWS.md #49/#50 + Backstops)

expected: Ein-Tages-Festival = genau ein Tages-Chip; langes Festival wrappt die Chip-Reihe; Kapazität startet „no limit", Minus tot bei 1; lange Tag-Labels sprengen die Pille nicht; leere Tag-Liste lässt Layout intakt (Titel-Pflicht-Pfad); Gerät auf EN wechselt alle Chrome-Texte, user-eingegebene Titel/Beschreibungen bleiben wörtlich (ADR-012/020); Location-Fehler ohne Permission-Grund fällt sauber auf Freitext zurück.
result: pass

### 9. Sechs-Fälle Tag/Titel-Prefill (Re-Test nach Gap-Closure 11-06 — WINDOWS.md #55, G-11-3)

expected: Create-Form: Placeholder zeigt den Beispieltext OHNE Klammer-Anmerkung. Tag antippen → Label steht als echter, editierbarer Text im Titel-Feld. Zweites Tag antippen → Titel folgt. Titel editieren, dann Tag wechseln → getippter Text bleibt. Abwählen solange Titel == Label → Feld leert sich. Abwählen nach Editieren → Text bleibt. Submit mit unverändertem Label + Zeit → Aktivität erscheint in „Deine Aktivitäten" mit dem erwarteten (locale-aufgelösten) Titel.
result: [pending]

### 10. G-11-2 DE-Header-Falsifikation mit kaltem Metro-Cache (WINDOWS.md #56)

expected: Gerät auf Deutsch, `cd apps/mobile && npx expo start -c`, App neu laden, Aktivitäts-Karte öffnen → Detail-Header zeigt „Aktivität" (nicht „Activity"); Gegenprobe auf EN-Gerät zeigt „Activity". Bleibt auf DE „Activity", ist der stale kompilierte Dev-Client-Katalog als Ursache bestätigt und der Cache-Clear-Lauf selbst der Fix — beide Ausgänge schließen G-11-2 ohne Code-Änderung.
result: [pending]

## Summary

total: 10
passed: 6
issues: 2
pending: 2
skipped: 0
blocked: 0

## Gaps

- gap_id: G-11-2
  truth: "Detail-Screen-Header zeigt „Aktivität" als Titel statt des englischen „Activity" (quiks, deutscher Chrome-Text)"
  status: failed
  reason: "User reported: pass. aber im header schreib Aktivität (quiks)"
  severity: minor
  test: 2
  root_cause: "Kein Code-Defekt in der Lokalisierungskette: Header-Titel hat genau eine Quelle (pushScreenTitle-Map, AppHeader.tsx L145, Lingui t-Macro) und de/messages.po L84–86 enthält msgid \"Activity\" → msgstr \"Aktivität\" seit Commit 5e5c74c (vor UAT-Beginn). Katalog-Maschinerie nachweislich funktional (Test 1 zeigte deutsche Phase-11-Strings, Test 8 bestätigte DE↔EN-Switch). Das gesehene „Activity" ist die englische Source-Copy — plausibelste Rest-Hypothesen: stale Metro-kompilierter de-Katalog im Dev-Client (gleiche Dev-Artefakt-Klasse wie first-login-unmatched-route) oder Gerät kurzzeitig auf EN; zusätzlich zitierte der UAT-Erwartungstext selbst den englischen msgid. Entscheidbar nur per On-Device-Check mit expo start -c."
  artifacts:

    - path: "apps/mobile/components/AppHeader.tsx"
      issue: "L145 bereits korrekt (Lingui t`Activity`) — keine Code-Änderung erwartet"

    - path: "apps/mobile/locales/de/messages.po"
      issue: "L84–86: Übersetzung „Aktivität" bereits vorhanden — nur editieren, falls User abweichende Copy will"

    - path: ".planning/workstreams/mobile/phases/11-activities/11-UAT.md"
      issue: "Test-2-Erwartungstext schreibt „Activity"-Header vor (englischer msgid) — Wording auf lokalisierten Titel korrigieren"
  missing:

    - "On-Device-Falsifikationstest auf DE-Gerät mit kaltem Metro-Cache (expo start -c) → „Aktivität" schließt den Gap ohne Code-Änderung; bleibt „Activity", ist der stale kompilierte Katalog die Ursache (Cache-Clear/Recompile = Fix)"
    - "UAT-/Spec-Wording auf den lokalisierten Titel („Aktivität" auf DE) statt des englischen msgid korrigieren"
  debug_session: ".planning/debug/activity-detail-header-title.md"

- gap_id: G-11-3
  truth: "Bei Tag-Auswahl steht das Tag-Label als echter Text (Value) im Titel-Input — editierbar, nicht nur Placeholder; die Klammer-Anmerkung im Titel-Feld entfällt"
  status: failed
  reason: "User reported: pass. aber ich will dass wenn man ein Tag will dieser dann als echter text im titel input steht und nicht nur wie aktuell als placeholder. und die anmerkung in den klammern bitte weggeben"
  severity: minor
  test: 3
  root_cause: "Works-as-designed (11-UI-SPEC.md L174): Tag→Titel-Kopplung ist placeholder-only in activity-create.tsx (L180–183, 228) — der title-State wird beim Tag-Toggle (L244–253) nie geschrieben; die Klammer-Anmerkung ist der Suffix des Placeholder-msgids in locales/{en,de}/messages.po L47. Validierung (canSubmitActivity, D-05) und Contract (createActivityBodySchema akzeptiert tagId+title) brauchen keine Änderung."
  artifacts:

    - path: "apps/mobile/app/activity-create.tsx"
      issue: "Placeholder-only-Kopplung (L180–183, 228); Tag-Chip-Handler (L244–253) schreibt title-State nicht"

    - path: "apps/mobile/lib/activity-form.ts"
      issue: "Ziel für neue pure Tag-Wechsel→Titel-Regel (node-testbar); buildClonePrefill mountet bereits Tag+Titel gleichzeitig — Regel muss title === Tag-Label beim Mount tolerieren"

    - path: "apps/mobile/locales/en/messages.po"
      issue: "Annotation-msgid (L47) nach Entfernen der Usage via lingui extract droppen"

    - path: "apps/mobile/locales/de/messages.po"
      issue: "Annotation-msgid (L47) nach Entfernen der Usage via lingui extract droppen"

    - path: ".planning/workstreams/mobile/phases/11-activities/11-UI-SPEC.md"
      issue: "Copy-Tabelle L174 (D-05-Placeholder-Preview) an neues Prefill-Verhalten anpassen"
  missing:

    - "Pure Helper in activity-form.ts: Tag-Select schreibt tag.title als title-Value nur wenn Feld leer oder noch exakt gleich dem Label des vorherigen Tags (User-Text nie überschreiben); Deselect/Switch ersetzt/leert nur bei exaktem Match"
    - "Tag-selected-Placeholder-Branch entfernen — Placeholder bleibt unconditional „e.g. beer pong by the pavilion"; Klammer-Anmerkung entfällt ersatzlos"
    - "Default (ADR-012-erhaltend, im Plan ausweisen): beim Submit title auf null setzen, wenn er noch exakt selectedTag.title entspricht → per-locale Server-Auto-Titel (10-04) bleibt erhalten"
    - "Test: Clone-Mount mit title === Tag-Label bricht die Prefill-Regel nicht"
  debug_session: ".planning/debug/create-title-tag-prefill.md"

## Deferred Follow-Ups

- test: 4
  idea: "es wäre aber auch cool wenn man optional einen link für einen standort eingeben kann. wenn ich zb auf google maps einen ort markiere kann ich das als link kopieren. so könnten leute standorte hinterlegen an denen sie sich gerade nicht befinden."
  deferred_at: 2026-08-16
