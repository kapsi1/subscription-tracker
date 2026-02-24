import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: Record<string, jest.Mock>;

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    authServiceMock = {
      register: jest.fn().mockResolvedValue(mockTokens),
      login: jest.fn().mockResolvedValue(mockTokens),
      refreshTokens: jest.fn().mockResolvedValue(mockTokens),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should register a user', async () => {
    const dto = { email: 'a@b.com', password: 'password123' };
    const result = await controller.register(dto);

    expect(authServiceMock.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockTokens);
  });

  it('should login a user', async () => {
    const dto = { email: 'a@b.com', password: 'password123' };
    const result = await controller.login(dto);

    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockTokens);
  });

  it('should refresh tokens', async () => {
    const result = await controller.refresh('some-refresh-token');

    expect(authServiceMock.refreshTokens).toHaveBeenCalledWith(
      'some-refresh-token',
    );
    expect(result).toEqual(mockTokens);
  });

  it('should return success message on logout', async () => {
    const req = { user: { userId: 'user-1' } };
    const result = await controller.logout(req);

    expect(result).toEqual({ message: 'Logged out successfully' });
  });
});
