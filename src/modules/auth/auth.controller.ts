import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
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
  PasswordResetDto,
} from 'src/modules/auth/auth.dto';
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/db/types';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @UsePipes(new ValidationPipe({ transform: true }))
  @Post('login')
  public async loginEmail(
    @Body() loginEmailDto: EmailLoginDto,
    @Res() response: Response,
  ) {
    const result = await this.authService.login(
      loginEmailDto.email,
      loginEmailDto.password,
      response,
    );

    response.json(result);
  }

  // Redirect to Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Empty method, redirect automatically
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Body() user: EmailGoogleDto, @Res() res: Response) {
    return this.authService.googleAuthCallback(user, res);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('register')
  public signupEmail(
    @Body() signupEmailDto: EmailSignupDto,
    @Res() res: Response,
    @Query('role') role?: Role,
  ) {
    return this.authService.register(
      signupEmailDto.username,
      signupEmailDto.email,
      signupEmailDto.password,
      role,
      res,
    );
  }

  @Post('refresh')
  public async refresh(@Req() request: Request, @Res() response: Response) {
    const result = await this.authService.refreshTokens(response, request);
    console.warn(response.getHeaders());
    response.json(result);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    return this.authService.logout(res);
  }

  @Post('password-reset')
  sendResetLink(@Body() dto: ForgotPasswordDto) {
    return this.authService.sendPasswordResetLink(dto);
  }

  @Post('reset-password/:id/:token')
  resetPassword(@Req() req: Request, @Body() dto: PasswordResetDto) {
    const { id, token } = req.params;
    return this.authService.resetPassword(+id, token, dto);
  }
}
