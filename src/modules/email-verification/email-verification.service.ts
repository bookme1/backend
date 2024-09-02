import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
@Injectable()
export class EmailVerificationService {
  private readonly verificationCodes = new Map<
    string,
    { code: string; expiresIn: number }
  >();

  constructor(private readonly userService: UserService) {}

  generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendVerificationCode(userId: number): Promise<void> {
    const user = await this.userService.getById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const code = this.generateVerificationCode();
    const expiresIn = Date.now() + 10 * 60 * 1000; // the code is valid for 10 min
    this.verificationCodes.set(user.email, { code, expiresIn });
    }
    
  async verifyCode(email: string, code: string): Promise<void> {
    const storedCodeInfo = this.verificationCodes.get(email);

    if (!storedCodeInfo) {
      throw new BadRequestException('Verification code not found');
    }

    const { code: storedCode, expiresIn } = storedCodeInfo;

    if (Date.now() > expiresIn) {
      this.verificationCodes.delete(email);
      throw new BadRequestException('Verification code expired');
    }

    if (storedCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    this.verificationCodes.delete(email);
    const user = await this.userService.getByEmail(email);
    await this.userService.markEmailAsVerified(user.id);
  }
}
