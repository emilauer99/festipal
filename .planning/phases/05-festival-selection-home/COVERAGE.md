# Phase 5 — API Coverage

No external API integration: Phase 5 only consumes festipal's own NestJS backend via the
in-repo ts-rest contract (`packages/contracts`) — the coverage detector fired on the internal
"api integration suite" test name and the "expo-router/ui Tabs API" prohibition, neither of
which is a third-party API/SDK/service. `expo-blur` is a first-party Expo effect package (no
service integration). No coverage matrix is required.
</content>
</invoke>
