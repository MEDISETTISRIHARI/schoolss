import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ResultStatus } from '@prisma/client';

export class CreateResultDto {
  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @IsString()
  @IsNotEmpty()
  classId!: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsString()
  @IsNotEmpty()
  academicYearId!: string;

  @IsOptional()
  @IsString()
  examinationId?: string;

  @IsNumber()
  @Min(0)
  totalMarks!: number;

  @IsNumber()
  @Min(0)
  obtainedMarks!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage!: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gpa?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cgpa?: number;

  @IsOptional()
  @IsEnum(ResultStatus)
  status: ResultStatus = ResultStatus.DRAFT;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
