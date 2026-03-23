import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

jest.mock('@subtracker/shared', () => {
  const DEFAULT_CATEGORIES = [
    { name: 'Entertainment', color: '#a855f7', icon: 'Play' },
    { name: 'Productivity', color: '#3b82f6', icon: 'CheckSquare' },
    { name: 'Cloud Services', color: '#06b6d4', icon: 'Cloud' },
    { name: 'Development', color: '#22c55e', icon: 'Code' },
    { name: 'Professional', color: '#f97316', icon: 'Briefcase' },
    { name: 'Health', color: '#f43f5e', icon: 'Heart' },
    { name: 'Housing', color: '#f59e0b', icon: 'Home' },
    { name: 'Utilities', color: '#6366f1', icon: 'Zap' },
    { name: 'Services', color: '#14b8a6', icon: 'Settings' },
    { name: 'Education', color: '#eab308', icon: 'Book' },
    { name: 'Other', color: '#64748b', icon: 'Tag' },
  ];
  return {
    DEFAULT_CATEGORIES,
    getTranslatedDefaultCategories: jest.fn().mockReturnValue(DEFAULT_CATEGORIES),
  };
});

// Mirror the mock for assertions
const DEFAULT_CATEGORIES: Array<{ name: string; color: string; icon: string }> = [
  { name: 'Entertainment', color: '#a855f7', icon: 'Play' },
  { name: 'Productivity', color: '#3b82f6', icon: 'CheckSquare' },
  { name: 'Cloud Services', color: '#06b6d4', icon: 'Cloud' },
  { name: 'Development', color: '#22c55e', icon: 'Code' },
  { name: 'Professional', color: '#f97316', icon: 'Briefcase' },
  { name: 'Health', color: '#f43f5e', icon: 'Heart' },
  { name: 'Housing', color: '#f59e0b', icon: 'Home' },
  { name: 'Utilities', color: '#6366f1', icon: 'Zap' },
  { name: 'Services', color: '#14b8a6', icon: 'Settings' },
  { name: 'Education', color: '#eab308', icon: 'Book' },
  { name: 'Other', color: '#64748b', icon: 'Tag' },
];

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaMock: {
    category: Record<string, jest.Mock>;
    subscription: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
  };

  const userId = 'user-1';

  const mockCategory = {
    id: 'cat-1',
    name: 'Entertainment',
    color: '#a855f7',
    icon: 'Play',
    order: 0,
  };

  beforeEach(async () => {
    prismaMock = {
      category: {
        findMany: jest.fn().mockResolvedValue([mockCategory]),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(mockCategory),
        create: jest.fn().mockResolvedValue(mockCategory),
        createMany: jest.fn().mockResolvedValue({ count: DEFAULT_CATEGORIES.length }),
        update: jest.fn().mockResolvedValue({ ...mockCategory, name: 'Updated' }),
        delete: jest.fn().mockResolvedValue(mockCategory),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      subscription: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: userId, language: 'en' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('findAll', () => {
    it('should return existing categories for the user', async () => {
      const result = await service.findAll(userId);

      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, color: true, icon: true, order: true },
      });
      expect(result).toEqual([mockCategory]);
    });

    it('should create default categories when user has none', async () => {
      prismaMock.category.findMany
        .mockResolvedValueOnce([]) // first call returns empty
        .mockResolvedValueOnce(DEFAULT_CATEGORIES.map((c, i) => ({ id: `cat-${i}`, ...c }))); // after createMany

      const result = await service.findAll(userId);

      expect(prismaMock.category.createMany).toHaveBeenCalledWith({
        data: DEFAULT_CATEGORIES.map((c, i) => ({ ...c, userId, order: i })),
        skipDuplicates: true,
      });
      expect(result).toHaveLength(DEFAULT_CATEGORIES.length);
    });

    it('should not create defaults when categories already exist', async () => {
      await service.findAll(userId);

      expect(prismaMock.category.createMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const dto = { name: 'Entertainment', color: '#a855f7', icon: 'Play' };

      const result = await service.create(userId, dto);

      expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
        where: { userId_name: { userId, name: dto.name } },
      });
      expect(prismaMock.category.create).toHaveBeenCalledWith({
        data: { ...dto, userId, order: 1 },
        select: { id: true, name: true, color: true, icon: true, order: true },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException when category name already exists', async () => {
      prismaMock.category.findUnique.mockResolvedValue(mockCategory);

      await expect(
        service.create(userId, { name: 'Entertainment', color: '#a855f7' }),
      ).rejects.toThrow(ConflictException);
      expect(prismaMock.category.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a category name and color', async () => {
      const dto = { name: 'Updated', color: '#3b82f6', icon: 'Play' };

      const result = await service.update(userId, 'cat-1', dto);

      expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'cat-1', userId },
      });
      expect(prismaMock.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: dto,
        select: { id: true, name: true, color: true, icon: true, order: true },
      });
      expect(result).toEqual({ ...mockCategory, name: 'Updated' });
    });

    it('should throw NotFoundException when category does not belong to user', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);

      await expect(service.update(userId, 'nonexistent', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.category.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when renaming to an existing category name', async () => {
      prismaMock.category.findFirst.mockResolvedValue(mockCategory);
      prismaMock.category.findUnique.mockResolvedValue({ id: 'cat-2', name: 'Productivity' });

      await expect(service.update(userId, 'cat-1', { name: 'Productivity' })).rejects.toThrow(
        ConflictException,
      );
      expect(prismaMock.category.update).not.toHaveBeenCalled();
    });

    it('should skip duplicate check when name is unchanged', async () => {
      const dto = { name: 'Entertainment', color: '#000000' };

      await service.update(userId, 'cat-1', dto);

      expect(prismaMock.category.findUnique).not.toHaveBeenCalled();
    });

    it('should skip duplicate check when dto has no name', async () => {
      const dto = { color: '#000000' };

      await service.update(userId, 'cat-1', dto);

      expect(prismaMock.category.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      await service.remove(userId, 'cat-1');

      expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
        where: { id: 'cat-1', userId },
      });
      expect(prismaMock.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });

    it('should throw NotFoundException when category does not belong to user', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);

      await expect(service.remove(userId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prismaMock.category.delete).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should delete all user categories and recreate defaults', async () => {
      const defaultsWithIds = DEFAULT_CATEGORIES.map((c, i) => ({ id: `cat-${i}`, ...c }));
      prismaMock.category.findMany.mockResolvedValue(defaultsWithIds);

      const result = await service.reset(userId);

      expect(prismaMock.category.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(prismaMock.category.createMany).toHaveBeenCalledWith({
        data: DEFAULT_CATEGORIES.map((c, i: number) => ({ ...c, userId, order: i })),
        skipDuplicates: true,
      });
      expect(result).toHaveLength(DEFAULT_CATEGORIES.length);
    });

    it('should use provided language in reset', async () => {
      const { getTranslatedDefaultCategories } = require('@subtracker/shared');
      await service.reset(userId, 'pl');
      expect(getTranslatedDefaultCategories).toHaveBeenCalledWith('pl');
    });
  });
});
