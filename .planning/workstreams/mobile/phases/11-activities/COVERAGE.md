# API Coverage — Activities (first-party ts-rest surface) + `expo-location` SDK

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Two surfaces are decided here: the **eight shipped Phase-10 activity endpoints** that this
> mobile phase consumes, and the **`expo-location` SDK** capability surface (the phase's one
> third-party native integration, D-13).

## Surface 1 — `packages/contracts` activity endpoints (Phase 10, shipped)

| capability | decision | reason |
|---|---|---|
| `listActivityTags` | INTEGRATE | tag chip row in the create form (ACT-06), plan 11-04 |
| `createActivity` | INTEGRATE | create screen (ACT-01), plan 11-04 |
| `listActivities` | INTEGRATE | "Wer kommt mit?" section (ACT-02), plan 11-01 |
| `listMyActivities` | INTEGRATE | "Deine Aktivitäten" section (ACT-02/D-01), plan 11-01 |
| `getActivity` | INTEGRATE | detail push screen (ACT-02), plans 11-01 + 11-05 |
| `joinActivity` | INTEGRATE | join action (ACT-03), plan 11-05 |
| `leaveActivity` | INTEGRATE | leave action (ACT-03), plan 11-05 |
| `deleteActivity` | INTEGRATE | creator-only "Auflösen" (D-11), plan 11-05 |

Zero opt-outs — all eight endpoints of the surface are wired in this phase.

**Endpoint query parameters:**

| capability | decision | reason |
|---|---|---|
| `locale` query param on the four read endpoints | OPT-OUT | not needed — the server falls back to the festival's `defaultLocale` when the param is absent, and the app has no UI to request a content locale different from the festival's own (ADR-012 two-axis rule: UI locale is a device concern, content locale is a festival concern). Revisit when a per-user content-locale preference exists. |

## Surface 2 — `expo-location` SDK

| capability | decision | reason |
|---|---|---|
| `requestForegroundPermissionsAsync` / `useForegroundPermissions` | INTEGRATE | three-state permission gate (D-13), plan 11-04 |
| `getCurrentPositionAsync` | INTEGRATE | the one-off opt-in position read (ACT-05/D-13), plan 11-04 |
| `watchPositionAsync` | OPT-OUT | explicitly out of scope and prohibited — a continuous position subscription is exactly the presence tracking ADR-017 §2 / ADR-014 forbid |
| background location (`startLocationUpdatesAsync`, `TaskManager` integration) | OPT-OUT | explicitly out of scope and prohibited — same ADR-017 §2 / ADR-014 boundary; also would require a second, far heavier OS permission tier |
| `requestBackgroundPermissionsAsync` | OPT-OUT | explicitly out of scope — no background capability is integrated, so its permission must never be asked for |
| `geocodeAsync` / `reverseGeocodeAsync` | OPT-OUT | not needed — the free-text meeting point is user prose (ADR-012: never machine-derived, never translated), and the route hand-off uses the raw coordinate pair |
| `getLastKnownPositionAsync` | OPT-OUT | not needed yet — a stale cached fix would silently pin the wrong meeting point; the capture is an explicit one-tap act and must reflect where the user is at that moment |
| `hasServicesEnabledAsync` | OPT-OUT | not needed — a position read that fails because location services are off falls back to the un-captured state (UI-SPEC E5 error row, `verification: backstop`); no separate pre-flight probe is introduced |
| `enableNetworkProviderAsync` (Android) | OPT-OUT | not needed — the phase never prompts the user to change OS-level location settings beyond the standard `Linking.openSettings()` escape in the denied callout |
| `Location.Accuracy` tuning | OPT-OUT | not needed — the default accuracy is sufficient for a festival-ground meeting point; a higher tier costs battery and fix latency for no user-visible gain |

## Surface 3 — external maps app hand-off

| capability | decision | reason |
|---|---|---|
| `Linking.openURL` with a platform-native route URI | INTEGRATE | "Route öffnen" (ACT-05/D-14), plans 11-02 (builder) + 11-05 (call site) |
| in-app map rendering (MapLibre) | OPT-OUT | explicitly out of scope — MapLibre arrives with the map milestone; D-13/D-16 deliberately chose the OS hand-off over an in-app map for this phase |
| turn-by-turn / waypoint / travel-mode parameters | OPT-OUT | not needed — the hand-off passes a destination coordinate only and lets the user's own maps app own the routing decision (D-14) |
