import { Global, Module } from '@nestjs/common';
import { createDatabase, type Database } from '@quiks/db';

import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

export const DB = Symbol('DB');

@Global()
@Module({
  providers: [
    {
      provide: DB,
      useFactory: (env: Env): Database => createDatabase(env.DATABASE_URL),
      inject: [ENV],
    },
  ],
  exports: [DB],
})
export class DbModule {}
