import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { Poppler } from 'node-poppler';
import { User } from 'src/db/User';

@Module({
  imports: [TypeOrmModule.forFeature([User]), Poppler],
  providers: [UserService, Poppler],
  controllers: [UsersController],
  exports: [TypeOrmModule],
})
export class UsersModule {}
