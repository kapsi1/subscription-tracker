import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';
import { type Profile, Strategy, type VerifyCallback } from 'passport-google-oauth20';
import type { GoogleProfile } from '../interfaces/google-profile.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { name, emails, photos, id } = profile;
    const user: GoogleProfile = {
      googleId: id,
      email: emails && emails.length > 0 ? emails[0].value : '',
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: photos && photos.length > 0 ? photos[0].value : undefined,
      accessToken,
    };
    done(null, user);
  }
}
