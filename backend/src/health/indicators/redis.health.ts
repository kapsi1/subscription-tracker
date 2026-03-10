import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';;
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    super();
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  /**
   * Sends a PING to Redis and checks that it replies with PONG.
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.redis.ping();
      if (result !== 'PONG') {
        throw new Error(`Unexpected Redis PING response: ${result}`);
      }
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, { message: String(error) }),
      );
    }
  }

  /**
   * Clean up the Redis connection when the application shuts down.
   */
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
