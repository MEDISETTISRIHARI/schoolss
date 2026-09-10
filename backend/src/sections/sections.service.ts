import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { UserRole } from '@school-management/shared-types';

@Injectable()
export class SectionsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createSectionDto: CreateSectionDto, requester: { role: UserRole; schoolId?: string }) {
    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const classRecord = await this.prisma.class.findFirst({
      where: { id: createSectionDto.classId, schoolId: requester.schoolId, deletedAt: null },
    });

    if (!classRecord) {
      throw new BadRequestException('Invalid class for this school');
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: createSectionDto.academicYearId, schoolId: requester.schoolId, deletedAt: null },
    });

    if (!academicYear) {
      throw new BadRequestException('Invalid academic year for this school');
    }

    const existing = await this.prisma.section.findFirst({
      where: {
        schoolId: requester.schoolId,
        classId: createSectionDto.classId,
        name: createSectionDto.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Section with this name already exists for this class');
    }

    const section = await this.prisma.section.create({
      data: {
        ...createSectionDto,
        schoolId: requester.schoolId,
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'Section',
      resourceId: section.id,
      newValues: section,
      actorId,
      schoolId: requester.schoolId,
    });

    return section;
  }

  async findAll(requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      return this.prisma.section.findMany({
        where: { deletedAt: null },
        include: { school: true, class: true, academicYear: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    return this.prisma.section.findMany({
      where: { schoolId: requester.schoolId, deletedAt: null },
      include: { school: true, class: true, academicYear: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const section = await this.prisma.section.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return section.id;
  }

  async findOne(publicId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const section = await this.prisma.section.findFirst({
      where: { id, deletedAt: null },
      include: { school: true, class: true, academicYear: true },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && section.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this section');
    }

    return section;
  }

  async update(publicId: string, actorId: string, updateSectionDto: UpdateSectionDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const section = await this.prisma.section.findFirst({
      where: { id, deletedAt: null },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && section.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this section');
    }

    const oldSection = { ...section };

    const updated = await this.prisma.section.update({
      where: { id },
      data: updateSectionDto,
      include: { school: true, class: true, academicYear: true },
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Section',
      resourceId: updated.id,
      oldValues: oldSection,
      newValues: updated,
      actorId,
      schoolId: section.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const section = await this.prisma.section.findFirst({
      where: { id, deletedAt: null },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && section.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this section');
    }

    const updated = await this.prisma.section.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Section',
      resourceId: updated.id,
      oldValues: section,
      newValues: { deletedAt: updated.deletedAt },
      actorId,
      schoolId: section.schoolId,
    });

    return { message: 'Section deleted successfully' };
  }
}
