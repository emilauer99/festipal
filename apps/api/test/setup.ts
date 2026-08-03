import 'reflect-metadata';
import 'dotenv/config';
// Must come before any import that (transitively) pulls in config/env.ts —
// see the comment inside for why this is an import, not a plain statement.
import './force-otp-dev-transport';

import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { createDatabase, type Database } from '@festipal/db';

import { AppModule } from '../src/app.module';

/**
 * Integration-test Drizzle client, backed by a real Neon connection.
 * Prefers the DIRECT (unpooled) URL — integration specs open/close many
 * short-lived connections and shouldn't compete with pgBouncer's pooled
 * connection limits (see packages/db/src/client.ts for the pooled-vs-direct
 * distinction).
 */
export function createTestDatabase(): Database {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL_UNPOOLED or DATABASE_URL must be set to run integration tests (see apps/api/.env.example)',
    );
  }
  return createDatabase(connectionString);
}

/**
 * Boots a full NestJS application (AppModule) via @nestjs/testing for
 * Supertest-driven integration specs. Caller owns the app's lifecycle and
 * MUST call `app.close()` (e.g. in `afterAll`).
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}
