import { IsOptional, IsEnum, IsString } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class NotificationFiltersDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
