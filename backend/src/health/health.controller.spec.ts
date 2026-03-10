import { TerminusModule } from '@nestjs/terminus';
import { Test, type TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaHealth: PrismaHealthIndicator;
  let redisHealth: RedisHealthIndicator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaHealthIndicator,
          useValue: {
            isHealthy: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
          },
        },
        {
          provide: RedisHealthIndicator,
          useValue: {
            isHealthy: jest.fn().mockResolvedValue({ redis: { status: 'up' } }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaHealth = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
    redisHealth = module.get<RedisHealthIndicator>(RedisHealthIndicator);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return healthy status when all checks pass', async () => {
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.info).toHaveProperty('database');
    expect(result.info).toHaveProperty('redis');
    expect(prismaHealth.isHealthy).toHaveBeenCalledWith('database');
    expect(redisHealth.isHealthy).toHaveBeenCalledWith('redis');
  });
});
