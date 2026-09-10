import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AwardType, AwardTypeValues } from '@school-management/shared-types';

export class AwardFiltersDto {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
@IsEnum([...AwardTypeValues] as const)
   type?: AwardType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}
