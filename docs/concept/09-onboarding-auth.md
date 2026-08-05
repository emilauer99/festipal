# 09 — Onboarding & Auth-Flows

> **Zweck:** Die konkreten Anmelde-/Onboarding-Flows für **App-Nutzer** und **Staff/Admin**.
> Verbindlich als **ADR-009** (Auth) + **ADR-016** (Profil). Stand: 2026-07-29. Noch kein Code.
>
> **Screen-Designs (Visitor-Flow):** [`designs/auth/`](designs/auth/) — Welcome, E-Mail, Code,
> Profil als 8 Frames in dark+light (inkl. Lade-, Fehler- und Username-Check-Zuständen),
> aus Claude Design importiert 2026-08-04. `preview.html` öffnen. Staff/Admin-Screens folgen
> im Admin-Zyklus. Bau der RN-Screens später via `/gsd-ui-phase` → `apps/mobile`.

---

## 1. Grundsatz: **login-first**

- Die App ist **login-first**: Anmeldung **vor** Nutzung, **kein** anonymes Browsen. Festivals,
  Timetable, Aktivitäten etc. sieht/nutzt man erst nach Login.
- Die Anmeldung ist bewusst **niederschwellig** (OTP, keine Passwort-Hürde), damit login-first
  nicht bremst.

---

## 2. App-Nutzer (Visitor) — passwortloses OTP

1. **Welcome** — Wortmarke, „Los geht's". Sprache = Systemsprache (ADR-012).
2. **E-Mail eingeben** → „Code senden".
3. **Code eingeben** (6-stellig) → verifiziert + eingeloggt. Aktionen: **Resend**, **E-Mail ändern**.
4. **Profil vervollständigen** *(nur beim ersten Mal)*
   - **Pflicht:** `username` (Live-Verfügbarkeits-Check), `displayName`.
   - **Optional:** `avatar` (Upload *oder* Kamera; sonst Initialen-Kachel), `socials[]` +
     `socialsVisibility` (`everyone`/`friends`).
   - *`birthDate`/`gender` bewusst noch nicht* (→ Birgit).
5. **Fertig** → Fassade (Tab *Festivals*).

**Bestandskonto** (E-Mail hat schon ein `VisitorProfile`) → Schritt 4 entfällt, direkt rein.

**Edge Cases:** Code falsch/abgelaufen → Fehler + Resend; **Rate-Limit** auf Code-Anforderung;
E-Mail im Code-Schritt änderbar.

---

## 3. Staff/Admin (Admin-Web, Next.js)

1. **Login:** E-Mail **+ Passwort** — *oder* „Code per E-Mail" (OTP). Beide Wege (ADR-009).
2. **Einladung annehmen:** Invite-Link (E-Mail) → **Passwort setzen** (oder OTP nutzen) →
   `FestivalStaff`-Rolle aktiv (ADR-018).
3. **Passwort vergessen:** Reset per E-Mail (Code/Link).
4. **Nach Login:** bei mehreren Festivals / Platform-Admin → **Festival-Auswahl** → Tenant-Workspace.

---

## 4. Session & Re-Auth

- Mobil **langlebig** (Refresh-Token) — bleibt eingeloggt; bei Ablauf **Re-Auth via OTP**.
- **Logout** vorhanden (App + Admin).

---

## 5. Username-Regeln

- **3–20 Zeichen**, erlaubt `a–z 0–9 _ .`, **case-insensitive eindeutig**, **Live-Verfügbarkeits-Check**
  im Profil-Schritt.

---

## 6. Offen / später

- **`birthDate` / `gender`** — erst nach Birgits Safety-Konzept (B2).
- **Konto-Löschung / DSGVO-Export** — vor Store-Release ausarbeiten (Recht).
- **SSO (Google/Apple)** — 2027 (ADR-009), account-linking-fähig vorgehalten.
