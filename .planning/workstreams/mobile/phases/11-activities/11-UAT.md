---
status: testing
phase: 11-activities
source: [11-VERIFICATION.md]
started: 2026-08-15T17:30:00Z
updated: 2026-08-15T17:30:00Z
---

## Current Test

number: 1
name: Activities-Tab — echte Daten, zwei Sektionen
expected: |
  „Deine Aktivitäten" gestapelt über „Wer kommt mit?"; eigene gestartete Aktivität
  trägt den „Gestartet"-Chip und steht am Sektionsende; Karte ohne Kapazität zeigt
  keinen Plätze-Hinweis; beigetretener Eintrag trägt das „Dabei"-Badge; jede Sektion
  löst Loading/Error/Empty unabhängig auf.
awaiting: user response

## Tests

### 1. Activities-Tab — echte Daten, zwei Sektionen (11-01 T1/T2)
expected: „Deine Aktivitäten" über „Wer kommt mit?"; „Gestartet"-Chip am Sektionsende; capacity-null ohne Plätze-Hinweis; „Dabei"-Badge; Sektionen unabhängig in Loading/Error/Empty.
result: [pending]

### 2. Push-Routen-Regression (11-01 T3)
expected: Karten-Tap öffnet /activity-detail als Push mit statischem „Activity"-Header und Zurück-Pfeil; Zurück landet am Tab; App-Kill + Relaunch vom Detail-Screen zeigt NIE Expo Routers Unmatched-Route-Screen.
result: [pending]

### 3. Create-Flow end-to-end inkl. D-05-Live-Regel und Idempotenz (SC1)
expected: Leer abschicken → Inline-Fehler unter Titel + Wann-Block (kein Toast); Tag wählen → Titel optional, Placeholder zeigt Tag-Label, Untertitel-Feld erscheint (Abwählen kehrt es um); Tag+Zeit → Submit → Aktivität erscheint in „Deine Aktivitäten"; Doppel-Tap auf Submit erzeugt GENAU eine Aktivität; Flugmodus + Submit → Fehlertext, Eingaben bleiben erhalten. Nach Submit landet der Detail-Screen (kein ewiges Loading — CR-01-Fix).
result: [pending]

### 4. Location-Capture Permission-Lifecycle (11-04 T2)
expected: System-Dialog genau einmal pro Create-Screen-Mount; Grant → „Pin location"-Tap wird zum entfernbaren „Location pinned"-Chip, Entfernen stellt den Button wieder her; Deny → Callout mit vollständiger Non-Tracking-Begründung + „Open Settings", Freitext bleibt tippbar, Aktivität weiterhin postbar; Remount nach Entscheidung → kein erneuter Prompt.
result: [pending]

### 5. Zwei-Account Join/Leave/Voll/Gestartet/Auflösen (WINDOWS.md #53 — SC2+SC3)
expected: Account C sieht Join bei voller Aktivität ECHT deaktiviert mit „Full — 2/2 spots"; Aktivität nach startTime zeigt „Already started"; Creator A sieht rotes Auflösen (nie Verlassen) → nativer Confirm-Dialog nennt Teilnehmerzahl → nach Confirm landet A am Activities-Tab, Aktivität aus beiden Listen verschwunden; capacity-1-Aktivität ist direkt nach Erstellung voll (ACT-03-Annahme). Join/Leave aktualisiert Sitzzähler sofort; Kill + Relaunch zeigt weiterhin korrekten Stand.
result: [pending]

### 6. Teilnehmerliste + Sitzzeile (WINDOWS.md #52)
expected: Creator zuerst (Join-Reihenfolge), kein Creator-Badge; frische Aktivität zeigt „Nobody else yet." statt Ein-Zeilen-Liste; unbegrenzte vs. nummerierte Sitzzeilen-Variante; lange Beschreibung bricht vollständig um (keine Truncation).
result: [pending]

### 7. Klonen + Routen-Handoff (WINDOWS.md #54 — SC4+SC5)
expected: Fremdes Detail → Clone → Formular prefilled (Tag/Titel/Untertitel/Beschreibung/Freitext-Ort/Kapazität), startTime LEER, Geo LEER; Zurück landet am Quell-Detail. D-15-Lesart explizit bestätigen: Freitext-Ort BLEIBT, nur Geo + Zeit geleert. Detail mit Geo: „Open route" neben dem Freitext → öffnet Karten-App/Chooser am Punkt; ohne Geo: nur Freitext, keine Routen-Affordance; weder Ort noch Geo: Treffpunkt-Block komplett absent.
result: [pending]

### 8. Formular-Primitives unter Last + EN-Locale (WINDOWS.md #49/#50 + Backstops)
expected: Ein-Tages-Festival = genau ein Tages-Chip; langes Festival wrappt die Chip-Reihe; Kapazität startet „no limit", Minus tot bei 1; lange Tag-Labels sprengen die Pille nicht; leere Tag-Liste lässt Layout intakt (Titel-Pflicht-Pfad); Gerät auf EN wechselt alle Chrome-Texte, user-eingegebene Titel/Beschreibungen bleiben wörtlich (ADR-012/020); Location-Fehler ohne Permission-Grund fällt sauber auf Freitext zurück.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
