import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class AssignmentFiltersDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsOptional()
  @IsBoolean()
  isClassTeacher?: boolean;
}
