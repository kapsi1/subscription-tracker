import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import type { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Executes a lightweight `SELECT 1` query against the database to
   * verify the connection is alive and responsive.
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Prisma health check failed',
        this.getStatus(key, false, { message: String(error) }),
      );
    }
  }
}
