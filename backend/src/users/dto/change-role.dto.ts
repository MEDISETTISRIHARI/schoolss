import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole, UserRoleValues } from '@school-management/shared-types';

export class ChangeRoleDto {
@IsEnum([...UserRoleValues] as const)
   @IsNotEmpty()
   role!: UserRole;
}
