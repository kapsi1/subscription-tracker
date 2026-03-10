import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { UsersService } from '../users/users.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

import type { GoogleProfile } from './interfaces/google-profile.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateGoogleUser(googleProfile: GoogleProfile) {
    const { googleId, email, firstName, lastName, picture } = googleProfile;
    const name = [firstName, lastName].filter(Boolean).join(' ');

    let user = await this.usersService.findByGoogleId(googleId);

    if (!user) {
      // User doesn't exist by Google ID, check by email
      user = await this.usersService.findByEmail(email);

      if (user) {
        // User exists by email - link Google account
        user = await this.usersService.update(user.id, {
          googleId: googleId,
          name: user.name || name,
          avatarUrl: user.avatarUrl || picture,
        });
      } else {
        // New user entirely
        user = await this.usersService.create({
          email: email,
          googleId: googleId,
          name: name,
          avatarUrl: picture,
        });
      }
    } else if (picture && user.avatarUrl !== picture) {
      // Update avatar if changed
      user = await this.usersService.update(user.id, {
        avatarUrl: picture,
      });
    }

    return this.generateTokens(user.id, user.email);
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.usersService.create({
      email: registerDto.email,
      name: registerDto.name,
      passwordHash,
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(`Failed login attempt: user not found (${loginDto.email})`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      this.logger.warn(`Failed login attempt: social-only account (${loginDto.email})`);
      throw new UnauthorizedException('Please login with Google');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt: invalid password (${loginDto.email})`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.email} (${user.id})`);
    return this.generateTokens(user.id, user.email);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user.id, user.email);
    } catch (_e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string | number>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as JwtSignOptions['expiresIn'],
      }),
    };
  }
}
