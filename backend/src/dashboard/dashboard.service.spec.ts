import { Test, type TestingModule } from '@nestjs/testing';
import { BillingCycle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaMock: {
    subscription: { findMany: jest.Mock };
    paymentHistory: { aggregate: jest.Mock; findMany: jest.Mock };
    user: { findUnique: jest.Mock };
  };

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
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prismaMock }],
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
    prismaMock.paymentHistory.findMany.mockResolvedValue([]);
    prismaMock.user.findUnique.mockResolvedValue({ currency: 'USD' });

    const res = await service.getSummary('user-1');
    expect(res.totalMonthlyCost).toBe(44.5);
    // 200 paid year-to-date + (Apr-Dec monthly 9 * 15) + one yearly payment (120)
    expect(res.totalYearlyCost).toBe(455);
    expect(res.categoryBreakdown.Cloud).toBe(10);
    expect(res.categoryBreakdown.Video).toBe(15);
  });

  it('should return done and upcoming monthly payments sorted by date', async () => {
    prismaMock.paymentHistory.findMany.mockResolvedValue([
      {
        id: 'history-1',
        subscriptionId: 'sub-1',
        amount: 9.99,
        currency: 'USD',
        paidAt: new Date('2026-03-05T00:00:00.000Z'),
        subscription: {
          id: 'sub-1',
          name: 'Video Stream',
          category: 'Entertainment',
        },
      },
    ]);

    prismaMock.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        name: 'Video Stream',
        amount: 9.99,
        currency: 'USD',
        billingCycle: BillingCycle.monthly,
        intervalDays: null,
        nextBillingDate: new Date('2026-04-05T00:00:00.000Z'),
        category: 'Entertainment',
        isActive: true,
      },
      {
        id: 'sub-2',
        userId: 'user-1',
        name: 'Cloud Storage',
        amount: 4.99,
        currency: 'USD',
        billingCycle: BillingCycle.monthly,
        intervalDays: null,
        nextBillingDate: new Date('2026-03-20T00:00:00.000Z'),
        category: 'Cloud',
        isActive: true,
      },
    ]);

    const result = await service.getMonthlyPayments('user-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: 'Video Stream',
      status: 'done',
    });
    expect(result[1]).toMatchObject({
      name: 'Cloud Storage',
      status: 'upcoming',
    });
  });
});
