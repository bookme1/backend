import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class EmailTemplateDTO {
  @ApiProperty({ example: 'user@example.com', description: 'Recipient email' })
  @IsEmail()
  @IsNotEmpty()
  to_email: string;

  @ApiProperty({ example: 'Verification Email', description: 'Email subject' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: 'Your verification code is 123456',
    description: 'Email body',
  })
  @IsString()
  @IsNotEmpty()
  body: string;
}
