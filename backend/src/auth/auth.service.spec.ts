import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../notifications/email/email.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: Record<string, jest.Mock>;
  let jwtServiceMock: Record<string, jest.Mock>;
  let configServiceMock: Record<string, jest.Mock>;
  let emailServiceMock: Record<string, jest.Mock>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    isVerified: true,
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    usersServiceMock = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    configServiceMock = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return 'test-secret';
      }),
      getOrThrow: jest.fn().mockImplementation((key) => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        return 'test-secret';
      }),
    };

    emailServiceMock = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: EmailService, useValue: emailServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should create user and return tokens', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      usersServiceMock.create.mockResolvedValue(mockUser);
      jwtServiceMock.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        language: 'en',
      });

      expect(usersServiceMock.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed-pw',
          language: 'en',
          isVerified: false,
        }),
      );
      expect(result).toEqual({ message: 'Verification email sent' });
    });

    it('should throw BadRequestException when email already exists', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          language: 'en',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtServiceMock.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens for a valid refresh token', async () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'user-1',
        email: 'test@example.com',
      });
      usersServiceMock.findById.mockResolvedValue(mockUser);
      jwtServiceMock.sign
        .mockReturnValueOnce(mockTokens.accessToken)
        .mockReturnValueOnce(mockTokens.refreshToken);

      const result = await service.refreshTokens('valid-refresh-token');

      expect(jwtServiceMock.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jwtServiceMock.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jwtServiceMock.verify.mockReturnValue({ sub: 'deleted-user' });
      usersServiceMock.findById.mockResolvedValue(null);

      await expect(service.refreshTokens('orphan-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
