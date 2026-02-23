import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: {
    user: Record<string, jest.Mock>;
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
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
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
});
