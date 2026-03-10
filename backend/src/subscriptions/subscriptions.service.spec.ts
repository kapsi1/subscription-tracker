import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { BillingCycle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ImportSubscriptionsDto } from './dto/import-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prismaMock: {
    subscription: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
    paymentHistory: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };

  const userId = 'user-1';

  const mockSubscription = {
    id: 'sub-1',
    userId,
    name: 'Netflix',
    amount: 15,
    currency: 'USD',
    billingCycle: BillingCycle.monthly,
    intervalDays: null,
    category: 'Entertainment',
    isActive: true,
    nextBillingDate: new Date('2025-03-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: userId,
          defaultReminderEnabled: true,
          defaultReminderDays: 3,
        }),
      },
      subscription: {
        create: jest.fn().mockResolvedValue(mockSubscription),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([mockSubscription]),
        findFirst: jest.fn().mockResolvedValue(mockSubscription),
        update: jest.fn().mockResolvedValue(mockSubscription),
        delete: jest.fn().mockResolvedValue(mockSubscription),
      },
      paymentHistory: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        if (typeof callback === 'function') {
          return callback(prismaMock);
        }
        return callback;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('create', () => {
    it('should create a subscription with calculated next billing date', async () => {
      const dto = {
        name: 'Netflix',
        amount: 15,
        currency: 'USD',
        billingCycle: BillingCycle.monthly,
        category: 'Entertainment',
      };

      const result = await service.create(userId, dto);

      expect(prismaMock.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          name: 'Netflix',
          amount: 15,
          billingCycle: BillingCycle.monthly,
          nextBillingDate: expect.any(Date),
        }),
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should throw BadRequestException for custom cycle without intervalDays', async () => {
      const dto = {
        name: 'Custom',
        amount: 10,
        currency: 'USD',
        billingCycle: BillingCycle.custom,
        category: 'Other',
        // intervalDays intentionally omitted
      };

      await expect(service.create(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should accept custom cycle with intervalDays', async () => {
      const dto = {
        name: 'Custom',
        amount: 10,
        currency: 'USD',
        billingCycle: BillingCycle.custom,
        intervalDays: 30,
        category: 'Other',
      };

      await service.create(userId, dto);

      expect(prismaMock.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          intervalDays: 30,
          billingCycle: BillingCycle.custom,
        }),
      });
    });

    it('should create a subscription with manual next billing date', async () => {
      const manualDate = '2025-12-25';
      const dto = {
        name: 'Netflix',
        amount: 15,
        currency: 'USD',
        billingCycle: BillingCycle.monthly,
        category: 'Entertainment',
        nextBillingDate: manualDate,
      };

      await service.create(userId, dto);

      expect(prismaMock.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nextBillingDate: new Date(manualDate),
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return subscriptions ordered by nextBillingDate', async () => {
      const result = await service.findAll(userId);

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { nextBillingDate: 'asc' },
      });
      expect(result).toEqual([mockSubscription]);
    });
  });

  describe('export', () => {
    it('should export user subscriptions', async () => {
      const result = await service.export(userId);

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
      });
      expect(result).toEqual({ subscriptions: [mockSubscription] });
    });
  });

  describe('import', () => {
    beforeEach(() => {
      prismaMock.user = {
        findUnique: jest.fn().mockResolvedValue({
          id: userId,
          defaultReminderEnabled: true,
          defaultReminderDays: 3,
        }),
      };
    });

    it('should import subscriptions and calculate next billing dates', async () => {
      const importDto = {
        subscriptions: [
          {
            name: 'Spotify',
            amount: 10,
            currency: 'USD',
            billingCycle: BillingCycle.monthly,
            category: 'Entertainment',
          },
        ],
      } as unknown as ImportSubscriptionsDto;

      const result = await service.import(userId, importDto);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prismaMock.subscription.createMany).toHaveBeenCalled();
      expect(result.count).toBe(1);
      expect(result.message).toContain('1 subscriptions');
    });

    it('should throw NotFoundException if user not found during import', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const importDto = { subscriptions: [] };

      await expect(service.import(userId, importDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if custom cycle lacks intervalDays', async () => {
      const importDto = {
        subscriptions: [
          {
            name: 'Spotify',
            amount: 10,
            currency: 'USD',
            billingCycle: BillingCycle.custom,
            category: 'Entertainment',
          },
        ],
      } as unknown as ImportSubscriptionsDto;

      await expect(service.import(userId, importDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return subscription when found', async () => {
      const result = await service.findOne(userId, 'sub-1');

      expect(prismaMock.subscription.findFirst).toHaveBeenCalledWith({
        where: { id: 'sub-1', userId },
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should throw NotFoundException when not found', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue(null);

      await expect(service.findOne(userId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update subscription fields', async () => {
      const updateDto = { name: 'Netflix Premium' };
      await service.update(userId, 'sub-1', updateDto);

      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({ name: 'Netflix Premium' }),
      });
    });

    it('should recalculate billing date when billingCycle changes', async () => {
      const updateDto = { billingCycle: BillingCycle.yearly };
      await service.update(userId, 'sub-1', updateDto);

      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          billingCycle: BillingCycle.yearly,
          nextBillingDate: expect.any(Date),
        }),
      });
    });

    it('should use manual next billing date when provided in update', async () => {
      const manualDate = '2026-01-01';
      const updateDto = { nextBillingDate: manualDate };
      await service.update(userId, 'sub-1', updateDto);

      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          nextBillingDate: new Date(manualDate),
        }),
      });
    });

    it('should throw BadRequestException for custom cycle without intervalDays', async () => {
      // Existing sub has no intervalDays
      prismaMock.subscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        billingCycle: BillingCycle.monthly,
        intervalDays: null,
      });

      const updateDto = { billingCycle: BillingCycle.custom };

      await expect(service.update(userId, 'sub-1', updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete subscription after verifying ownership', async () => {
      await service.remove(userId, 'sub-1');

      expect(prismaMock.subscription.findFirst).toHaveBeenCalledWith({
        where: { id: 'sub-1', userId },
      });
      expect(prismaMock.subscription.delete).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      });
    });

    it('should throw NotFoundException if subscription does not exist', async () => {
      prismaMock.subscription.findFirst.mockResolvedValue(null);

      await expect(service.remove(userId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
