import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import * as bcrypt from 'bcrypt';
import { getConfig } from 'src/config';
import { UserService } from '../user/user.service';
import { Role } from 'src/db/types';
import { MailService } from '../mail/mail.service';
import { EmailTemplateParams } from '../mail/mail-interface';
import {
  ForgotPasswordDto,
  PasswordChangeDto,
  PasswordResetDto,
} from './auth.dto';

const config = getConfig();

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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

  async signupEmail(
    username: string,
    email: string,
    password: string,
    role: Role = Role.User,
  ) {
    try {
      const hashedPassword = await hash(password, 12);
      const response = await this.userService.saveUser({
        username,
        email,
        password: hashedPassword,
        role,
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const email = forgotPasswordDto.email;
    const user = await this.userService.getByEmail(email);
    if (!user) throw new UnauthorizedException();
    const payload = {
      id: user.id,
      username: user.username,
    };
    const tokens = await this.getTokens(payload);
    const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user.id}/${tokens.refreshToken}`;
    const mailData: EmailTemplateParams = {
      to_name: user.username,
      to_email: forgotPasswordDto.email,
      subject: 'Forgot password',
      text: `Шановний користувачу!
Ми вислали вам цей лист у відповідь на ваш запит змінити пароль на сайті. 
Якщо ви не робили цього запиту, проігноруйте цей лист!
Якщо ви робили цей запит, перейдіть за цим посиланням ${link} для зміни паролю.

З повагою,
команда BookMe`,
    };
    if (await this.mailService.sendPasswordEmail(mailData)) {
      return (
        HttpStatus.OK,
        'if you are registered, you will shortly receive reset email link'
      );
    }
    throw new ServiceUnavailableException(
      HttpStatus.SERVICE_UNAVAILABLE,
      'Service is unavailable',
    );
  }

  async resetPassword(
    id: number,
    token: string,
    passwordResetDto: PasswordResetDto,
  ) {
    const payload = this.jwtService.verify(token);
    if (!payload)
      throw new ForbiddenException(
        (HttpStatus.FORBIDDEN, 'expired or invalid token'),
      );
    const user = await this.userService.getById(id);
    if (!user) throw new UnauthorizedException();
    if (passwordResetDto.password !== passwordResetDto.confirm_password)
      throw new ConflictException(
        (HttpStatus.CONFLICT, "passwords don't match"),
      );
    const hashedPassword = await bcrypt.hash(passwordResetDto.password, 10);
    await this.updatePassword(id, hashedPassword);
    const mailData: EmailTemplateParams = {
      to_name: user.username,
      to_email: user.email,
      subject: 'Change password',
      text: `Ваш пароль зміненно.
      З повагою,
      команда BookMe`,
    };
    if (await this.mailService.sendPasswordEmail(mailData)) {
      return (
        HttpStatus.OK,
        'if you are registered, you will shortly receive reset email link'
      );
    }
    throw new ServiceUnavailableException(
      HttpStatus.SERVICE_UNAVAILABLE,
      'Service is unavailable',
    );
  }

  async changePassword(id: number, passwordChangeDto: PasswordChangeDto) {
    const user = await this.userService.getById(id);
    if (!user) throw new UnauthorizedException();
    const passwordMatch = await bcrypt.compare(
      passwordChangeDto.currentPassword,
      user.password,
    );
    if (!passwordMatch) {
      throw new BadRequestException('Old password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(passwordChangeDto.newPassword, 10);
    await this.updatePassword(id, hashedPassword);
    const mailData: EmailTemplateParams = {
      to_name: user.username,
      to_email: user.email,
      subject: 'Change password',
      text: `Ваш пароль зміненно.
      З повагою,
      команда BookMe`,
    };
    if (await this.mailService.sendPasswordEmail(mailData)) {
      return (
        HttpStatus.OK,
        'if you are registered, you will shortly receive reset email link'
      );
    }
    throw new ServiceUnavailableException(
      HttpStatus.SERVICE_UNAVAILABLE,
      'Service is unavailable',
    );
  }

  async updatePassword(id: number, newPassword: string) {
    return this.userService.updateLoggedDate(id, newPassword);
  }
}
