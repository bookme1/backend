import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  EmailGoogleDto,
  EmailLoginDto,
  EmailSignupDto,
  ForgotPasswordDto,
  PasswordChangeDto,
  PasswordResetDto,
} from 'src/modules/auth/auth.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { constants } from 'src/config/constants';
import { RefreshTokenGuard } from 'src/common/guards/refreshToken.guard';
import { Role } from 'src/db/types';

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
  @Post('email/google')
  public googleLogin(@Body() googleEmailDto: EmailGoogleDto) {
    return this.authService.googleLogin(
      googleEmailDto.email,
      googleEmailDto.name,
    );
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('email/signup')
  public signupEmail(
    @Body() signupEmailDto: EmailSignupDto,
    @Query('role') role?: Role,
  ) {
    return this.authService.signupEmail(
      signupEmailDto.username,
      signupEmailDto.email,
      signupEmailDto.password,
      role,
    );
  }

  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Get('refresh')
  public refreshTokens(@Request() req: any) {
    const { id: userId } = req.user;
    return this.authService.refreshTokens(userId);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password/:id/:token')
  resetPassord(
    @Param('id') id: number,
    @Param('token') token: string,
    @Body() passwordResetDto: PasswordResetDto,
  ) {
    return this.authService.resetPassword(id, token, passwordResetDto);
  }

  @Post('change-password')
  changePassword(@Body() id: number, passwordChangeDto: PasswordChangeDto) {
    return this.authService.changePassword(id, passwordChangeDto);
  }
}
