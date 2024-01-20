import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailLoginDto, EmailSignupDto } from 'src/modules/auth/auth.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { constants } from 'src/config/constants';
import { RefreshTokenGuard } from 'src/common/guards/refreshToken.guard';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('email/login')
  public loginEmail(@Body() loginEmailDto: EmailLoginDto) {
    return this.authService.loginEmail(
      loginEmailDto.email,
      loginEmailDto.password,
    );
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('email/signup')
  public signupEmail(@Body() signupEmailDto: EmailSignupDto) {
    return this.authService.signupEmail(
      signupEmailDto.email,
      signupEmailDto.password,
    );
  }

  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Get('refresh')
  public refreshTokens(@Request() req: any) {
    const { id: userId } = req.user;
    return this.authService.refreshTokens(userId);
  }
}
