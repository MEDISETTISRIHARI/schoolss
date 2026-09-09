import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AcademicYearsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createAcademicYearDto: CreateAcademicYearDto, requester: { role: UserRole; schoolId?: string }) {
    if (requester.role !== 'SUPER_ADMIN' && !requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const targetSchoolId = requester.schoolId;

    if (!targetSchoolId) {
      throw new ForbiddenException('School context required');
    }

    const academicYear = await this.prisma.academicYear.create({
      data: {
        schoolId: targetSchoolId,
        name: createAcademicYearDto.name,
        startDate: new Date(createAcademicYearDto.startDate),
        endDate: new Date(createAcademicYearDto.endDate),
        isActive: createAcademicYearDto.isActive ?? false,
        isCurrent: createAcademicYearDto.isCurrent ?? false,
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'AcademicYear',
      resourceId: academicYear.id,
      newValues: academicYear,
      actorId,
      schoolId: targetSchoolId,
    });

    return academicYear;
  }

  async findAll(requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      return this.prisma.academicYear.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    return this.prisma.academicYear.findMany({
      where: {
        schoolId: requester.schoolId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    return academicYear.id;
  }

  async findOne(publicId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id, deletedAt: null },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && academicYear.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this academic year');
    }

    return academicYear;
  }

  async update(publicId: string, actorId: string, updateAcademicYearDto: UpdateAcademicYearDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id, deletedAt: null },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && academicYear.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this academic year');
    }

    const data: Record<string, unknown> = { ...updateAcademicYearDto };
    if (updateAcademicYearDto.startDate) {
      data.startDate = new Date(updateAcademicYearDto.startDate);
    }
    if (updateAcademicYearDto.endDate) {
      data.endDate = new Date(updateAcademicYearDto.endDate);
    }

    const updated = await this.prisma.academicYear.update({
      where: { id },
      data,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'AcademicYear',
      resourceId: updated.id,
      oldValues: academicYear,
      newValues: updated,
      actorId,
      schoolId: updated.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id, deletedAt: null },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && academicYear.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this academic year');
    }

    await this.prisma.academicYear.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'AcademicYear',
      resourceId: id,
      oldValues: academicYear,
      actorId,
      schoolId: academicYear.schoolId,
    });

    return { id };
  }
}
