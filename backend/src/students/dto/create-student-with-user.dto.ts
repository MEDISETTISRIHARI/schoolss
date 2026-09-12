import { IsEmail, IsString, IsNotEmpty, IsDateString, IsOptional, MaxLength, MinLength, IsEnum } from 'class-validator';
import { UserRole, UserRoleValues, UserStatus, UserStatusValues } from '@school-management/shared-types';

export class CreateStudentWithUserDto {
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

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  admissionNumber!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  gender!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  guardianName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  guardianPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  guardianRelation?: string;

  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @IsString()
  @IsNotEmpty()
  classId!: string;

  @IsString()
  @IsNotEmpty()
  sectionId!: string;

  @IsString()
  @IsNotEmpty()
  academicYearId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rollNumber?: string;

  @IsOptional()
  @IsString()
  schoolId?: string;
}
