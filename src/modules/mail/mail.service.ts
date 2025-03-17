import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserService } from '../user/user.service';
import { EmailTemplateDTO } from './mail-interface';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly userService: UserService,
  ) {}

  async sendEmail(params: EmailTemplateDTO): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        from: process.env.SADMIN_EMAIL,
        to: params.to_email,
        subject: params.subject,
        html: params.body,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendAllEmails(subject: string, content: string): Promise<void> {
    const users = await this.userService.findAll();
    users.forEach((user, index) => {
      setTimeout(async () => {
        try {
          await this.mailerService.sendMail({
            to: user.email,
            subject,
            text: content,
            html: `<b>${content}</b>`,
          });
          console.log(`Email sent to ${user.email}`);
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
        }
      }, index * 2000);
    });
  }

  // // Отправка письма с уникальной ссылкой верификации
  // async sendVerificationEmail(userId: number): Promise<void> {
  //   const user = await this.userService.getById(userId);
  //   const token = uuidv4();

  //   // Сохраняем токен в базе (срок действия, например, 24 часа)
  //   await this.emailVerificationService.saveVerificationToken(userId, token);

  //   const verificationUrl = `${process.env.FRONTEND_URL}/mail/verify-email?token=${token}`;

  //   await this.mailerService.sendMail({
  //     to: user.email,
  //     subject: 'Email Verification',
  //     html: `
  //       <p>Hello ${user.name}, please verify your email by clicking on the link below:</p>
  //       <a href="${verificationUrl}">Verify Email</a>
  //       <p>This link will expire in 24 hours.</p>
  //     `,
  //   });
  // }

  // Проверка и активация пользователя по токену
  // async verifyUserByToken(token: string): Promise<boolean> {
  //   const verificationRecord =
  //     await this.emailVerificationService.getVerificationByToken(token);

  //   if (!verificationRecord || verificationRecord.expirationDate < new Date()) {
  //     return false;
  //   }

  //   await this.userService.verifyUserEmail(verificationRecord.userId);
  //   await this.emailVerificationService.removeToken(token);
  //   return true;
  // }
}
