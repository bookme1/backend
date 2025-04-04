import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest } from 'src/common/types/AuthenticatedRequest';

type JwtPayload = {
  userId: number;
  userName: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = request.cookies['accessToken'];

    if (!accessToken) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(accessToken, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      request.user = payload;

      return true;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      } else if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      } else {
        throw new UnauthorizedException('Could not authenticate user');
      }
    }
  }
}
