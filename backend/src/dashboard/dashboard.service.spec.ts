import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { BillingCycle } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaMock: any;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      subscription: {
        findMany: jest.fn(),
      },
      paymentHistory: {
        aggregate: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should calculate cost properly', async () => {
    prismaMock.subscription.findMany.mockResolvedValue([
      {
        amount: 120,
        billingCycle: BillingCycle.yearly,
        category: 'Cloud',
        nextBillingDate: new Date('2026-11-10T00:00:00.000Z'),
      },
      {
        amount: 15,
        billingCycle: BillingCycle.monthly,
        category: 'Video',
        nextBillingDate: new Date('2026-04-01T00:00:00.000Z'),
      },
    ]);
    prismaMock.paymentHistory.aggregate
      .mockResolvedValueOnce({
        _sum: { amount: 44.5 },
      })
      .mockResolvedValueOnce({
        _sum: { amount: 200 },
      });

    const res = await service.getSummary('user-1');
    expect(res.totalMonthlyCost).toBe(44.5);
    // 200 paid year-to-date + (Apr-Dec monthly 9 * 15) + one yearly payment (120)
    expect(res.totalYearlyCost).toBe(455);
    expect(res.categoryBreakdown['Cloud']).toBe(10);
    expect(res.categoryBreakdown['Video']).toBe(15);
  });
});
