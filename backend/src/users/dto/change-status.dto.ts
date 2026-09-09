import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class ChangeStatusDto {
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status!: UserStatus;
}
