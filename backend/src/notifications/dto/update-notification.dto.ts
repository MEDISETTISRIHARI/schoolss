import {
  IsEnum,
  IsString,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  IsObject,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

export class UpdateNotificationDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUserIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetClassIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetSectionIds?: string[];

  @IsOptional()
  @IsBoolean()
  isSchoolWide?: boolean;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
