import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { UserRole } from '@school-management/shared-types';

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createClassDto: CreateClassDto, requester: { role: UserRole; schoolId?: string }) {
    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: createClassDto.academicYearId, schoolId: requester.schoolId, deletedAt: null },
    });

    if (!academicYear) {
      throw new BadRequestException('Invalid academic year for this school');
    }

    const existing = await this.prisma.class.findFirst({
      where: {
        schoolId: requester.schoolId,
        academicYearId: createClassDto.academicYearId,
        name: createClassDto.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Class with this name already exists for this academic year');
    }

    const cls = await this.prisma.class.create({
      data: {
        ...createClassDto,
        schoolId: requester.schoolId,
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'Class',
      resourceId: cls.id,
      newValues: cls,
      actorId,
      schoolId: requester.schoolId,
    });

    return cls;
  }

  async findAll(requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      return this.prisma.class.findMany({
        where: { deletedAt: null },
        include: { school: true, academicYear: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    return this.prisma.class.findMany({
      where: { schoolId: requester.schoolId, deletedAt: null },
      include: { school: true, academicYear: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const cls = await this.prisma.class.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    return cls.id;
  }

  async findOne(publicId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const cls = await this.prisma.class.findFirst({
      where: { id, deletedAt: null },
      include: { school: true, academicYear: true },
    });

    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && cls.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this class');
    }

    return cls;
  }

  async update(publicId: string, actorId: string, updateClassDto: UpdateClassDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const cls = await this.prisma.class.findFirst({
      where: { id, deletedAt: null },
    });

    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && cls.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this class');
    }

    const oldClass = { ...cls };

    if (updateClassDto.academicYearId) {
      const academicYear = await this.prisma.academicYear.findFirst({
        where: { id: updateClassDto.academicYearId, schoolId: cls.schoolId, deletedAt: null },
      });

      if (!academicYear) {
        throw new BadRequestException('Invalid academic year for this school');
      }
    }

    if (updateClassDto.name) {
      const existing = await this.prisma.class.findFirst({
        where: {
          schoolId: cls.schoolId,
          academicYearId: updateClassDto.academicYearId ?? cls.academicYearId,
          name: updateClassDto.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existing) {
        throw new BadRequestException('Class with this name already exists for this academic year');
      }
    }

    const updated = await this.prisma.class.update({
      where: { id },
      data: updateClassDto,
      include: { school: true, academicYear: true },
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Class',
      resourceId: updated.id,
      oldValues: oldClass,
      newValues: updated,
      actorId,
      schoolId: cls.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const cls = await this.prisma.class.findFirst({
      where: { id, deletedAt: null },
    });

    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && cls.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this class');
    }

    const updated = await this.prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Class',
      resourceId: updated.id,
      oldValues: cls,
      newValues: { deletedAt: updated.deletedAt },
      actorId,
      schoolId: cls.schoolId,
    });

    return { message: 'Class deleted successfully' };
  }
}
