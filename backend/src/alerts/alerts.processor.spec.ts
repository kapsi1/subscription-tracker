import { Test, TestingModule } from '@nestjs/testing';
import { AlertsProcessor } from './alerts.processor';
import { EmailService } from '../notifications/email/email.service';
import { WebhookService } from '../notifications/webhook/webhook.service';
import { AlertType } from '@prisma/client';

describe('AlertsProcessor', () => {
  let processor: AlertsProcessor;
  let emailMock: any;
  let webhookMock: any;

  beforeEach(async () => {
    emailMock = { sendAlert: jest.fn() };
    webhookMock = { sendAlert: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsProcessor,
        { provide: EmailService, useValue: emailMock },
        { provide: WebhookService, useValue: webhookMock },
      ],
    }).compile();

    processor = module.get<AlertsProcessor>(AlertsProcessor);
  });

  it('should call emailService on email alert', async () => {
    await processor.process({
      id: 'job-1',
      data: { type: AlertType.email, userEmail: 'a@a.com', subscriptionName: 'Netflix', daysBefore: 3, amount: 15, currency: 'USD' }
    } as any);

    expect(emailMock.sendAlert).toHaveBeenCalledWith('a@a.com', 'Netflix', 3, 15, 'USD');
    expect(webhookMock.sendAlert).not.toHaveBeenCalled();
  });

  it('should throw if emailService fails', async () => {
    emailMock.sendAlert.mockRejectedValue(new Error('SMTP Error'));

    await expect(processor.process({
      id: 'job-1',
      data: { type: AlertType.email }
    } as any)).rejects.toThrow('SMTP Error');
  });
});
