import { Module } from '@nestjs/common';
import { UsersModule } from './user.module';
import { UserService } from './user.service';

@Module({
  imports: [UsersModule],
  providers: [UserService],
})
export class UserHttpModule {}
