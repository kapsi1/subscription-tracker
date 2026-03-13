import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_CATEGORIES } from '@subtracker/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    let categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, color: true, icon: true, order: true },
    });

    if (categories.length === 0) {
      categories = await this.createDefaults(userId);
    } else {
      // Patch missing or legacy icons for existing users
      // This is a one-time fix for existing users after the icon update
      const legacyIcon = 'Tool';
      const toPatch = categories.filter((c) => !c.icon || c.icon === legacyIcon);

      if (toPatch.length > 0) {
        for (const cat of toPatch) {
          const defaultCat = DEFAULT_CATEGORIES.find((dc) => dc.name === cat.name);
          if (defaultCat) {
            await this.prisma.category.update({
              where: { id: cat.id },
              data: { icon: defaultCat.icon },
            });
            // Update the local object so it's returned correctly in this request
            cat.icon = defaultCat.icon;
          }
        }
      }
    }

    return categories;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { userId_name: { userId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    const last = await this.prisma.category.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = last ? last.order + 1 : 0;

    return this.prisma.category.create({
      data: { ...dto, userId, order: nextOrder },
      select: { id: true, name: true, color: true, icon: true, order: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('Category not found');

    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: { userId_name: { userId, name: dto.name } },
      });
      if (existing) {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, color: true, icon: true, order: true },
    });

    if (dto.name && dto.name !== category.name) {
      await this.prisma.subscription.updateMany({
        where: { userId, category: category.name },
        data: { category: dto.name },
      });
    }

    return updated;
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('Category not found');
    await this.prisma.category.delete({ where: { id } });
  }

  async reorder(userId: string, dto: ReorderCategoriesDto) {
    await this.prisma.$transaction(
      dto.items.map(({ id, order }) =>
        this.prisma.category.updateMany({
          where: { id, userId },
          data: { order },
        }),
      ),
    );
  }

  async reset(userId: string) {
    await this.prisma.category.deleteMany({ where: { userId } });
    return this.createDefaults(userId);
  }

  private async createDefaults(userId: string) {
    await this.prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c, i) => ({ ...c, userId, order: i })),
      skipDuplicates: true,
    });
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, color: true, icon: true, order: true },
    });
  }
}
