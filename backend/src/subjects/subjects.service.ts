import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { UserRole } from '@school-management/shared-types';

@Injectable()
export class SubjectsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createSubjectDto: CreateSubjectDto, requester: { role: UserRole; schoolId?: string }) {
    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    if (createSubjectDto.code) {
      const existingCode = await this.prisma.subject.findFirst({
        where: { schoolId: requester.schoolId, code: createSubjectDto.code, deletedAt: null },
      });

      if (existingCode) {
        throw new BadRequestException('Subject with this code already exists for this school');
      }
    }

    const existingName = await this.prisma.subject.findFirst({
      where: { schoolId: requester.schoolId, name: createSubjectDto.name, deletedAt: null },
    });

    if (existingName) {
      throw new BadRequestException('Subject with this name already exists for this school');
    }

    const subject = await this.prisma.subject.create({
      data: {
        ...createSubjectDto,
        schoolId: requester.schoolId,
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'Subject',
      resourceId: subject.id,
      newValues: subject,
      actorId,
      schoolId: requester.schoolId,
    });

    return subject;
  }

  async findAll(requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      return this.prisma.subject.findMany({
        where: { deletedAt: null },
        include: { school: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    return this.prisma.subject.findMany({
      where: { schoolId: requester.schoolId, deletedAt: null },
      include: { school: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const subject = await this.prisma.subject.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject.id;
  }

  async findOne(publicId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const subject = await this.prisma.subject.findFirst({
      where: { id, deletedAt: null },
      include: { school: true },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && subject.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this subject');
    }

    return subject;
  }

  async update(publicId: string, actorId: string, updateSubjectDto: UpdateSubjectDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const subject = await this.prisma.subject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && subject.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this subject');
    }

    if (updateSubjectDto.code) {
      const existingCode = await this.prisma.subject.findFirst({
        where: { schoolId: subject.schoolId, code: updateSubjectDto.code, id: { not: id }, deletedAt: null },
      });

      if (existingCode) {
        throw new BadRequestException('Subject with this code already exists for this school');
      }
    }

    if (updateSubjectDto.name) {
      const existingName = await this.prisma.subject.findFirst({
        where: { schoolId: subject.schoolId, name: updateSubjectDto.name, id: { not: id }, deletedAt: null },
      });

      if (existingName) {
        throw new BadRequestException('Subject with this name already exists for this school');
      }
    }

    const oldSubject = { ...subject };

    const updated = await this.prisma.subject.update({
      where: { id },
      data: updateSubjectDto,
      include: { school: true },
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Subject',
      resourceId: updated.id,
      oldValues: oldSubject,
      newValues: updated,
      actorId,
      schoolId: subject.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const subject = await this.prisma.subject.findFirst({
      where: { id, deletedAt: null },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && subject.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this subject');
    }

    const updated = await this.prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Subject',
      resourceId: updated.id,
      oldValues: subject,
      newValues: { deletedAt: updated.deletedAt },
      actorId,
      schoolId: subject.schoolId,
    });

    return { message: 'Subject deleted successfully' };
  }
}
