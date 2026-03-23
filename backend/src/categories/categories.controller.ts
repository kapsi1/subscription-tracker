import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.categoriesService.findAll(req.user.userId);
  }

  @Post()
  create(@Req() req: RequestWithUser, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(req.user.userId, dto);
  }

  @Post('reset')
  reset(@Req() req: RequestWithUser, @Query('lang') lang?: string) {
    return this.categoriesService.reset(req.user.userId, lang);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(@Req() req: RequestWithUser, @Body() dto: ReorderCategoriesDto) {
    return this.categoriesService.reorder(req.user.userId, dto);
  }

  @Patch(':id')
  update(@Req() req: RequestWithUser, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.categoriesService.remove(req.user.userId, id);
  }
}
