import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { getConfig } from 'src/config';
import { UserService } from '../user/user.service';
import { Role } from 'src/db/types';
import { MailService } from '../mail/mail.service';
import { EmailTemplateParams } from '../mail/mail-interface';
import { ForgotPasswordDto, PasswordResetDto } from './auth.dto';
import { Request, Response } from 'express';

const config = getConfig();

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  public async login(email: string, password: string, response: Response) {
    const user = await this.userService.getByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const payload = { userId: user.id, userName: user.username };
    const tokens = await this.generateTokens(payload);

    this.setAuthCookies(response, tokens);

    await this.userService.updateLoggedDate(user.id);

    return {
      message: 'Logged in successfully',
      user: this.userService.removePasswordFromUser(user),
    };
  }

  async register(
    username: string,
    email: string,
    password: string,
    role: Role = Role.User,
    response: Response,
  ) {
    const existingUser = await this.userService.getByEmail(email);
    if (existingUser) throw new ConflictException('Email already in use');

    const hashedPassword = await hash(password, 12);
    const user = await this.userService.saveUser({
      username,
      email,
      password: hashedPassword,
      role,
    });

    const payload = { userId: user.id, userName: user.username };
    const tokens = await this.generateTokens(payload);

    this.setAuthCookies(response, tokens);

    await this.userService.updateLoggedDate(user.id);

    return {
      message: 'Registered successfully',
      user: this.userService.removePasswordFromUser(user),
    };
  }

  async refreshTokens(response: Response, request: Request) {
    const refreshToken = request.cookies['refreshToken'];
    if (!refreshToken) return new UnauthorizedException('No refresh token');

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: config.JWT_REFRESH_SECRET,
      });

      const tokens = await this.generateTokens({
        userId: payload.id,
        userName: payload.username,
      });

      this.setAuthCookies(response, tokens);

      return { message: 'Tokens refreshed successfully' };
    } catch {
      return new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(response: Response) {
    response.clearCookie('accessToken', { httpOnly: true, secure: true });
    response.clearCookie('refreshToken', { httpOnly: true, secure: true });
    return { message: 'Logged out successfully' };
  }

  async sendPasswordResetLink(dto: ForgotPasswordDto) {
    const user = await this.userService.getByEmail(dto.email);
    if (!user) throw new UnauthorizedException('User not found');

    const payload = { id: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload, {
      secret: config.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user.id}/${token}`;
    const mailData: EmailTemplateParams = {
      to_name: user.username,
      to_email: dto.email,
      subject: 'Password Reset Request',
      text: `Hello ${user.username},\n\nClick the link to reset your password:\n${link}\n\nIf you didn't request this, please ignore.`,
    };

    await this.mailService.sendEmail(mailData);
    return { message: 'Password reset link sent to email' };
  }

  async resetPassword(id: number, token: string, dto: PasswordResetDto) {
    const payload = this.jwtService.verify(token, {
      secret: config.JWT_ACCESS_SECRET,
    });

    if (!payload || payload.id !== id) {
      throw new ForbiddenException('Invalid or expired token');
    }

    if (dto.password !== dto.confirm_password) {
      throw new ConflictException("Passwords don't match");
    }

    const hashedPassword = await hash(dto.password, 12);
    await this.userService.updatePassword(id, hashedPassword);

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(payload: {
    userId: number;
    userName: string | null;
  }) {
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
    return { accessToken, refreshToken };
  }

  private setAuthCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    response.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      // secure: true,
      // sameSite: 'strict',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      // secure: true,
      // sameSite: 'strict',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
  }

  async googleAuthCallback(
    user: { email: string; name: string },
    response: Response,
  ) {
    let existingUser = await this.userService.getByEmail(user.email);

    // Create user if the data doesn't exist
    if (!existingUser) {
      existingUser = await this.userService.saveUser({
        username: user.name,
        email: user.email,
        role: Role.User,
      });
    }

    const payload = {
      userId: existingUser.id,
      userName: existingUser.username,
    };
    const tokens = await this.generateTokens(payload);

    // Set cookies
    this.setAuthCookies(response, tokens);

    return response.redirect(`${process.env.CLIENT_DOMAIN}/dashboard`);
  }
}
