import { Controller } from '@nestjs/common';
import { contract } from '@quiks/contracts';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

import { ActivityService } from './activity.service';

@Controller()
export class ActivityController {
  constructor(private readonly activities: ActivityService) {}

  // festivalId comes exclusively from the path — no request body/query can
  // name a different festival (ARCHITECTURE.md §Anti-Patterns "Client-Supplied
  // Scope").
  @TsRestHandler(contract.listActivityTags)
  listActivityTags() {
    return tsRestHandler(contract.listActivityTags, async ({ params, query }) => {
      const tags = await this.activities.listEffectiveTags(params.festivalId, query.locale);
      return { status: 200, body: tags };
    });
  }

  // creatorId comes ONLY from the session, festivalId ONLY from the path —
  // `createActivityBodySchema` declares neither key, so a body-supplied value
  // is structurally impossible to read here (ARCHITECTURE.md §Anti-Patterns
  // "Client-Supplied Scope").
  @TsRestHandler(contract.createActivity)
  createActivity(@Session() session: UserSession) {
    return tsRestHandler(contract.createActivity, async ({ params, body, query }) => {
      const result = await this.activities.create(
        session.user.id,
        params.festivalId,
        body,
        query.locale,
      );
      switch (result.status) {
        case 'ok':
          return { status: 201, body: result.activity };
        case 'festival-not-found':
          return { status: 404, body: { message: 'Festival not found' } };
        case 'tag-not-found':
          return { status: 404, body: { message: 'Tag not found' } };
        case 'profile-required':
          return { status: 409, body: { message: 'Visitor profile required' } };
        case 'invalid':
          return { status: 409, body: { message: 'Activity data invalid' } };
      }
    });
  }

  // visitorId comes ONLY from the session; festivalId/activityId ONLY from
  // the path (ARCHITECTURE.md §Anti-Patterns "Client-Supplied Scope").
  @TsRestHandler(contract.joinActivity)
  joinActivity(@Session() session: UserSession) {
    return tsRestHandler(contract.joinActivity, async ({ params }) => {
      const result = await this.activities.join(session.user.id, params.festivalId, params.activityId);
      switch (result.status) {
        case 'joined':
          return { status: 200, body: { result: 'joined' } };
        case 'not-found':
          return { status: 404, body: { message: 'Activity not found' } };
        case 'full':
          return { status: 409, body: { message: 'Activity is full' } };
        case 'started':
          return { status: 409, body: { message: 'Activity has already started' } };
        case 'profile-required':
          return { status: 409, body: { message: 'Visitor profile required' } };
      }
    });
  }

  @TsRestHandler(contract.leaveActivity)
  leaveActivity(@Session() session: UserSession) {
    return tsRestHandler(contract.leaveActivity, async ({ params }) => {
      const result = await this.activities.leave(session.user.id, params.festivalId, params.activityId);
      switch (result.status) {
        case 'removed':
          return { status: 200, body: { result: 'removed' } };
        case 'creator':
          return { status: 409, body: { message: 'The creator cannot leave their own activity' } };
      }
    });
  }

  @TsRestHandler(contract.deleteActivity)
  deleteActivity(@Session() session: UserSession) {
    return tsRestHandler(contract.deleteActivity, async ({ params }) => {
      const result = await this.activities.remove(session.user.id, params.festivalId, params.activityId);
      switch (result.status) {
        case 'removed':
          return { status: 200, body: { result: 'removed' } };
        case 'not-found':
          return { status: 404, body: { message: 'Activity not found' } };
        case 'not-creator':
          return { status: 409, body: { message: 'Only the creator can delete this activity' } };
      }
    });
  }
}
