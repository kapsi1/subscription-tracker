import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let serviceMock: Record<string, jest.Mock>;

  const mockReq = { user: { userId: 'user-1' } };

  const mockSummary = {
    totalMonthlyCost: 25,
    totalYearlyCost: 300,
    activeSubscriptions: 2,
    categoryBreakdown: { Entertainment: 15, Cloud: 10 },
  };

  const mockForecast = [
    { month: 'Jan', year: 2025, amount: 25, currency: 'USD' },
  ];

  beforeEach(async () => {
    serviceMock = {
      getSummary: jest.fn().mockResolvedValue(mockSummary),
      getForecast: jest.fn().mockResolvedValue(mockForecast),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: serviceMock }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should return summary for user', async () => {
    const result = await controller.getSummary(mockReq);

    expect(serviceMock.getSummary).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(mockSummary);
  });

  it('should return forecast for user', async () => {
    const result = await controller.getForecast(mockReq, 12);

    expect(serviceMock.getForecast).toHaveBeenCalledWith('user-1', 12);
    expect(result).toEqual(mockForecast);
  });

  it('should clamp months to maximum of 60', async () => {
    await controller.getForecast(mockReq, 100);

    expect(serviceMock.getForecast).toHaveBeenCalledWith('user-1', 60);
  });

  it('should clamp months to minimum of 1', async () => {
    await controller.getForecast(mockReq, -5);

    expect(serviceMock.getForecast).toHaveBeenCalledWith('user-1', 1);
  });
});
