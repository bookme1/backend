import { Body, Controller, Get, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  sendMail(): void {
    return this.mailService.sendMail();
  }

  @Post('send-all')
  async sendAllEmail(
    @Body('subject') subject: string,
    @Body('content') content: string,
  ) {
    await this.mailService.sendAllEmail(subject, content);
    return { message: 'Emails are being sent' };
  }
}
