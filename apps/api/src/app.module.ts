import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { FestivalModule } from './festival/festival.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ConfigModule, DbModule, FestivalModule],
  controllers: [HealthController],
})
export class AppModule {}
