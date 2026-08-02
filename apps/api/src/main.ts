import 'reflect-metadata';
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  // bodyParser: false — @thallesp/nestjs-better-auth needs unparsed request
  // streams for better-auth's own routes; AuthModule.forRoot's `bodyParser`
  // option (auth/auth.module.ts) re-applies express.json()/urlencoded() for
  // every non-auth route.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  await app.listen(env.PORT);
  console.log(`festipal api listening on http://localhost:${env.PORT}`);
}

void bootstrap();
