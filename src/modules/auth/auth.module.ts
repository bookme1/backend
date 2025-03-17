import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../user/user.module';
import { BooksModule } from '../book/book.module';
import { AuthGuard } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategies/google.strategy';
import { EmailVerificationModule } from '../emailVerification/emailVerification.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'google' }),
    UsersModule,
    BooksModule,
    EmailVerificationModule,
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
