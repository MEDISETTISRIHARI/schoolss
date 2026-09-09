import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @IsString()
  @IsNotEmpty()
  academicYearId!: string;

  @IsOptional()
  @IsBoolean()
  isClassTeacher?: boolean;
}
