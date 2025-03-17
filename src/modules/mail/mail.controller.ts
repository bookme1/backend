import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { ApiTags } from '@nestjs/swagger';
import { EmailTemplateDTO } from './mail-interface';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/')
  async sendVerification(@Body() emailTemplate: EmailTemplateDTO) {
    await this.mailService.sendEmail(emailTemplate);
    return { message: 'Email sent successfully.' };
  }

  // @Get('verify-email')
  // async verifyEmail(@Query('token') token: string) {
  // const result = await this.mailService.verifyUserByToken(token);
  //   if (!result) {
  //     throw new BadRequestException('Invalid or expired verification token.');
  //   }
  //   return { message: 'Email verified successfully.' };
  // }

  @Post('send-all')
  async sendAllEmails(
    @Body('subject') subject: string,
    @Body('content') content: string,
  ) {
    await this.mailService.sendAllEmails(subject, content);
    return { message: 'Bulk emails are being sent.' };
  }
}
