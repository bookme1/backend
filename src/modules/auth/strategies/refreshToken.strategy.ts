import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { getConfig } from 'src/config';

type JwtPayload = {
  id: number;
  username: string;
};

const config = getConfig();

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request.cookies['refreshToken']; // Take token from cookies
        },
      ]),
      secretOrKey: config.JWT_REFRESH_SECRET,
      passReqToCallback: true, // Take request in validate for additional prove
    });
  }

  validate(request: Request, payload: JwtPayload) {
    const refreshToken = request.cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return payload;
  }
}
