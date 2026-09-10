import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ExaminationType, ExaminationTypeValues } from '@school-management/shared-types';

export class CreateExaminationDto {
  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsString()
  @IsNotEmpty()
  academicYearId!: string;

  @IsString()
  @IsNotEmpty()
  classId!: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

@IsEnum([...ExaminationTypeValues] as const)
   type!: ExaminationType;

  @IsDateString()
  date!: string;

  @IsInt()
  @Min(0)
  totalMarks!: number;

  @IsInt()
  @Min(0)
  passingMarks!: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFinalized?: boolean;
}
