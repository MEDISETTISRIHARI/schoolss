import { IsString, IsOptional, IsNotEmpty, IsNumber, MaxLength } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsString()
  @IsNotEmpty()
  classId!: string;

  @IsString()
  @IsNotEmpty()
  academicYearId!: string;
}
