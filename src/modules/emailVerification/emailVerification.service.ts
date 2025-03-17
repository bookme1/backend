import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { VerificationToken } from 'src/db/VerificationToken';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(VerificationToken)
    private repo: Repository<VerificationToken>,
  ) {}

  async generateCode(userId: number) {
    // Get verification token if exists for user. If exists -> delete and create new. If does not exist -> create new
    const existingToken = await this.repo.findOne({
      where: { user: { id: userId } },
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours validity

    const newToken = uuidv4();

    if (existingToken) {
      // If token exists -> update it
      existingToken.token = newToken;
      existingToken.expiresAt = expiresAt;
      await this.repo.save(existingToken);
      return existingToken;
    }

    // If no token -> create new record
    const verificationToken = this.repo.create({
      user: { id: userId },
      token: newToken,
      expiresAt,
    });

    await this.repo.save(verificationToken);
    return verificationToken;
  }

  async verifyCode(token: string, userId: number) {
    const verificationToken = await this.repo.findOne({
      where: { token },
    });

    if (!verificationToken || verificationToken.user.id !== userId) {
      throw new NotFoundException('Token does not exist'); // 404
    }

    // Proving expiration date
    const now = new Date();
    if (verificationToken.expiresAt < now) {
      await this.repo.delete({ id: verificationToken.id });
      throw new HttpException('Token expired', HttpStatus.BAD_REQUEST); // 400
    }

    // Success! Verify user, then remove token from db
    const user = await this.userService.getUserData(userId);
    user.verified = true;
    await this.userService.saveUser(user);

    await this.repo.delete({ id: verificationToken.id }); // Remove used token

    return {
      message: 'Token verified successfully',
      statusCode: HttpStatus.OK, // 200
    };
  }
}
