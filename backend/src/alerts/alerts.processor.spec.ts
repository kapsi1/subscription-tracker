import { Test, type TestingModule } from '@nestjs/testing';
import { AlertType } from '@prisma/client';
import type { Job } from 'bullmq';
import { EmailService } from '../notifications/email/email.service';
import { WebPushService } from '../notifications/webpush/webpush.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsProcessor } from './alerts.processor';
import type { AlertJobData } from './alerts.types';

describe('AlertsProcessor', () => {
  let processor: AlertsProcessor;
  let emailMock: { sendAlert: jest.Mock };
  let webPushMock: { sendNotification: jest.Mock };
  let prismaMock: {
    pushSubscription: { findMany: jest.Mock; delete: jest.Mock };
    user: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    emailMock = { sendAlert: jest.fn() };
    webPushMock = { sendNotification: jest.fn() };
    prismaMock = {
      pushSubscription: { findMany: jest.fn(), delete: jest.fn() },
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ language: 'en', accentColor: 'Indigo', theme: 'system' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsProcessor,
        { provide: EmailService, useValue: emailMock },
        { provide: WebPushService, useValue: webPushMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    processor = module.get<AlertsProcessor>(AlertsProcessor);
  });

  it('should call emailService on email alert', async () => {
    await processor.process({
      id: 'job-1',
      data: {
        type: AlertType.email,
        userEmail: 'a@a.com',
        subscriptionName: 'Netflix',
        daysBefore: 3,
        amount: 15,
        currency: 'USD',
      },
    } as unknown as Job<AlertJobData, unknown, string>);

    expect(emailMock.sendAlert).toHaveBeenCalledWith(
      'a@a.com',
      'Netflix',
      3,
      15,
      'USD',
      'en',
      'Indigo',
      'system',
      undefined,
    );
  });

  it('should throw if emailService fails', async () => {
    emailMock.sendAlert.mockRejectedValue(new Error('SMTP Error'));

    await expect(
      processor.process({
        id: 'job-1',
        data: { type: AlertType.email },
      } as unknown as Job<AlertJobData, unknown, string>),
    ).rejects.toThrow('SMTP Error');
  });
});
