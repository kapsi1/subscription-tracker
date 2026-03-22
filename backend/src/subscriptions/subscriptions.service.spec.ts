import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BillingCycle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  // biome-ignore lint/suspicious/noExplicitAny: Mock type
  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    category: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    paymentHistory: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('import', () => {
    const userId = 'user-1';
    const importDto = {
      subscriptions: [
        {
          name: 'Netflix',
          amount: 10,
          currency: 'USD',
          billingCycle: BillingCycle.monthly,
          category: 'Entertainment',
          payments: [{ amount: 10, currency: 'USD', paidAt: new Date().toISOString() }],
        },
      ],
      replace: true,
    };

    it('should delete existing data if replace is true', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, currency: 'USD' });

      // biome-ignore lint/suspicious/noExplicitAny: DTO type override
      await service.import(userId, importDto as unknown as any);

      expect(mockPrisma.subscription.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(mockPrisma.category.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(mockPrisma.paymentHistory.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(mockPrisma.subscription.create).toHaveBeenCalled();
    });

    it('should not delete existing data if replace is false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, currency: 'USD' });
      mockPrisma.subscription.deleteMany.mockClear();

      // biome-ignore lint/suspicious/noExplicitAny: DTO type override
      await service.import(userId, { ...importDto, replace: false } as unknown as any);

      expect(mockPrisma.subscription.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // biome-ignore lint/suspicious/noExplicitAny: DTO type override
      await expect(service.import(userId, importDto as unknown as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
