import { IsString, IsOptional, IsDateString, MaxLength, IsEmail } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  admissionNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

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
}
