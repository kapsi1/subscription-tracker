import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { BillingCycle } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      subscription: {
        findMany: jest.fn(),
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
      { amount: 120, billingCycle: BillingCycle.yearly, category: 'Cloud' },
      { amount: 15, billingCycle: BillingCycle.monthly, category: 'Video' },
    ]);

    const res = await service.getSummary('user-1');
    expect(res.totalMonthlyCost).toBe(120 / 12 + 15);
    expect(res.totalYearlyCost).toBe(120 + 15 * 12);
    expect(res.categoryBreakdown['Cloud']).toBe(10);
    expect(res.categoryBreakdown['Video']).toBe(15);
  });
});
