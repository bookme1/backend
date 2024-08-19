import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';
import { EmailTemplateParams } from './mail-interface';

import { UserService } from '../user/user.service';
import { EmailVerificationService } from '../email-verification/email-verification.service';

@Injectable()
export class MailService {
  sendMail(): void {
    throw new Error('Method not implemented.');
  }

  constructor(
    private mailerService: MailerService,
    private userService: UserService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  async sendEmail(params: EmailTemplateParams): Promise<SentMessageInfo> {
    try {
      const response = await this.mailerService.sendMail({
        to: params.to_email,
        from: process.env.SADMIN_EMAIL,
        subject: params.subject,
        text: params.text,
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

  async sendAllEmail(subject: string, content: string) {
    const users = await this.userService.findAll();
    users.forEach((user, index) => {
      setTimeout(() => {
        this.mailerService
          .sendMail({
            to: user.email,
            subject: subject,
            text: content,
            html: `<b>${content}</b>`,
          })
          .then(() => {
            console.log(`Email sent to ${user.email}`);
          })
          .catch((error) => {
            console.error(
              `Failed to send email to ${user.email}: ${error.message}`,
            );
          });
      }, index * 2000);
    });
  }

  async sendVerificationEmail(userId: number) {
    const user = await this.userService.getById(userId);
    await this.emailVerificationService.sendVerificationCode(userId);

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Email Verification Code',
      text: `Your verification code is: ${this.emailVerificationService.generateVerificationCode()}`,
    });
  }
}
