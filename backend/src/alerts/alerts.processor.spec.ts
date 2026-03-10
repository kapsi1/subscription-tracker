import { Test, type TestingModule } from '@nestjs/testing';
import { AlertsProcessor } from './alerts.processor';
import { EmailService } from '../notifications/email/email.service';
import { WebhookService } from '../notifications/webhook/webhook.service';
import { WebPushService } from '../notifications/webpush/webpush.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlertType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

describe('AlertsProcessor', () => {
  let processor: AlertsProcessor;
  let emailMock: any;
  let webhookMock: any;
  let webPushMock: any;
  let prismaMock: any;

  beforeEach(async () => {
    emailMock = { sendAlert: jest.fn() };
    webhookMock = { sendAlert: jest.fn() };
    webPushMock = { sendNotification: jest.fn() };
    prismaMock = { 
      pushSubscription: { findMany: jest.fn(), delete: jest.fn() },
      user: { findUnique: jest.fn().mockResolvedValue({ language: 'en', accentColor: 'Indigo', theme: 'system' }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsProcessor,
        { provide: EmailService, useValue: emailMock },
        { provide: WebhookService, useValue: webhookMock },
        { provide: WebPushService, useValue: webPushMock },
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock-secret') },
        },
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
    } as any);

    expect(emailMock.sendAlert).toHaveBeenCalledWith(
      'a@a.com',
      'Netflix',
      3,
      15,
      'USD',
      'en',
      'Indigo',
      'system',
    );
    expect(webhookMock.sendAlert).not.toHaveBeenCalled();
  });

  it('should throw if emailService fails', async () => {
    emailMock.sendAlert.mockRejectedValue(new Error('SMTP Error'));

    await expect(
      processor.process({
        id: 'job-1',
        data: { type: AlertType.email },
      } as any),
    ).rejects.toThrow('SMTP Error');
  });
});
