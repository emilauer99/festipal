import { Controller } from '@nestjs/common';
import { contract } from '@festipal/contracts';
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
}
