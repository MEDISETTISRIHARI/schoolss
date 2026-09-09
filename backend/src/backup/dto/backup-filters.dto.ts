import { IsOptional, IsString, IsDateString } from 'class-validator';

export class BackupFiltersDto {
  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  startedAfter?: string;

  @IsOptional()
  @IsDateString()
  startedBefore?: string;
}
