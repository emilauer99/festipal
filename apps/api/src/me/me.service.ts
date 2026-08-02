import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { visitorProfile, type Database } from '@festipal/db';
import type { VisitorProfilePublic } from '@festipal/contracts';

import { DB } from '../db/db.module';

@Injectable()
export class MeService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Returns null for "no profile yet" (first login, needs complete-profile). */
  async getProfile(accountId: string): Promise<VisitorProfilePublic | null> {
    const [row] = await this.db
      .select({
        accountId: visitorProfile.accountId,
        username: visitorProfile.username,
        displayName: visitorProfile.displayName,
        avatar: visitorProfile.avatar,
      })
      .from(visitorProfile)
      .where(eq(visitorProfile.accountId, accountId))
      .limit(1);
    return row ?? null;
  }
}
