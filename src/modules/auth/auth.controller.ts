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
  Request as CommonRequest,
} from '@nestjs/common';
import { AuthGuard } from '../auth/strategies/accessToken.strategy';
import { constants } from 'src/config/constants';
import { AuthService } from './auth.service';
import {
  EmailLoginDto,
  EmailSignupDto,
  ForgotPasswordDto,
  PasswordResetDto,
  VerifyEmailDTO,
} from 'src/modules/auth/auth.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/db/types';
import { Request, Response } from 'express';
import { AuthGuard as GoogleGuard } from '@nestjs/passport';
import { GoogleAuthenticatedRequest } from 'src/common/types/AuthenticatedRequest';

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
  @Get('signin/google')
  @UseGuards(GoogleGuard('google'))
  async googleAuth() {
    // Empty method, redirect automatically
  }

  @Get('signin/google/callback')
  @UseGuards(GoogleGuard('google'))
  async googleAuthRedirect(
    @Req() req: GoogleAuthenticatedRequest,
    @Res() res: Response,
  ) {
    const googleUser = req.user;
    await this.authService.googleAuthCallback(googleUser, res);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('register')
  public async signupEmail(
    @Body() signupEmailDto: EmailSignupDto,
    @Res() res: Response,
    @Query('role') role?: Role,
  ) {
    const result = await this.authService.register(
      signupEmailDto.username,
      signupEmailDto.email,
      signupEmailDto.password,
      role,
      res,
    );

    res.json(result);
  }

  @Post('refresh')
  refresh(@Res() response: Response, @Req() request: Request) {
    const result = this.authService.refreshTokens(response, request);
    response.json(result);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    return this.authService.logout(res);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Post('verify-email')
  verifyEmail(@CommonRequest() req: any) {
    return this.authService.verifyEmail(req.user.userId);
  }

  @Post('prove-token')
  proveEmailToken(@Body() verifyData: VerifyEmailDTO) {
    return this.authService.proveToken(verifyData.token, verifyData.userId);
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
