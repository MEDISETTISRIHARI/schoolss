import { IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole, UserRoleValues } from '@school-management/shared-types';

export class GetAvailableRolesDto {
  @IsNotEmpty()
  @IsEnum([...UserRoleValues] as const)
  role!: UserRole;
}
