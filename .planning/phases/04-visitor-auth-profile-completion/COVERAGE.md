# Phase 4 — API Coverage

No external API integration: Phase 4 consumes the project's own ts-rest/Zod contract
endpoints (`GET /me`, `POST /me/complete-profile`, `GET /me/username-availability`) derived
from `packages/contracts`, plus better-auth's own OTP routes (already wired in Phase 2/3) and
standard Expo libraries (`expo-image-picker`, `expo-image`, `react-native-mmkv`, `expo-font`,
`lucide-react-native`) — not a third-party API surface.

The Full-API-Coverage checkpoint (external third-party API/SDK/service integration) therefore
does not fire for this phase. Dependency legitimacy for the five newly-added npm packages is
handled by the `blocking-human` package-legitimacy checkpoint in plan `04-01` (see RESEARCH.md
`## Package Legitimacy Audit`).
