# API Coverage — Phase 08 Friends

No external API integration: Phase 8 ist reine Mobile-UI gegen die **projekteigene** NestJS-API über
den bereits vorhandenen ts-rest-Client (`apps/mobile/lib/api-client.ts`, Contract in
`packages/contracts`) — kein Drittanbieter-API, kein externes SDK, kein Webhook, keine
OAuth-Integration. Die einzige neue native Fähigkeit ist die **lokale Gerätekamera** (`expo-camera`),
die kein Netzwerkdienst ist.

Der deterministische Detektor (`api-coverage.cjs`) über CONTEXT + ROADMAP-Abschnitt lieferte
`{"detected": false}` am 2026-08-13. Diese Erklärung steht hier, weil die PLAN-Bodies dieser Phase
die Wörter „Endpunkt"/„API"/„konsumieren" naturgemäß häufig tragen und der Seal-Time-Detektor
sonst über den Plan-Text erneut anschlagen könnte — sie tritt laut Checkpoint-Protokoll an die
Stelle einer Matrix und ist keine Opt-out-Liste.

Die neun konsumierten Endpunkte gehören alle zu diesem Projekt und wurden in Phase 7 gebaut:
`searchVisitors`, `lookupVisitor`, `sendFriendRequest`, `acceptFriendRequest`,
`declineFriendRequest`, `withdrawFriendRequest`, `listFriends`, `listFriendRequests`, `unfriend`.
Phase 8 ruft sie auf; sie ändert `packages/contracts` nicht.
