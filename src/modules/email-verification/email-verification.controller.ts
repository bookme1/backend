// import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
// import { EmailVerificationService } from './email-verification.service';
// import { ApiTags } from '@nestjs/swagger';

// @ApiTags('email-verification')
// @Controller('email-verification')
// export class EmailVerificationController {
//   constructor(
//     private readonly emailVerificationService: EmailVerificationService,
//   ) {}

//   @Post('verify')
//   async verifyEmail(@Body('email') email: string, @Body('code') code: string) {
//     if (!email || !code) {
//       throw new BadRequestException('Email and code are required');
//     }

//     await this.emailVerificationService.verifyCode(email, code);
//     return { message: 'Email successfully verified' };
//   }
// }
