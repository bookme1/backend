// import {
//   Body,
//   Controller,
//   Get,
//   Patch,
//   Post,
//   Query,
//   Request,
//   UseGuards,
//   UsePipes,
//   ValidationPipe,
// } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import {
//   EmailLoginDto,
//   EmailSignupDto,
//   EmailVerifyDto,
//   PasswordRecoveryDto,
//   PasswordResetDto,
//   passwordVerifyDto,
// } from 'src/modules/auth/auth.dto';
// import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
// import { constants } from 'src/config/constants';
// import { RefreshTokenGuard } from 'src/common/guards/refreshToken.guard';
// import { ResetTokenGuard } from 'src/common/guards/resetToken.guard';

// @ApiTags('auth')
// @Controller('api/auth')
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//   @UsePipes(new ValidationPipe({ transform: true }))
//   @Post('email/login')
//   public loginEmail(@Body() loginEmailDto: EmailLoginDto) {
//     return this.authService.loginEmail(
//       loginEmailDto.email,
//       loginEmailDto.password,
//     );
//   }

//   @UsePipes(new ValidationPipe({ transform: true }))
//   @Post('email/signup')
//   public signupEmail(@Body() signupEmailDto: EmailSignupDto) {
//     return this.authService.signupEmail(
//       signupEmailDto.email,
//       signupEmailDto.password,
//     );
//   }

//   @Patch('email/verify')
//   public verifyEmail(@Query('emailToken') verifyEmailDto: EmailVerifyDto) {
//     return this.authService.verifyEmail(verifyEmailDto);
//   }

//   @Patch('password/recovery')
//   public resetPassword(@Body() resetPasswordDto: PasswordRecoveryDto) {
//     return this.authService.getResetPasswordToken(resetPasswordDto.email);
//   }

//   @Patch('password/recovery/verify')
//   public verifyPasswordToken(@Body() verifyPasswordDto: passwordVerifyDto) {
//     return this.authService.verifyPasswordToken(
//       verifyPasswordDto.passwordToken,
//     );
//   }

//   @UseGuards(ResetTokenGuard)
//   @UsePipes(new ValidationPipe({ transform: true }))
//   @ApiBearerAuth(constants.authPatternName)
//   @Patch('reset-password')
//   public changeUserPassword(
//     @Request() req: any,
//     @Body() resetDto: PasswordResetDto,
//   ) {
//     return this.authService.resetPassword(resetDto);
//   }

//   @UseGuards(RefreshTokenGuard)
//   @ApiBearerAuth(constants.authPatternName)
//   @Get('refresh')
//   public refreshTokens(@Request() req: any) {
//     const { id: userId } = req.user;
//     return this.authService.refreshTokens(userId);
//   }
// }
