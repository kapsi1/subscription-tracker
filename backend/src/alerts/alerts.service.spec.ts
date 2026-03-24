import { getQueueToken } from '@nestjs/bullmq';
import { Test, type TestingModule } from '@nestjs/testing';
import { DashboardService } from '../dashboard/dashboard.service';
import { EmailService } from '../notifications/email/email.service';
import { PaymentsService } from '../payments/payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from './alerts.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let prismaMock: {
    alert: { findMany: jest.Mock };
    user: { findMany: jest.Mock; update: jest.Mock };
    subscription: { findMany: jest.Mock };
  };
  let queueMock: { add: jest.Mock };
  let dashboardMock: {
    getMonthlyTotal: jest.Mock;
    getSummary: jest.Mock;
    calculateCosts: jest.Mock;
  };
  let paymentsMock: { processPaymentsAndSendDigests: jest.Mock };
  let emailServiceMock: { sendWeeklyReport: jest.Mock; sendAlert: jest.Mock };

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
      calculateCosts: jest.fn().mockReturnValue({ totalMonthlyCost: 0, activeSubscriptions: 0 }),
    };

    paymentsMock = {
      processPaymentsAndSendDigests: jest.fn(),
    };

    emailServiceMock = {
      sendWeeklyReport: jest.fn(),
      sendAlert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: DashboardService, useValue: dashboardMock },
        { provide: PaymentsService, useValue: paymentsMock },
        { provide: EmailService, useValue: emailServiceMock },
        { provide: getQueueToken('alertQueue'), useValue: queueMock },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  describe('unit: days', () => {
    it('should enqueue job when billing date is within the day threshold', async () => {
      const now = new Date();
      const billingDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

      prismaMock.alert.findMany.mockResolvedValue([
        {
          id: 'a1',
          daysBefore: 3,
          unit: 'days',
          type: 'email',
          subscription: {
            id: 's1',
            name: 'Netflix',
            amount: 10,
            currency: 'USD',
            nextBillingDate: billingDate,
            user: { email: 'test@example.com', name: 'Test' },
          },
        },
      ]);

      await service.handleCron();
      expect(queueMock.add).toHaveBeenCalledTimes(1);
      expect(queueMock.add).toHaveBeenCalledWith(
        'processAlert',
        expect.objectContaining({ alertId: 'a1', subscriptionName: 'Netflix', unit: 'days' }),
        expect.objectContaining({ jobId: expect.stringContaining('alert-a1-sub-s1') }),
      );
    });

    it('should NOT enqueue when billing date is outside the day threshold', async () => {
      const now = new Date();
      const billingDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now

      prismaMock.alert.findMany.mockResolvedValue([
        {
          id: 'a2',
          daysBefore: 3,
          unit: 'days',
          type: 'email',
          subscription: {
            id: 's2',
            name: 'Spotify',
            amount: 5,
            currency: 'USD',
            nextBillingDate: billingDate,
            user: { email: 'test@example.com', name: 'Test' },
          },
        },
      ]);

      await service.handleCron();
      expect(queueMock.add).not.toHaveBeenCalled();
    });
  });

  it('should NOT enqueue when billing date is in the past', async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 60 * 1000); // 1 minute ago

    prismaMock.alert.findMany.mockResolvedValue([
      {
        id: 'a7',
        daysBefore: 3,
        unit: 'days',
        type: 'email',
        subscription: {
          id: 's7',
          name: 'Expired',
          amount: 5,
          currency: 'USD',
          nextBillingDate: pastDate,
          user: { email: 'test@example.com', name: 'Test' },
        },
      },
    ]);

    await service.handleCron();
    expect(queueMock.add).not.toHaveBeenCalled();
  });

  it('should use dedup jobId based on alert id and billing date', async () => {
    const now = new Date();
    const billingDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    prismaMock.alert.findMany.mockResolvedValue([
      {
        id: 'a8',
        daysBefore: 3,
        unit: 'days',
        type: 'email',
        subscription: {
          id: 's8',
          name: 'Netflix',
          amount: 10,
          currency: 'USD',
          nextBillingDate: billingDate,
          user: { email: 'test@example.com', name: 'Test' },
        },
      },
    ]);

    await service.handleCron();
    expect(queueMock.add).toHaveBeenCalledWith(
      'processAlert',
      expect.any(Object),
      expect.objectContaining({
        jobId: `alert-a8-sub-s8-${billingDate.getTime()}`,
      }),
    );
  });
});
