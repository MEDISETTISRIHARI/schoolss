import {
  IsEnum,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  IsObject,
} from 'class-validator';
import { NotificationType, NotificationTypeValues } from '@school-management/shared-types';

export class CreateNotificationDto {
@IsEnum([...NotificationTypeValues] as const)
   type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body!: string;

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

  @IsOptional()
  @IsString()
  schoolId?: string;
}
