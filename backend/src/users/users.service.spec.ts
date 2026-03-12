import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { WebhookService } from '../notifications/webhook/webhook.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

jest.mock('bcrypt');

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

  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-pw');
      prismaMock.user.update.mockResolvedValue({ ...mockUser, passwordHash: 'new-hashed-pw' });

      await expect(service.changePassword('user-1', 'oldpass', 'newpass123')).resolves.toBeUndefined();
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hashed-pw' },
      });
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword('user-1', 'wrongpass', 'newpass123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException for social-only accounts', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: null });

      await expect(service.changePassword('user-1', 'anypass', 'newpass123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('changeEmail', () => {
    it('should change email when password is correct and email is not taken', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockUser) // findById
        .mockResolvedValueOnce(null); // findUnique by new email (not taken)
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, email: 'new@example.com' });

      const result = await service.changeEmail('user-1', 'new@example.com', 'correctpass');
      expect(result.email).toBe('new@example.com');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { email: 'new@example.com' },
      });
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changeEmail('user-1', 'new@example.com', 'wrongpass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ConflictException when new email is already in use', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockUser) // findById
        .mockResolvedValueOnce({ ...mockUser, id: 'other-user' }); // email already taken
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.changeEmail('user-1', 'taken@example.com', 'correctpass')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException for social-only accounts', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: null });

      await expect(service.changeEmail('user-1', 'new@example.com', 'anypass')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('pushSubscription', () => {
    it('should save push subscription', async () => {
      const mockSub = {
        id: 1,
        userId: 'user-1',
        endpoint: 'http://test',
        p256dh: 'p256dh',
        auth: 'auth',
      };
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
