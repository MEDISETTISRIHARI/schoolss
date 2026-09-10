import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole, UserRoleValues } from '@school-management/shared-types';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsOptional()
@IsEnum([...UserRoleValues] as const)
   selectedRole?: UserRole;
}
