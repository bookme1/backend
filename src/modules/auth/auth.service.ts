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
import { ForgotPasswordDto, PasswordResetDto } from './auth.dto';
import { Request, Response } from 'express';
import { EmailTemplateDTO } from '../mail/mail-interface';
import { VerificationEmailTemplate } from './EmailAuthTemplate';
import { EmailVerificationService } from '../emailVerification/emailVerification.service';

const config = getConfig();

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly verificationService: EmailVerificationService,
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

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: config.JWT_REFRESH_SECRET,
      });

      console.warn('payload', payload);

      const tokens = await this.generateTokens({
        userId: payload.userId,
        userName: payload.userName,
      });

      this.setAuthCookies(response, tokens);

      return { message: 'Tokens refreshed successfully' };
    } catch {
      return new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(response: Response) {
    response.clearCookie('accessToken', {
      httpOnly: true,
      sameSite: 'lax',
    });
    response.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
    });

    response.status(200).json({ message: 'Logged out successfully' });
  }

  async verifyEmail(userId: number) {
    // Find user in collection and prove, that he is not authenticated
    const user = await this.userService.getById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.verified) return { message: 'Already authenticated' };

    // generate verification token
    const token = await this.verificationService.generateCode(userId);
    const activationUrl = `${process.env.CLIENT_URL}/verify/?user=${userId}&token=${token.token}`;
    try {
      await this.mailService.sendEmail({
        to_email: user.email,
        subject: 'Bookme - активація акаунту',
        body: VerificationEmailTemplate.generate(user.username, activationUrl),
      });
      return { message: 'Email was sent successfully' };
    } catch (error) {
      return { message: 'Error by sending email', error };
    }
  }

  async proveToken(token: string, userId: number) {
    await this.verificationService.verifyCode(token, userId);
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
    const mailData: EmailTemplateDTO = {
      to_email: dto.email,
      subject: 'Password Reset Request',
      body: `Hello ${user.username},\n\nClick the link to reset your password:\n${link}\n\nIf you didn't request this, please ignore.`,
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
      maxAge: 1000 * 60 * 60 * 24 * 10, // 10 days
    });
  }

  async googleAuthCallback(
    user: { email: string; name: string },
    response: Response,
  ) {
    let existingUser = await this.userService.getByEmail(user.email);

    // Create a new user, if it doesn't exist
    if (!existingUser) {
      existingUser = await this.userService.saveUser({
        username: user.name,
        email: user.email,
        role: Role.User, // Role by default TODO: add opportunity to choose it somewhere also to author(or switch)
      });
    }

    const payload = {
      userId: existingUser.id,
      userName: existingUser.username,
    };

    const tokens = await this.generateTokens(payload);

    // Set cookies
    this.setAuthCookies(response, tokens);

    // Redirect to frontend
    return response.redirect(`${process.env.CLIENT_URL}/account`);
  }
}
