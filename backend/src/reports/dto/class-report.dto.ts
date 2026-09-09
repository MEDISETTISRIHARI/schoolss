import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ClassReportDto {
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsOptional()
  @IsString()
  examinationId?: string;
}
