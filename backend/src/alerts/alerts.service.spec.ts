import { getQueueToken } from '@nestjs/bullmq';
import { Test, type TestingModule } from '@nestjs/testing';
import { DashboardService } from '../dashboard/dashboard.service';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let prismaMock: any;
  let queueMock: any;
  let dashboardMock: any;
  let paymentsMock: any;

  beforeEach(async () => {
    prismaMock = {
      alert: {
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      subscription: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    queueMock = {
      add: jest.fn(),
    };

    dashboardMock = {
      getMonthlyTotal: jest.fn().mockResolvedValue(100),
      getSummary: jest.fn().mockResolvedValue({ totalMonthlyCost: 100 }),
    };

    paymentsMock = {
      processPaymentsAndSendDigests: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: DashboardService, useValue: dashboardMock },
        { provide: PaymentsService, useValue: paymentsMock },
        { provide: getQueueToken('alertQueue'), useValue: queueMock },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  it('should push job if threshold is met', async () => {
    const now = new Date();
    const thresholdTrigger = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

    prismaMock.alert.findMany.mockResolvedValue([
      {
        id: 'a1',
        daysBefore: 3, // It triggers if billingdate is within 3 days. 2 days is <= 3, so trigger.
        type: 'email',
        subscription: {
          id: 's1',
          name: 'Netflix',
          amount: 10,
          currency: 'USD',
          nextBillingDate: thresholdTrigger,
          user: { email: 'test@example.com' },
        },
      },
    ]);

    await service.handleCron();
    expect(queueMock.add).toHaveBeenCalledTimes(1);
    expect(queueMock.add).toHaveBeenCalledWith(
      'processAlert',
      expect.objectContaining({ alertId: 'a1', subscriptionName: 'Netflix' }),
      expect.objectContaining({
        jobId: expect.stringContaining('alert:a1:sub:s1'),
      }),
    );
  });

  it('should NOT push job if threshold is NOT met', async () => {
    const now = new Date();
    const futureTrigger = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now

    prismaMock.alert.findMany.mockResolvedValue([
      {
        id: 'a2',
        daysBefore: 3, // Target is in 10 days. 10 > 3, so no.
        type: 'email',
        subscription: {
          id: 's2',
          nextBillingDate: futureTrigger,
          user: { email: 'test@example.com' },
        },
      },
    ]);

    await service.handleCron();
    expect(queueMock.add).not.toHaveBeenCalled();
  });
});
