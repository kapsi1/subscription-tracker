import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Get,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AuthService } from './auth.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';

import type { ConfigService } from '@nestjs/config';
import type { RequestWithUser } from '../common/interfaces/request.interface';
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
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
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

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: RequestWithUser) {
    // For JWTs, real logouts are usually handled client side by dropping tokens,
    // but a successful server response signals completion.
    return { message: 'Logged out successfully' };
  }
}
