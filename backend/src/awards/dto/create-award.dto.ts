import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { AwardType, AwardTypeValues } from '@school-management/shared-types';

export class CreateAwardDto {
  @IsString()
  @IsNotEmpty()
  studentId!: string;

@IsEnum([...AwardTypeValues] as const)
   type!: AwardType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  awardedDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  approvedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}
