import { Expose, Type, plainToClass } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsString } from 'class-validator';
import 'reflect-metadata';
import * as dotenv from 'dotenv';

dotenv.config();

class ConfigDto {
  @Type(() => Number)
  @Expose()
  @IsInt()
  @IsNotEmpty()
  APP_PORT!: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  FRONTEND_DOMAIN!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  DB_USER!: string;

  @Type(() => Number)
  @Expose()
  @IsInt()
  @IsNotEmpty()
  DB_PORT!: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRES!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRES!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  JWT_EMAIL_SECRET!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  JWT_EMAIL_EXPIRES!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  JWT_RESET_SECRET!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  JWT_RESET_EXPIRES!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  APP_HOST!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  ENCRYPTION_KEY!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  IV!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  API_KEY!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  AUTH_DOMAIN!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  PROJECT_ID!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  STORAGE_BUCKET!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  MESSAGING_SENDER_ID!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  APP_ID!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  MEASUREMENT_ID!: string;

  @Expose()
  @IsEmail()
  @IsNotEmpty()
  OWNER_EMAIL!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  EMAIL_TOKEN!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  EMAIL_HOST!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  CLIENT_URL!: string;

  // GOOGLE INFO

  @Expose()
  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_ID!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_SECRET!: string;
}

export const getConfig = (): ConfigDto => {
  const config = plainToClass(ConfigDto, process.env, {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
  });

  return config;
};
