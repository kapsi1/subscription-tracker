import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../notifications/webhook/webhook.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: {
    user: Record<string, jest.Mock>;
    pushSubscription: Record<string, jest.Mock>;
  };

  const mockWebhookService = {
    // mock methods if necessary
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-pw',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      pushSubscription: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: WebhookService, useValue: mockWebhookService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return user', async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);

      const data = { email: 'test@example.com', passwordHash: 'hashed-pw' };
      const result = await service.create(data);

      expect(prismaMock.user.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update and return user', async () => {
      prismaMock.user.update.mockResolvedValue({ ...mockUser, email: 'updated@example.com' });

      const result = await service.update('user-1', { email: 'updated@example.com' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { email: 'updated@example.com' },
      });
      expect(result.email).toBe('updated@example.com');
    });
  });

  describe('pushSubscription', () => {
    it('should save push subscription', async () => {
      const mockSub = { id: 1, userId: 'user-1', endpoint: 'http://test', p256dh: 'p256dh', auth: 'auth' };
      prismaMock.pushSubscription.upsert.mockResolvedValue(mockSub);

      const result = await service.savePushSubscription('user-1', 'http://test', 'p256dh', 'auth');

      expect(prismaMock.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: 'http://test' },
        update: { userId: 'user-1', p256dh: 'p256dh', auth: 'auth' },
        create: { userId: 'user-1', endpoint: 'http://test', p256dh: 'p256dh', auth: 'auth' },
      });
      expect(result).toEqual(mockSub);
    });

    it('should delete push subscription', async () => {
      prismaMock.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.deletePushSubscription('user-1', 'http://test');

      expect(prismaMock.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', endpoint: 'http://test' },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
