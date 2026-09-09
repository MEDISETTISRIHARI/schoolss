import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { AwardType } from '@prisma/client';

export class CreateAwardDto {
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @IsEnum(AwardType)
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
