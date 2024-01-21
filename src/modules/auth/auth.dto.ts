import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class EmailLoginDto {
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class EmailSignupDto {
  @Expose()
  @IsString()
  username!: string;

  @Expose()
  @IsEmail()
  email!: string;

  @Expose()
  @IsString()
  password!: string;
}

export class EmailVerifyDto {
  @IsString()
  @IsNotEmpty()
  emailToken!: string;
}

export class PasswordRecoveryDto {
  @Expose()
  @IsEmail()
  email!: string;
}

export class PasswordResetDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  password!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  resetToken!: string;
}

export class PasswordChangeDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

export class passwordVerifyDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  passwordToken!: string;
}
