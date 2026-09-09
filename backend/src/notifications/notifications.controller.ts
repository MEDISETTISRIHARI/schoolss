import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationFiltersDto } from './dto/notification-filters.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @RequirePermissions('notifications.manage')
  create(
    @CurrentUser() user: RequestUser,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(user.sub, createNotificationDto, {
      role: user.role,
      schoolId: user.schoolId,
    });
  }

  @Post('send')
  @RequirePermissions('notifications.send')
  send(
    @CurrentUser() user: RequestUser,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return this.notificationsService.send(user.sub, createNotificationDto, {
      role: user.role,
      schoolId: user.schoolId,
    });
  }

  @Get()
  @RequirePermissions('notifications.view')
  findAll(
    @CurrentUser() user: RequestUser,
    @Query() filters: NotificationFiltersDto,
  ) {
    return this.notificationsService.findAll(
      { role: user.role, schoolId: user.schoolId },
      filters,
    );
  }

  @Get(':publicId')
  @RequirePermissions('notifications.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.notificationsService.findOne(publicId, {
      role: user.role,
      schoolId: user.schoolId,
    });
  }

  @Patch(':publicId')
  @RequirePermissions('notifications.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(
      publicId,
      actorId,
      updateNotificationDto,
      { role: user.role, schoolId: user.schoolId },
    );
  }

  @Delete(':publicId')
  @RequirePermissions('notifications.manage')
  remove(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
  ) {
    return this.notificationsService.remove(publicId, actorId, {
      role: user.role,
      schoolId: user.schoolId,
    });
  }
}
