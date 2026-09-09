import { Controller, Get, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/roles.decorator';
import { WinstonLoggerService } from '../common/logger';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@Controller()
export class HealthController implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(WinstonLoggerService)
    private readonly logger: WinstonLoggerService,
  ) {}

  onModuleInit() {
    this.logger.log('Health controller initialized');
  }

  @Get('health')
  @Public()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @Public()
  async getReadiness() {
    const checks: Record<string, { status: string; latencyMs: number }> = {};

    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'healthy', latencyMs: Date.now() - dbStart };
    } catch {
      checks.database = { status: 'unhealthy', latencyMs: Date.now() - dbStart };
    }

    const redisStart = Date.now();
    try {
      if (this.redis.isConnected()) {
        await this.redis.get('__health_check__');
        checks.redis = { status: 'healthy', latencyMs: Date.now() - redisStart };
      } else {
        checks.redis = { status: 'unhealthy', latencyMs: Date.now() - redisStart };
      }
    } catch {
      checks.redis = { status: 'unhealthy', latencyMs: Date.now() - redisStart };
    }

    const allHealthy = Object.values(checks).every(c => c.status === 'healthy');

    return {
      status: allHealthy ? 'ready' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
