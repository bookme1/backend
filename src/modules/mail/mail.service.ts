import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';
import { EmailTemplateParams } from './mail-interface';

@Injectable()
export class MailService {
  sendMail(): void {
    throw new Error('Method not implemented.');
  }
  constructor(private mailerService: MailerService) {}

  async sendForgotPasswordEmail(
    params: EmailTemplateParams,
  ): Promise<SentMessageInfo> {
    try {
      const response = await this.mailerService.sendMail({
        to: params.to_email,
        from: process.env.ADMIN_EMAIL,
        subject: 'Forgot password',
        text: params.link,
      });
      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      if (error) {
        console.log('EMAILJS FAILED...', error);
        return false;
      }
      console.log('ERROR', error);
      return false;
    }
  }
}
