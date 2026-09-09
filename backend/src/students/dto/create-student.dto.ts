import { IsString, IsNotEmpty, IsDateString, IsOptional, MaxLength, IsEmail } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

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
}
