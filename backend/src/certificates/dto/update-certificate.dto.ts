import {
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class UpdateCertificateDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  certificateNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  issuedBy?: string;
}
