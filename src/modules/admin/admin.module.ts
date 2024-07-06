import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../user/user.module';
import { User } from 'src/db/User';
import { UserService } from '../user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UsersModule],
  providers: [AdminService, UserService],
  controllers: [AdminController],
  exports: [TypeOrmModule],
})
export class AdminModule {}
