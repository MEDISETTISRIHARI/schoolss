import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  relatedEntity?: string;

  @IsOptional()
  @IsString()
  relatedId?: string;

  @IsOptional()
  @IsString()
  schoolId?: string;
}
