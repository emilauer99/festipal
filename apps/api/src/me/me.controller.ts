import { Controller } from '@nestjs/common';
import { contract } from '@quiks/contracts';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

import { MeService } from './me.service';

@Controller()
export class MeController {
  constructor(private readonly me: MeService) {}

  // No @AllowAnonymous() — inherits the global AuthGuard (SEC-01). A missing
  // or invalid session returns 401 before this method body ever runs.
  @TsRestHandler(contract.getMe)
  getMe(@Session() session: UserSession) {
    return tsRestHandler(contract.getMe, async () => {
      const profile = await this.me.getProfile(session.user.id);
      return {
        status: 200,
        // D-04: `createdAt` comes straight off better-auth's session user (a
        // runtime `Date`) — no extra DB query. The `.toISOString()` is
        // DELIBERATE and must stay explicit: `meSchema` declares this field as
        // a string, and leaving the conversion to JSON.stringify would let the
        // TypeScript type disagree with the wire shape. T-06-10: server-derived
        // only, never read from a request body.
        body: {
          accountId: session.user.id,
          email: session.user.email,
          createdAt: session.user.createdAt.toISOString(),
          profile,
        },
      };
    });
  }

  // First-login profile completion (Pitfall 11). `completeProfile` is the
  // TOCTOU-safe source of truth — a duplicate username maps to a clean 409,
  // never a thrown 500 (see me.service.ts).
  @TsRestHandler(contract.completeProfile)
  completeProfile(@Session() session: UserSession) {
    return tsRestHandler(contract.completeProfile, async ({ body }) => {
      const result = await this.me.completeProfile(session.user.id, body);
      if (result.status === 'conflict') {
        return { status: 409, body: { message: 'Username already taken' } };
      }
      return { status: 200, body: result.profile };
    });
  }

  // Advisory only (Pitfall 11) — `completeProfile`'s DB unique index is authoritative.
  @TsRestHandler(contract.usernameAvailability)
  usernameAvailability() {
    return tsRestHandler(contract.usernameAvailability, async ({ query }) => {
      const available = await this.me.checkUsernameAvailability(query.username);
      return { status: 200, body: { available } };
    });
  }

  // SEC-02: scope comes only from the session — never a request param.
  @TsRestHandler(contract.listMyFestivals)
  listMyFestivals(@Session() session: UserSession) {
    return tsRestHandler(contract.listMyFestivals, async () => {
      const festivals = await this.me.listMyFestivals(session.user.id);
      return { status: 200, body: festivals };
    });
  }
}
