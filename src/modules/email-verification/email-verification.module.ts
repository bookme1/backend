import { Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationController } from './email-verification.controller';
import { UserService } from '../user/user.service';

@Module({
  imports: [UserService],
  providers: [EmailVerificationService],
  controllers: [EmailVerificationController],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
