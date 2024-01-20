import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ResetTokenGuard extends AuthGuard('jwt-reset') {}
