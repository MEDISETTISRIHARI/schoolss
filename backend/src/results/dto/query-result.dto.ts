import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ResultStatus } from '@prisma/client';

export class QueryResultDto {
  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsOptional()
  @IsString()
  examinationId?: string;

  @IsOptional()
  @IsEnum(ResultStatus)
  status?: ResultStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
