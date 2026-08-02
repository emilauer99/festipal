import { Controller } from '@nestjs/common';
import { contract } from '@festipal/contracts';
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
        body: { accountId: session.user.id, email: session.user.email, profile },
      };
    });
  }
}
