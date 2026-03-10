import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../notifications/email/email.service';
import { UsersService } from '../users/users.service';

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
    private emailService: EmailService,
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
          isVerified: true, // Google accounts are pre-verified
        });
      } else {
        // New user entirely
        user = await this.usersService.create({
          email: email,
          googleId: googleId,
          name: name,
          avatarUrl: picture,
          isVerified: true, // Google accounts are pre-verified
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
    const verificationToken = randomUUID();

    const user = await this.usersService.create({
      email: registerDto.email,
      name: registerDto.name,
      passwordHash,
      verificationToken,
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isVerified: false,
      language: registerDto.language,
    });

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.name || '',
        verificationToken,
        user.language as 'en' | 'pl',
      );
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${user.email}: ${error}`);
      // We still created the user, they can try to resend the email later
    }

    return { message: 'Verification email sent' };
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

    if (!user.isVerified) {
      this.logger.warn(`Failed login attempt: email not verified (${loginDto.email})`);
      throw new ForbiddenException('NOT_VERIFIED');
    }

    this.logger.log(`User logged in: ${user.email} (${user.id})`);
    return this.generateTokens(user.id, user.email);
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.usersService.update(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    });

    return this.generateTokens(user.id, user.email);
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = randomUUID();
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.usersService.update(user.id, {
      verificationToken,
      verificationTokenExpiresAt,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      user.name || '',
      verificationToken,
      user.language as 'en' | 'pl',
    );

    return { message: 'Verification email resent' };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.isVerified) {
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
