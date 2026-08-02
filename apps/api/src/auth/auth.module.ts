import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { auth } from './auth.instance';

/**
 * Wraps `@thallesp/nestjs-better-auth`'s `AuthModule.forRoot()` (RESEARCH.md
 * Pattern 1). Since `main.ts` disables NestJS's built-in body parser
 * (`bodyParser: false`, required so better-auth's own routes see unparsed
 * request streams), this module's `bodyParser` option re-applies
 * `express.json()`/`urlencoded()` for every non-auth route. It also
 * registers the global `AuthGuard` (via `APP_GUARD`) every controller
 * inherits protected-by-default (SEC-01) unless tagged `@AllowAnonymous()`.
 */
@Module({
  imports: [
    BetterAuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
      },
    }),
  ],
})
export class AuthModule {}
