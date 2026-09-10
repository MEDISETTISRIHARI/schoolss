import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateBackupRecordDto } from './dto/create-backup-record.dto';
import { UpdateBackupRecordDto } from './dto/update-backup-record.dto';
import { BackupFiltersDto } from './dto/backup-filters.dto';
import { UserRole } from '@school-management/shared-types';

export interface BackupRequester {
  role: UserRole;
  schoolId?: string;
}

@Injectable()
export class BackupService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createBackupRecordDto: CreateBackupRecordDto, requester: BackupRequester) {
    const schoolId = createBackupRecordDto.schoolId ?? requester.schoolId;

    if (!schoolId) {
      throw new ForbiddenException('School context required');
    }

    if (requester.role !== 'SUPER_ADMIN' && schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this school');
    }

    const backupRecord = await this.prisma.backupRecord.create({
      data: {
        schoolId,
        type: createBackupRecordDto.type,
        status: createBackupRecordDto.status,
        storageUrl: createBackupRecordDto.storageUrl,
        size: createBackupRecordDto.size,
        completedAt: createBackupRecordDto.completedAt ? new Date(createBackupRecordDto.completedAt) : null,
        initiatedBy: actorId,
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'BackupRecord',
      resourceId: backupRecord.id,
      newValues: backupRecord,
      actorId,
      schoolId,
    });

    return backupRecord;
  }

  async findAll(requester: BackupRequester, filters: BackupFiltersDto) {
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

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.startedAfter) {
      where.startedAt = { gte: new Date(filters.startedAfter) };
    }
    if (filters.startedBefore) {
      where.startedAt = { lte: new Date(filters.startedBefore) };
    }

    return this.prisma.backupRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const backupRecord = await this.prisma.backupRecord.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!backupRecord) {
      throw new NotFoundException('Backup record not found');
    }

    return backupRecord.id;
  }

  async findOne(publicId: string, requester: BackupRequester) {
    const id = await this.resolvePublicId(publicId);
    const backupRecord = await this.prisma.backupRecord.findFirst({
      where: { id, deletedAt: null },
    });

    if (!backupRecord) {
      throw new NotFoundException('Backup record not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && backupRecord.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this backup record');
    }

    return backupRecord;
  }

  async update(publicId: string, actorId: string, updateBackupRecordDto: UpdateBackupRecordDto, requester: BackupRequester) {
    const id = await this.resolvePublicId(publicId);
    const backupRecord = await this.prisma.backupRecord.findFirst({
      where: { id, deletedAt: null },
    });

    if (!backupRecord) {
      throw new NotFoundException('Backup record not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && backupRecord.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this backup record');
    }

    const oldBackupRecord = { ...backupRecord };

    const updated = await this.prisma.backupRecord.update({
      where: { id },
      data: updateBackupRecordDto,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'BackupRecord',
      resourceId: updated.id,
      oldValues: oldBackupRecord,
      newValues: updated,
      actorId,
      schoolId: backupRecord.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: BackupRequester) {
    const id = await this.resolvePublicId(publicId);
    const backupRecord = await this.prisma.backupRecord.findFirst({
      where: { id, deletedAt: null },
    });

    if (!backupRecord) {
      throw new NotFoundException('Backup record not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && backupRecord.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this backup record');
    }

    const removed = await this.prisma.backupRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'BackupRecord',
      resourceId: removed.id,
      oldValues: backupRecord,
      newValues: { deletedAt: removed.deletedAt },
      actorId,
      schoolId: backupRecord.schoolId,
    });

    return removed;
  }
}
