import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus, UserStatusValues } from '@school-management/shared-types';

export class ChangeStatusDto {
@IsEnum([...UserStatusValues] as const)
   @IsNotEmpty()
   status!: UserStatus;
}
