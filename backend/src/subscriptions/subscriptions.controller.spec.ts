import { Test, type TestingModule } from '@nestjs/testing';
import { BillingCycle } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import type { ImportSubscriptionsDto } from './dto/import-subscription.dto';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let serviceMock: Record<string, jest.Mock>;

  const mockReq = { user: { userId: 'user-1' } } as unknown as RequestWithUser;

  const mockSubscription = {
    id: 'sub-1',
    userId: 'user-1',
    name: 'Netflix',
    amount: 15,
    currency: 'USD',
    billingCycle: BillingCycle.monthly,
    category: 'Entertainment',
  };

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn().mockResolvedValue(mockSubscription),
      findAll: jest.fn().mockResolvedValue([mockSubscription]),
      findOne: jest.fn().mockResolvedValue(mockSubscription),
      update: jest.fn().mockResolvedValue(mockSubscription),
      remove: jest.fn().mockResolvedValue(mockSubscription),
      export: jest.fn().mockResolvedValue({ subscriptions: [mockSubscription] }),
      import: jest
        .fn()
        .mockResolvedValue({ message: 'Successfully imported 1 subscriptions', count: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [{ provide: SubscriptionsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
  });

  it('should create a subscription', async () => {
    const dto = {
      name: 'Netflix',
      amount: 15,
      currency: 'USD',
      billingCycle: BillingCycle.monthly,
      category: 'Entertainment',
    };
    const result = await controller.create(mockReq, dto);

    expect(serviceMock.create).toHaveBeenCalledWith('user-1', dto);
    expect(result).toEqual(mockSubscription);
  });

  it('should return all subscriptions', async () => {
    const result = await controller.findAll(mockReq);

    expect(serviceMock.findAll).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([mockSubscription]);
  });

  it('should return one subscription', async () => {
    const result = await controller.findOne(mockReq, 'sub-1');

    expect(serviceMock.findOne).toHaveBeenCalledWith('user-1', 'sub-1');
    expect(result).toEqual(mockSubscription);
  });

  it('should update a subscription', async () => {
    const dto = { name: 'Netflix Premium' };
    const result = await controller.update(mockReq, 'sub-1', dto);

    expect(serviceMock.update).toHaveBeenCalledWith('user-1', 'sub-1', dto);
    expect(result).toEqual(mockSubscription);
  });

  it('should remove a subscription', async () => {
    const result = await controller.remove(mockReq, 'sub-1');

    expect(serviceMock.remove).toHaveBeenCalledWith('user-1', 'sub-1');
    expect(result).toEqual(mockSubscription);
  });

  it('should export subscriptions', async () => {
    const result = await controller.export(mockReq);

    expect(serviceMock.export).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ subscriptions: [mockSubscription] });
  });

  it('should import subscriptions', async () => {
    const dto = {
      subscriptions: [
        {
          name: 'Test',
          amount: 10,
          currency: 'USD',
          billingCycle: BillingCycle.monthly,
          category: 'Other',
        },
      ],
    };
    const result = await controller.import(mockReq, dto as unknown as ImportSubscriptionsDto);

    expect(serviceMock.import).toHaveBeenCalledWith('user-1', dto);
    expect(result).toEqual({ message: 'Successfully imported 1 subscriptions', count: 1 });
  });
});
