# API Coverage — Phase 09 Festival Navigation Shell

No external API integration: Phase 9 arbeitet ausschließlich gegen die **projekteigene** NestJS-API
über den bereits vorhandenen ts-rest-Client (`apps/mobile/lib/api-client.ts`, Contract in
`packages/contracts`). Es gibt kein Drittanbieter-API, kein externes SDK, keinen Webhook und keine
OAuth-Integration.

Der deterministische Detektor (`api-coverage.cjs`) über CONTEXT + ROADMAP-Abschnitt lieferte
`{"detected": false}` am 2026-08-13. Diese Erklärung steht hier, weil die PLAN-Bodies dieser Phase
die Wörter „Endpunkt", „API", „Contract" und „konsumieren" naturgemäß häufig tragen und der
Seal-Time-Detektor sonst über den Plan-Text erneut anschlagen könnte — sie tritt laut
Checkpoint-Protokoll an die Stelle einer Matrix und ist keine Opt-out-Liste.

Diese Phase **schreibt genau einen eigenen Endpunkt** (`GET /festivals/:festivalId/friends`,
Plan 09-02, D-18) und konsumiert ihn plus die bereits bestehenden `getFestival`, `listFriends`,
`getMe` und die Freundschafts-Mutationen aus Phase 7. Ein eigener Endpunkt in der eigenen API ist
per Definition keine externe API-Integration.

## Zwei Grenzfälle, ausdrücklich eingeordnet

- **`react-native-webview` + die Cashless-Adresse (Plan 09-06, ADR-011).** Der Screen bettet die
  vom Festival konfigurierte Seite in eine sandboxed WebView ein. Das ist ein **eingebettetes
  Web-Dokument**, keine API-Integration: die App ruft keine Endpunkte dieses Anbieters auf, kennt
  seine Fähigkeiten nicht, parst keine Antwort und tauscht keine Nachrichten mit der Seite aus
  (kein `injectedJavaScript`, kein `onMessage`). Eine Coverage-Matrix wäre hier sinnlos — es gibt
  keine Capability-Oberfläche, aus der etwas weggelassen werden könnte. Die Sicherheitsbetrachtung
  dieser Grenze steht stattdessen als STRIDE-Register in `09-06-PLAN.md` (T-09-22 bis T-09-25).
- **`lucide-react-native`, `expo-blur`, `expo-router`** — Bibliotheken, keine Netzwerkdienste.

## Neue Pakete dieser Phase

| Paket | Art | Gate |
|---|---|---|
| `react-native-webview` | native RN-Bibliothek | manuelles Paket-Legitimitäts-Checkpoint in `09-06-PLAN.md` (`T-09-SC`), plus nativer Rebuild aus `apps/mobile` |
</content>
