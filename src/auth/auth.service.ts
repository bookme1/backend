// import {
//   BadRequestException,
//   ConflictException,
//   ForbiddenException,
//   Injectable,
//   InternalServerErrorException,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { UserService } from '../user/user.service';
// import { JwtService } from '@nestjs/jwt';
// import { compare, hash } from 'bcrypt';
// import { getConfig } from 'src/config';
// import { sendEmail, sendResetPassword } from 'src/helpers/sendEmail';
// import { PasswordChangeDto } from 'src/modules/auth/auth.dto';

// const config = getConfig();

// @Injectable()
// export class AuthService {
//   constructor(
//     private readonly userService: UserService,
//     private readonly jwtService: JwtService,
//   ) {}

//   async loginEmail(email: string, password: string) {
//     const user = await this.userService.getByEmail(email);
//     if (!user) throw new UnauthorizedException();
//     const isPasswordValid = await compare(password, user.password);

//     if (!isPasswordValid) {
//       throw new UnauthorizedException();
//     }
//     const payload = {
//       id: user.id,
//       username: user.username,
//     };

//     if (!user.verified) {
//       const emailToken = await this.jwtService.signAsync(payload, {
//         secret: config.JWT_EMAIL_SECRET,
//         expiresIn: config.JWT_EMAIL_EXPIRES,
//       });

//       await sendEmail(email, emailToken);
//       return {
//         message: 'we sent you new email message',
//         id: user.id,
//       };
//     }

//     const tokens = await this.getTokens(payload);

//     return {
//       tokens,
//       user: this.userService.removePasswordFromUser(user),
//     };
//   }

//   async signupEmail(email: string, password: string) {
//     try {
//       const hashedPassword = await hash(password, 12);

//       const checkUser = await this.userService.getByEmail(email);
//       if (checkUser && checkUser.verified) {
//         throw new ConflictException();
//       }
//       if (!checkUser) {
//         const checkUser = await this.userService.saveUser({
//           email,
//           password: hashedPassword,
//         });
//         const checkPayload = {
//           id: checkUser.id,
//           username: checkUser.username,
//         };
//         const emailToken = await this.jwtService.signAsync(checkPayload, {
//           secret: config.JWT_EMAIL_SECRET,
//           expiresIn: config.JWT_EMAIL_EXPIRES,
//         });
//         await sendEmail(email, emailToken);

//         return 'Check your email! It can be in spam';
//       }
//       const user = await this.userService.getByEmail(email);
//       const payload = {
//         id: user.id,
//         username: user.username,
//       };
//       const emailToken = await this.jwtService.signAsync(payload, {
//         secret: config.JWT_EMAIL_SECRET,
//         expiresIn: config.JWT_EMAIL_EXPIRES,
//       });
//       if (!checkUser.verified) {
//         await sendEmail(email, emailToken);
//         return 'Check your email! It can be in spam';
//       }
//       return 'Ok';
//     } catch (error) {
//       console.error('Error signing up with email:', error);
//       throw new InternalServerErrorException({
//         statusCode: 500,
//         message: 'Failed to sign up with email.',
//         error: error.message,
//       });
//     }
//   }

//   async verifyEmail(emailToken) {
//     try {
//       const data = await this.jwtService.verifyAsync(emailToken, {
//         secret: config.JWT_EMAIL_SECRET,
//       });
//       const user = await this.userService.getById(data.id);

//       if (!user) throw new UnauthorizedException();
//       if (user.verified) {
//         throw new BadRequestException();
//       }

//       const updatedUser = await this.userService.verifyEmail(user.id);

//       const payload = {
//         id: updatedUser.id,
//         username: updatedUser.username,
//       };

//       const tokens = await this.getTokens(payload);

//       return {
//         tokens,
//         user: this.userService.removePasswordFromUser(updatedUser),
//       };
//     } catch (error) {
//       if (error.message === 'jwt expired') {
//         throw new UnauthorizedException('jwt expired');
//       }
//       throw error;
//     }
//   }

//   async verifyPasswordToken(token) {
//     try {
//       const data = await this.jwtService.verifyAsync(token, {
//         secret: config.JWT_RESET_SECRET,
//       });
//       const user = await this.userService.getById(data.id);
//       if (!user) throw new UnauthorizedException();

//       const payload = {
//         id: user.id,
//         username: user.username,
//       };
//       return payload;
//     } catch (error) {
//       if (error.message === 'jwt expired') {
//         throw new UnauthorizedException('jwt expired');
//       }
//       throw error;
//     }
//   }

//   async getResetPasswordToken(email: string) {
//     const user = await this.userService.getByEmail(email);
//     if (!user) {
//       throw new ConflictException();
//     }
//     const payload = { id: user.id, username: user.username };
//     const token = await this.getResetToken(payload);
//     return await sendResetPassword(email, token);
//   }

//   async resetPassword(payload) {
//     const { resetToken, password } = payload;
//     const userFromToken = await this.verifyPasswordToken(resetToken);
//     if (!userFromToken) {
//       throw new ConflictException();
//     }

//     const hashedPassword = await hash(password, 12);

//     const isChanged = await this.userService.changePassword(
//       userFromToken.id,
//       hashedPassword,
//     );

//     //wait service and check is updated
//     if (!isChanged.affected) {
//       throw new Error();
//     }
//     return { message: 'Password succesfully update' };
//   }

//   async changePassword(userId: number, payload: PasswordChangeDto) {
//     const user = await this.userService.getById(userId);
//     const { currentPassword, newPassword } = payload;

//     if (!user) throw new UnauthorizedException();

//     const isPasswordValid = await compare(currentPassword, user.password);

//     if (!isPasswordValid) {
//       throw new BadRequestException('current password is wrong');
//     }

//     const hashedPassword = await hash(newPassword, 12);

//     const isChanged = await this.userService.changePassword(
//       userId,
//       hashedPassword,
//     );

//     //wait service and check is updated
//     if (!isChanged.affected) {
//       throw new Error();
//     }

//     return { message: 'Password succesfully update' };
//   }

//   async refreshTokens(userId: number) {
//     const user = await this.userService.getById(userId);
//     if (!user) throw new ForbiddenException('Access Denied');
//     const payload = { id: user.id, username: user.username };

//     const tokens = await this.getTokens(payload);

//     return tokens;
//   }

//   async getTokens(payload: { id: number; username: string | null }) {
//     const [accessToken, refreshToken] = await Promise.all([
//       this.jwtService.signAsync(payload, {
//         secret: config.JWT_ACCESS_SECRET,
//         expiresIn: config.JWT_ACCESS_EXPIRES,
//       }),
//       this.jwtService.signAsync(payload, {
//         secret: config.JWT_REFRESH_SECRET,
//         expiresIn: config.JWT_REFRESH_EXPIRES,
//       }),
//     ]);
//     return {
//       accessToken,
//       refreshToken,
//     };
//   }

//   async getResetToken(payload: { id: number; username: string | null }) {
//     return await this.jwtService.signAsync(payload, {
//       secret: config.JWT_RESET_SECRET,
//       expiresIn: config.JWT_RESET_EXPIRES,
//     });
//   }
// }
