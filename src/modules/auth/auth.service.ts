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
    // Set last user activity
    await this.userService.updateLoggedDate(user.id, '');

    return {
      tokens,
      user: this.userService.removePasswordFromUser(user),
    };
  }

  async googleLogin(email: string, name: string) {
    let user = await this.userService.getByEmail(email);
    if (!user) {
      this.googleSignup(name, email);
      user = await this.userService.getByEmail(email);
    }
    const payload = {
      id: user.id,
      username: user.username,
    };
    const tokens = await this.getTokens(payload);

    // Set last user activity
    await this.userService.updateLoggedDate(user.id, '');

    return {
      tokens,
      user: this.userService.removePasswordFromUser(user),
    };
  }

  async googleSignup(username: string, email: string) {
    try {
      const response = await this.userService.saveUser({
        username,
        email,
      });

      // Set last user activity
      await this.userService.updateLoggedDate(undefined, email);

      return response;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Failed to sign up with email.',
        error: error.message,
      });
    }
  }

  async signupEmail(username: string, email: string, password: string) {
    try {
      const hashedPassword = await hash(password, 12);
      const response = await this.userService.saveUser({
        username,
        email,
        password: hashedPassword,
      });

      // Set last user activity
      await this.userService.updateLoggedDate(undefined, email);

      return response;
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
    const userData = await this.userService.removePasswordFromUser(user);

    // Set last user activity
    await this.userService.updateLoggedDate(userId, '');

    return {
      tokens,
      userData,
    };
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
}
