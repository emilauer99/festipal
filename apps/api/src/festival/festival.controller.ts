import { Controller } from '@nestjs/common';
import { contract } from '@festipal/contracts';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

import { FestivalService } from './festival.service';

@Controller()
export class FestivalController {
  constructor(private readonly festivals: FestivalService) {}

  @TsRestHandler(contract.getFestival)
  getFestival() {
    return tsRestHandler(contract.getFestival, async ({ params }) => {
      const found = await this.festivals.getBySlug(params.slug);
      if (!found) {
        return { status: 404, body: { message: 'Festival not found' } };
      }
      return { status: 200, body: found };
    });
  }

  @TsRestHandler(contract.listTags)
  listTags() {
    return tsRestHandler(contract.listTags, async ({ params, query }) => {
      const tags = await this.festivals.listTags(params.festivalId, query.locale);
      return { status: 200, body: tags };
    });
  }

  // Browse: session-required (no @AllowAnonymous — inherits the global
  // AuthGuard, SEC-01) but unscoped — ALL currently-seeded festivals, no
  // save-gated fields. Distinct contract from `GET /me/festivals` (Pitfall 4).
  @TsRestHandler(contract.listFestivals)
  listFestivals() {
    return tsRestHandler(contract.listFestivals, async () => {
      const festivals = await this.festivals.listAll();
      return { status: 200, body: festivals };
    });
  }

  // Gate-less save (ADR-014): the only gate is the global AuthGuard. Scope
  // comes only from the session — never a client-supplied visitorId.
  @TsRestHandler(contract.saveFestival)
  saveFestival(@Session() session: UserSession) {
    return tsRestHandler(contract.saveFestival, async ({ params }) => {
      const result = await this.festivals.save(session.user.id, params.festivalId);
      if (result.status === 'not-found') {
        return { status: 404, body: { message: 'Festival not found' } };
      }
      return { status: 200, body: { saved: true } };
    });
  }
}
