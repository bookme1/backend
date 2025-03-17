import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.ADMIN_EMAIL_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.ADMIN_EMAIL,
          pass: process.env.ADMIN_EMAIL_IMAP_PASS,
        },
      },
    }),
    UsersModule,
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
