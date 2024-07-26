// set-role.dto.ts

import { IsInt, IsNotEmpty, IsIn } from 'class-validator';
import { Role } from 'src/db/types';

export class SetRoleDto {
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsIn([Role.Admin, Role.User, Role.Moderator, Role.Author])
  role: Role;
}
