import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../user/user.module';
import { BooksModule } from '../book/book.module';
import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { EmailVerificationModule } from '../email-verification/email-verification.module';

@Module({
  imports: [
    JwtModule.register({}),
    UsersModule,
    EmailVerificationModule,
    BooksModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    MailService,
  ],
})
export class AuthModule {}
