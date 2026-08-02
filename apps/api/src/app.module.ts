import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { FestivalModule } from './festival/festival.module';
import { HealthController } from './health/health.controller';
import { MeModule } from './me/me.module';

@Module({
  imports: [ConfigModule, DbModule, AuthModule, FestivalModule, MeModule],
  controllers: [HealthController],
})
export class AppModule {}
