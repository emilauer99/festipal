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

  // The four lifecycle transitions. All of them read the actor from the session
  // ONLY — `targetAccountId`/`params.accountId` always names the counterpart
  // (T-07-12). None of them throws for an expected conflict: the service returns
  // a discriminated union and every branch becomes a status code here, so a
  // duplicate request or a missing profile can never surface as a 500.
  @TsRestHandler(contract.sendFriendRequest)
  sendFriendRequest(@Session() session: UserSession) {
    return tsRestHandler(contract.sendFriendRequest, async ({ body }) => {
      const result = await this.friendship.sendRequest(session.user.id, body.targetAccountId);
      if (result.status === 'self') {
        return { status: 409, body: { message: 'You cannot send a friend request to yourself' } };
      }
      if (result.status === 'not-found') {
        return { status: 404, body: { message: 'No visitor with that account' } };
      }
      if (result.status === 'profile-required') {
        return {
          status: 409,
          body: { message: 'Complete your visitor profile before sending friend requests' },
        };
      }
      // `requested` or `friends` — D-10 decides which, and both are successes.
      return { status: 200, body: { result: result.status } };
    });
  }

  @TsRestHandler(contract.acceptFriendRequest)
  acceptFriendRequest(@Session() session: UserSession) {
    return tsRestHandler(contract.acceptFriendRequest, async ({ params }) => {
      const result = await this.friendship.acceptRequest(session.user.id, params.accountId);
      // Also the answer for "that is your OWN outgoing request" — one message for
      // both, so the response does not disclose which case applies (T-07-15).
      if (result.status === 'not-found') {
        return { status: 404, body: { message: 'No incoming friend request from that visitor' } };
      }
      return { status: 200, body: { result: result.status } };
    });
  }

  // Decline and withdraw answer identically whether or not a request existed —
  // no 404 branch exists to reveal it (T-07-15), and no cooldown follows (D-11).
  @TsRestHandler(contract.declineFriendRequest)
  declineFriendRequest(@Session() session: UserSession) {
    return tsRestHandler(contract.declineFriendRequest, async ({ params }) => {
      const result = await this.friendship.declineRequest(session.user.id, params.accountId);
      return { status: 200, body: { result: result.status } };
    });
  }

  @TsRestHandler(contract.withdrawFriendRequest)
  withdrawFriendRequest(@Session() session: UserSession) {
    return tsRestHandler(contract.withdrawFriendRequest, async ({ params }) => {
      const result = await this.friendship.withdrawRequest(session.user.id, params.accountId);
      return { status: 200, body: { result: result.status } };
    });
  }

  // The two list endpoints take NO parameter at all — there is no path, query or
  // body value a client could set to ask for somebody else's friends or pending
  // requests, and the scope is `session.user.id` inside the join condition
  // itself (T-07-19, ARCHITECTURE.md "Client-Supplied Scope"). Neither has a 404
  // branch: an empty relationship set is a normal state of the resource.
  @TsRestHandler(contract.listFriends)
  listFriends(@Session() session: UserSession) {
    return tsRestHandler(contract.listFriends, async () => {
      const friends = await this.friendship.listFriends(session.user.id);
      return { status: 200, body: friends };
    });
  }

  @TsRestHandler(contract.listFriendRequests)
  listFriendRequests(@Session() session: UserSession) {
    return tsRestHandler(contract.listFriendRequests, async () => {
      const lists = await this.friendship.listRequests(session.user.id);
      return { status: 200, body: lists };
    });
  }

  // `:accountId` is the COUNTERPART here too, never the actor — the caller is
  // always one half of the pair, so a friendship they are not part of cannot be
  // addressed (T-07-20). Single 200 branch, so the answer cannot disclose
  // whether there was a friendship to end (T-07-21).
  @TsRestHandler(contract.unfriend)
  unfriend(@Session() session: UserSession) {
    return tsRestHandler(contract.unfriend, async ({ params }) => {
      const result = await this.friendship.unfriend(session.user.id, params.accountId);
      return { status: 200, body: { result: result.status } };
    });
  }
}
