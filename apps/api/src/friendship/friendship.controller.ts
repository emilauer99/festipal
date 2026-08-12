import { Controller } from '@nestjs/common';
import { contract } from '@quiks/contracts';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

import { FriendshipService } from './friendship.service';

@Controller()
export class FriendshipController {
  constructor(private readonly friendship: FriendshipService) {}

  // Carries no anonymous-access decorator, so it inherits the global AuthGuard
  // (SEC-01): a missing or invalid session is 401 before this body runs. The
  // caller's identity comes ONLY from `session.user.id` (T-07-02). The path parameter
  // names the TARGET, never the actor — accepting an actor id from the request
  // is the "Client-Supplied Scope" anti-pattern (ARCHITECTURE.md).
  @TsRestHandler(contract.lookupVisitor)
  lookupVisitor(@Session() session: UserSession) {
    return tsRestHandler(contract.lookupVisitor, async ({ params }) => {
      const summary = await this.friendship.lookupByUsername(session.user.id, params.username);
      if (!summary) {
        return { status: 404, body: { message: 'No visitor with that handle' } };
      }
      return { status: 200, body: summary };
    });
  }

  // Same posture: no anonymous-access decorator, so the global AuthGuard makes a
  // sessionless request a 401 before this body runs. `q` is the only thing the
  // request contributes (D-05: no visibility parameter exists to pass); the
  // caller whose relation is resolved comes ONLY from `session.user.id`, so a
  // client cannot ask for the relation graph from somebody else's perspective
  // (T-07-11). No 404 branch — a search without hits is an empty list.
  @TsRestHandler(contract.searchVisitors)
  searchVisitors(@Session() session: UserSession) {
    return tsRestHandler(contract.searchVisitors, async ({ query }) => {
      const hits = await this.friendship.searchByUsername(session.user.id, query.q);
      return { status: 200, body: hits };
    });
  }
}
