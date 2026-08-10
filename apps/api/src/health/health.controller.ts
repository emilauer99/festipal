import { Controller } from '@nestjs/common';
import { contract } from '@quiks/contracts';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

@Controller()
export class HealthController {
  // SEC-01: the only anonymous-baseline endpoint besides better-auth's own
  // /api/auth/* routes (which self-manage auth and never hit this guard).
  @AllowAnonymous()
  @TsRestHandler(contract.health)
  health() {
    return tsRestHandler(contract.health, async () => ({
      status: 200,
      body: { status: 'ok' as const },
    }));
  }
}
