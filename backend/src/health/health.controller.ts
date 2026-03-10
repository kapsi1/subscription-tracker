import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, type HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  /**
   * Comprehensive health check that verifies connectivity to all
   * critical infrastructure dependencies (Postgres via Prisma and Redis).
   *
   * Returns 200 when all checks pass, 503 when any dependency is down.
   */
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Application health check',
    description: 'Checks the health of the application and all its dependencies (database, Redis).',
  })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
