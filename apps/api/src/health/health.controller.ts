import { Controller } from '@nestjs/common';
import { contract } from '@festipal/contracts';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

@Controller()
export class HealthController {
  @TsRestHandler(contract.health)
  health() {
    return tsRestHandler(contract.health, async () => ({
      status: 200,
      body: { status: 'ok' as const },
    }));
  }
}
