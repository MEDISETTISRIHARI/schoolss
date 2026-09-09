import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AwardType } from '@prisma/client';

export class AwardFiltersDto {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsEnum(AwardType)
  type?: AwardType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}
