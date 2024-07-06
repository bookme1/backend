import {
  Request,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { constants } from 'src/config/constants';
import { BookType, UserBooksDTO } from './user.dto';

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

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Get('/books/:type')
  getUserBooks(@Request() req: any, @Param('type') type: BookType) {
    return this.userService.getUserBooks(type, req.user.id);
  }

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Post('/books')
  addUserBook(@Request() req: any, @Body() userBooksDTO: UserBooksDTO) {
    return this.userService.addUserBook(
      userBooksDTO.type,
      req.user.id,
      userBooksDTO.bookId,
    );
  }

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Delete('/books')
  removeUserBook(@Request() req: any, @Body() userBooksDTO: UserBooksDTO) {
    return this.userService.removeUserBook(
      userBooksDTO.type,
      req.user.id,
      userBooksDTO.bookId,
    );
  }
}
