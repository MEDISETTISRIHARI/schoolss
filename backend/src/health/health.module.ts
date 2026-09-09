import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.service';
import { WinstonModule } from '../common/logger/winston.module';

@Module({
  imports: [PrismaModule, RedisModule, WinstonModule],
  controllers: [HealthController],
  providers: [],
  exports: [],
})
export class HealthModule {}
