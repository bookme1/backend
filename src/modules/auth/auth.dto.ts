import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  IsUUID,
} from 'class-validator';
import { Role } from 'src/db/types';

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

export class EmailGoogleDto {
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name!: string;
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

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class VerifyEmailDTO {
  @IsString()
  @IsNotEmpty()
  userId!: number;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  token!: string;
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

  // @Expose()
  // @IsString()
  // @IsNotEmpty()
  // resetToken!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  confirm_password!: string;
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

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
