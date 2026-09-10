import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationFiltersDto } from './dto/notification-filters.dto';
import { UserRole } from '@school-management/shared-types';
import { Prisma } from '@prisma/client';

export interface NotificationsRequester {
  role: UserRole;
  schoolId?: string;
  id?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createNotificationDto: CreateNotificationDto, requester: NotificationsRequester) {
    const targetSchoolId =
      requester.role === 'SUPER_ADMIN' ? (createNotificationDto.schoolId ?? requester.schoolId) : requester.schoolId;

    if (!targetSchoolId) {
      throw new ForbiddenException('School context required');
    }

    if (requester.role !== 'SUPER_ADMIN' && createNotificationDto.schoolId && createNotificationDto.schoolId !== targetSchoolId) {
      throw new ForbiddenException('Access denied to this school');
    }

    const notification = await this.prisma.notification.create({
      data: {
        schoolId: targetSchoolId,
        senderId: actorId,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        body: createNotificationDto.body,
        data: createNotificationDto.data ? JSON.stringify(createNotificationDto.data) : null,
        targetRoles: createNotificationDto.targetRoles ? JSON.stringify(createNotificationDto.targetRoles) : '[]',
        targetUserIds: createNotificationDto.targetUserIds ? JSON.stringify(createNotificationDto.targetUserIds) : '[]',
        targetClassIds: createNotificationDto.targetClassIds ? JSON.stringify(createNotificationDto.targetClassIds) : '[]',
        targetSectionIds: createNotificationDto.targetSectionIds ? JSON.stringify(createNotificationDto.targetSectionIds) : '[]',
        isSchoolWide: createNotificationDto.isSchoolWide ?? false,
        publishedAt: createNotificationDto.publishedAt ? new Date(createNotificationDto.publishedAt) : null,
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'Notification',
      resourceId: notification.id,
      newValues: notification,
      actorId,
      schoolId: targetSchoolId,
    });

    const result = notification;
    if (result.data !== null) {
      try {
        result.data = JSON.parse(result.data);
      } catch {
        // keep as string if invalid JSON
      }
    }
    return result;
  }

  async send(actorId: string, createNotificationDto: CreateNotificationDto, requester: NotificationsRequester) {
    return this.create(actorId, createNotificationDto, requester);
  }

  async findAll(requester: NotificationsRequester, filters: NotificationFiltersDto) {
    const where: Record<string, unknown> = { deletedAt: null };

    if (requester.role === 'SUPER_ADMIN') {
      if (filters.schoolId) {
        where.schoolId = filters.schoolId;
      }
    } else {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { body: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const results = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return results.map(notification => {
      const parsed = notification;
      if (parsed.data !== null) {
        try {
          parsed.data = JSON.parse(parsed.data);
        } catch {
          // keep as string
        }
      }
      return parsed;
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const notification = await this.prisma.notification.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification.id;
  }

  async findOne(publicId: string, requester: NotificationsRequester) {
    const id = await this.resolvePublicId(publicId);
    const notification = await this.prisma.notification.findFirst({
      where: { id, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && notification.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this notification');
    }

    const result = notification;
    if (result.data !== null) {
      try {
        result.data = JSON.parse(result.data);
      } catch {
        // keep as string
      }
    }
    return result;
  }

  async update(publicId: string, actorId: string, updateNotificationDto: UpdateNotificationDto, requester: NotificationsRequester) {
    const id = await this.resolvePublicId(publicId);
    const notification = await this.prisma.notification.findFirst({
      where: { id, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && notification.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this notification');
    }

    const oldNotification = { ...notification };

    const data: Prisma.NotificationUpdateInput = { ...updateNotificationDto } as Prisma.NotificationUpdateInput;
    if (updateNotificationDto.data !== undefined) {
      data.data = JSON.stringify(updateNotificationDto.data);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Notification',
      resourceId: updated.id,
      oldValues: oldNotification,
      newValues: updated,
      actorId,
      schoolId: notification.schoolId,
    });

    const result = updated;
    if (result.data !== null) {
      try {
        result.data = JSON.parse(result.data);
      } catch {
        // keep as string
      }
    }
    return result;
  }

  async remove(publicId: string, actorId: string, requester: NotificationsRequester) {
    const id = await this.resolvePublicId(publicId);
    const notification = await this.prisma.notification.findFirst({
      where: { id, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && notification.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this notification');
    }

    const removed = await this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Notification',
      resourceId: removed.id,
      oldValues: notification,
      newValues: { deletedAt: removed.deletedAt },
      actorId,
      schoolId: notification.schoolId,
    });

    const result = removed;
    if (result.data !== null) {
      try {
        result.data = JSON.parse(result.data);
      } catch {
        // keep as string
      }
    }
    return result;
  }
}
