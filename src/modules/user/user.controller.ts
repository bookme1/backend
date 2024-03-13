import {
  Request,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { constants } from 'src/config/constants';
import { bookIdDto } from './user.dto';

@ApiTags('user')
@Controller('api/user')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Get()
  getUserData(@Request() req: any) {
    const { id: userId } = req.user;

    return this.userService.getUserData(userId);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/')
  public createUser(@Body() payload) {
    return this.userService.saveUser(payload);
  }

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Get('/favorite')
  getUserFavBooks(@Request() req: any) {
    const { id: userId } = req.user;

    return this.userService.getUserFavBooks(userId);
  }

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Post('/favorite')
  addUserFavBook(@Request() req: any, @Body() favBookDto: bookIdDto) {
    const { id: userId } = req.user;
    return this.userService.addUserFavBook(userId, favBookDto.bookId);
  }

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Delete('/favorite')
  removeUserFavBook(@Request() req: any, @Body() favBookDto: bookIdDto) {
    const { id: userId } = req.user;

    return this.userService.removeUserFavBook(userId, favBookDto.bookId);
  }
}
