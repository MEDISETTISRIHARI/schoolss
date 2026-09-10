import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { AttendanceStatus, AttendanceStatusValues } from '@school-management/shared-types';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsString()
  studentId?: string;

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
  @IsDateString()
  date?: string;

  @IsOptional()
@IsEnum([...AttendanceStatusValues] as const)
   status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  isFinalized?: boolean;

  @IsOptional()
  @IsString()
  correctedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  correctionReason?: string;
}
