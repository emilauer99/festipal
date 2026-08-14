import { Controller } from '@nestjs/common';
import { contract } from '@quiks/contracts';
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
}
