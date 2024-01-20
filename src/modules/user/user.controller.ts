import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('user')
@Controller('api/user')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('/')
  public getAll() {
    return this.userService.findAll();
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/')
  public createUser(@Body() payload) {
    return this.userService.saveUser(payload);
  }
}
