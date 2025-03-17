import { Module } from '@nestjs/common';
import { EmailVerificationService } from './emailVerification.service';

import { UsersModule } from '../user/user.module';
import { VerificationToken } from 'src/db/VerificationToken';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([VerificationToken])],
  providers: [EmailVerificationService],
  controllers: [],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
