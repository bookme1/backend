import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { getConfig } from 'src/config';
import { UserService } from '../user/user.service';

const config = getConfig();

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async loginEmail(email: string, password: string) {
    const user = await this.userService.getByEmail(email);
    if (!user) throw new UnauthorizedException();
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }
    const payload = {
      id: user.id,
      username: user.username,
    };
    const tokens = await this.getTokens(payload);

    return {
      tokens,
      user: this.userService.removePasswordFromUser(user),
    };
  }

  async signupEmail(email: string, password: string) {
    try {
      const hashedPassword = await hash(password, 12);
      return await this.userService.saveUser({
        email,
        password: hashedPassword,
      });
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Failed to sign up with email.',
        error: error.message,
      });
    }
  }

  async refreshTokens(userId: number) {
    const user = await this.userService.getById(userId);
    if (!user) throw new ForbiddenException('Access Denied');
    const payload = { id: user.id, username: user.username };

    const tokens = await this.getTokens(payload);

    return tokens;
  }

  async getTokens(payload: { id: number; username: string | null }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: config.JWT_ACCESS_SECRET,
        expiresIn: config.JWT_ACCESS_EXPIRES,
      }),
      this.jwtService.signAsync(payload, {
        secret: config.JWT_REFRESH_SECRET,
        expiresIn: config.JWT_REFRESH_EXPIRES,
      }),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async getResetToken(payload: { id: number; username: string | null }) {
    return await this.jwtService.signAsync(payload, {
      secret: config.JWT_RESET_SECRET,
      expiresIn: config.JWT_RESET_EXPIRES,
    });
  }
}
