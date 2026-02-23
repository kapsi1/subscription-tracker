import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { BillingCycle } from '@prisma/client';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prismaMock: {
    subscription: Record<string, jest.Mock>;
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
      subscription: {
        create: jest.fn().mockResolvedValue(mockSubscription),
        findMany: jest.fn().mockResolvedValue([mockSubscription]),
        findFirst: jest.fn().mockResolvedValue(mockSubscription),
        update: jest.fn().mockResolvedValue(mockSubscription),
        delete: jest.fn().mockResolvedValue(mockSubscription),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
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

      await expect(service.findOne(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
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

      await expect(service.update(userId, 'sub-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
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

      await expect(service.remove(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
