import { IsEmail, IsString, IsOptional, MinLength, IsEnum, MaxLength, IsNotEmpty } from 'class-validator';
import { UserRole, UserRoleValues, UserStatus, UserStatusValues } from '@school-management/shared-types';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImageUrl?: string;

@IsEnum([...UserRoleValues] as const)
   role!: UserRole;

  @IsOptional()
  @IsString()
  schoolId?: string;

@IsOptional()
   @IsEnum([...UserStatusValues] as const)
   status?: UserStatus;
}
