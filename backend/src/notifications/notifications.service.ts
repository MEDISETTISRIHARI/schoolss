import { Injectable, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationFiltersDto } from './dto/notification-filters.dto';
import { UserRole } from '@prisma/client';

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
        data: createNotificationDto.data as any,
        targetRoles: createNotificationDto.targetRoles ?? [],
        targetUserIds: createNotificationDto.targetUserIds ?? [],
        targetClassIds: createNotificationDto.targetClassIds ?? [],
        targetSectionIds: createNotificationDto.targetSectionIds ?? [],
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

    return notification;
  }

  async send(actorId: string, createNotificationDto: CreateNotificationDto, requester: NotificationsRequester) {
    return this.create(actorId, createNotificationDto, requester);
  }

  async findAll(requester: NotificationsRequester, filters: NotificationFiltersDto) {
    const where: any = { deletedAt: null };

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

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    return notification;
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

    const data: any = { ...updateNotificationDto };
    if (data.data !== undefined) {
      data.data = data.data as any;
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

    return updated;
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

    return removed;
  }
}
