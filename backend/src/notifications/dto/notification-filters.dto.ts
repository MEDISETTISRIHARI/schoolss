import { IsOptional, IsEnum, IsString } from 'class-validator';
import { NotificationType, NotificationTypeValues } from '@school-management/shared-types';

export class NotificationFiltersDto {
  @IsOptional()
@IsEnum([...NotificationTypeValues] as const)
   type?: NotificationType;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
