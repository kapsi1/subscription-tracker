import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { GoogleProfile } from './interfaces/google-profile.interface';

type RequestWithGoogleProfile = Request & {
  user: GoogleProfile;
};

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() _req: Request) {
    // Initiates Google OAuth2 flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: RequestWithGoogleProfile, @Res() res: Response) {
    const tokens = await this.authService.validateGoogleUser(req.user);
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    // Redirect to frontend with tokens as query params
    // In production, consider using secure, HttpOnly cookies for tokens instead
    return res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Post('register')
  async register(@Req() req: Request, @Body() registerDto: RegisterDto) {
    const isE2E = req.headers['x-e2e-testing'] === 'true' && process.env.NODE_ENV !== 'production';
    return this.authService.register(registerDto, isE2E);
  }

  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verify(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() _req: RequestWithUser) {
    // For JWTs, real logouts are usually handled client side by dropping tokens,
    // but a successful server response signals completion.
    return { message: 'Logged out successfully' };
  }
}
