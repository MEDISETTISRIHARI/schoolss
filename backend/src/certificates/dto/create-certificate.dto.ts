import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  awardId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  studentId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  certificateNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  issuedBy?: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsString()
  schoolId?: string;
}
