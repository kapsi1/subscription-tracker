import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AlertsService } from '../src/alerts/alerts.service';
import { MailpitHelper } from './mailpit.helper';
import { AlertType } from '@prisma/client';
import { randomUUID } from 'crypto';

describe('Alerts & Reminder Jobs (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let alertsService: AlertsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    alertsService = app.get<AlertsService>(AlertsService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await MailpitHelper.clearMessages();
  });

  it('should send a subscription reminder email when next billing date is within threshold', async () => {
    const testEmail = `test-${randomUUID()}@example.com`;
    
    // 1. Create a user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'hashedpassword',
        language: 'en',
      },
    });

    // 2. Create a subscription due in 2 days
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 2);
    
    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        name: 'E2E Test Sub',
        amount: 50.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: nextBillingDate,
        isActive: true,
        category: 'Entertainment',
      },
    });

    // 3. Create an alert for this subscription with 3 daysBefore
    await prisma.alert.create({
      data: {
        subscriptionId: sub.id,
        type: AlertType.email,
        daysBefore: 3,
        isEnabled: true,
      },
    });

    // 4. Trigger the alert scheduler
    await alertsService.handleCron();

    // 5. Wait and verify email in Mailpit
    const email = await MailpitHelper.waitForMessage(testEmail);
    expect(email.Subject).toContain('Upcoming Subscription Renewal');
    expect(email.HTML).toContain('E2E Test Sub');
    expect(email.HTML).toContain('50 USD');
  });

  it('should send a budget alert email when monthly limit is exceeded', async () => {
    const testEmail = `budget-${randomUUID()}@example.com`;
    
    // 1. Create a user with a budget
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'hashedpassword',
        monthlyBudget: 100,
        currency: 'USD',
      },
    });

    // 2. Create a subscription that exceeds the budget
    await prisma.subscription.create({
      data: {
        userId: user.id,
        name: 'Expensive Sub',
        amount: 150.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: new Date(),
        isActive: true,
        category: 'Entertainment',
      },
    });

    // 3. Trigger the budget alert scheduler
    await alertsService.handleBudgetAlertsCron();

    // 4. Wait and verify email in Mailpit
    const email = await MailpitHelper.waitForMessage(testEmail);
    expect(email.Subject).toContain('Budget Alert: Monthly Limit Exceeded');
    expect(email.HTML).toContain('150.00 USD');
    expect(email.HTML).toContain('100.00 USD');
  });

  it('should send a daily digest email with yesterday payments', async () => {
    const testEmail = `digest-${randomUUID()}@example.com`;
    
    // 1. Create a user with daily digest enabled
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'hashedpassword',
        dailyDigest: true,
        emailNotifications: true,
        currency: 'USD',
      },
    });

    // 2. Create a subscription that was due yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0); // middle of the day

    await prisma.subscription.create({
      data: {
        userId: user.id,
        name: 'Yesterday Payment',
        amount: 25.00,
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: yesterday,
        isActive: true,
        category: 'Entertainment',
      },
    });

    // 3. Trigger the daily digest processing
    // This will also process the payment (create PaymentHistory and update nextBillingDate)
    await alertsService.handleDailyDigestCron();

    // 4. Wait and verify email in Mailpit
    const email = await MailpitHelper.waitForMessage(testEmail);
    expect(email.Subject).toContain('Daily Subscription Digest');
    expect(email.HTML).toContain('Yesterday Payment');
    expect(email.HTML).toContain('25.00 USD');
  });
});
