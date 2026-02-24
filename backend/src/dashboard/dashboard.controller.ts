import {
  Controller,
  Get,
  Req,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Req() req: any) {
    return this.dashboardService.getSummary(req.user.userId);
  }

  @Get('forecast')
  async getForecast(
    @Req() req: any,
    @Query('months', new DefaultValuePipe(12), ParseIntPipe) months: number,
  ) {
    // Ensuring maximum capping so users can't crash server iterating forever
    const clampedMonths = Math.min(Math.max(1, months), 60);
    return this.dashboardService.getForecast(req.user.userId, clampedMonths);
  }
}
