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

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/')
  public createUser(@Body() payload) {
    return this.userService.saveUser(payload);
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
function Params(): (
  target: UsersController,
  propertyKey: 'getUserBooks',
  parameterIndex: 1,
) => void {
  throw new Error('Function not implemented.');
}
