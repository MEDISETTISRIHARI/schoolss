import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class StudentReportDto {
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;
}
