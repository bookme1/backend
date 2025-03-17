import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../user/user.module';
import { BooksModule } from '../book/book.module';
import { AuthGuard } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { EmailVerificationModule } from '../email-verification/email-verification.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'google' }),
    UsersModule,
    EmailVerificationModule,
    BooksModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    AuthGuard,
    RefreshTokenStrategy,
    MailService,
    GoogleStrategy,
  ],
})
export class AuthModule {}
