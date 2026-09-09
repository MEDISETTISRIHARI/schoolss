import { Injectable, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileFiltersDto } from './dto/file-filters.dto';
import { UserRole } from '@prisma/client';

export interface FilesRequester {
  role: UserRole;
  schoolId?: string;
  id?: string;
}

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createFileDto: CreateFileDto, buffer: Buffer, originalName: string, mimeType: string, requester: FilesRequester) {
    const targetSchoolId =
      requester.role === 'SUPER_ADMIN' ? (createFileDto.schoolId ?? requester.schoolId) : requester.schoolId;

    if (!targetSchoolId) {
      throw new ForbiddenException('School context required');
    }

    if (requester.role !== 'SUPER_ADMIN' && createFileDto.schoolId && createFileDto.schoolId !== targetSchoolId) {
      throw new ForbiddenException('Access denied to this school');
    }

    const filename = `${Date.now()}-${originalName}`;
    const url = `/uploads/${filename}`;
    const path = `uploads/${filename}`;

    const file = await this.prisma.file.create({
      data: {
        schoolId: targetSchoolId,
        uploadedById: actorId,
        filename,
        originalName,
        mimeType,
        size: buffer.length,
        url,
        path,
        category: createFileDto.category,
        relatedEntity: createFileDto.relatedEntity,
        relatedId: createFileDto.relatedId,
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'File',
      resourceId: file.id,
      newValues: file,
      actorId,
      schoolId: targetSchoolId,
    });

    return file;
  }

  async findAll(requester: FilesRequester, filters: FileFiltersDto) {
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

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.relatedEntity) {
      where.relatedEntity = filters.relatedEntity;
    }
    if (filters.relatedId) {
      where.relatedId = filters.relatedId;
    }
    if (filters.search) {
      where.OR = [
        { originalName: { contains: filters.search, mode: 'insensitive' } },
        { filename: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const file = await this.prisma.file.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file.id;
  }

  async findOne(publicId: string, requester: FilesRequester) {
    const id = await this.resolvePublicId(publicId);
    const file = await this.prisma.file.findFirst({
      where: { id, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && file.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this file');
    }

    return file;
  }

  async update(publicId: string, actorId: string, updateFileDto: UpdateFileDto, requester: FilesRequester) {
    const id = await this.resolvePublicId(publicId);
    const file = await this.prisma.file.findFirst({
      where: { id, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && file.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this file');
    }

    const oldFile = { ...file };

    const updated = await this.prisma.file.update({
      where: { id },
      data: updateFileDto,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'File',
      resourceId: updated.id,
      oldValues: oldFile,
      newValues: updated,
      actorId,
      schoolId: file.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: FilesRequester) {
    const id = await this.resolvePublicId(publicId);
    const file = await this.prisma.file.findFirst({
      where: { id, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && file.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this file');
    }

    const removed = await this.prisma.file.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'File',
      resourceId: removed.id,
      oldValues: file,
      newValues: { deletedAt: removed.deletedAt },
      actorId,
      schoolId: file.schoolId,
    });

    return removed;
  }
}
