import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class SchoolsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createSchoolDto: CreateSchoolDto) {
    const { isActive, ...rest } = createSchoolDto;

    const school = await this.prisma.school.create({
      data: {
        ...rest,
        isActive: isActive ?? true,
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'School',
      resourceId: school.id,
      newValues: school,
      actorId,
      schoolId: undefined,
    });

    return school;
  }

  async findAll(requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      return this.prisma.school.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    return this.prisma.school.findMany({
      where: { id: requester.schoolId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const school = await this.prisma.school.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return school.id;
  }

  async findOne(publicId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const school = await this.prisma.school.findFirst({
      where: { id, deletedAt: null },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && school.id !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this school');
    }

    return school;
  }

  async update(publicId: string, actorId: string, updateSchoolDto: UpdateSchoolDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const school = await this.prisma.school.findFirst({
      where: { id, deletedAt: null },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && school.id !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this school');
    }

    const updated = await this.prisma.school.update({
      where: { id },
      data: updateSchoolDto,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'School',
      resourceId: updated.id,
      oldValues: school,
      newValues: updated,
      actorId,
      schoolId: updated.id,
    });

    return updated;
  }

  async activate(publicId: string, actorId: string, requester: { role: UserRole }) {
    if (requester.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only platform administrators can activate schools');
    }

    const id = await this.resolvePublicId(publicId);
    const school = await this.prisma.school.findFirst({
      where: { id, deletedAt: null },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (school.isActive) {
      throw new BadRequestException('School is already active');
    }

    const updated = await this.prisma.school.update({
      where: { id },
      data: { isActive: true },
    });

    await this.auditLogService.create({
      action: 'ACTIVATE',
      resourceType: 'School',
      resourceId: updated.id,
      oldValues: { isActive: false },
      newValues: { isActive: true },
      actorId,
      schoolId: updated.id,
    });

    return updated;
  }

  async deactivate(publicId: string, actorId: string, requester: { role: UserRole }) {
    if (requester.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only platform administrators can deactivate schools');
    }

    const id = await this.resolvePublicId(publicId);
    const school = await this.prisma.school.findFirst({
      where: { id, deletedAt: null },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (!school.isActive) {
      throw new BadRequestException('School is already inactive');
    }

    const updated = await this.prisma.school.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditLogService.create({
      action: 'DEACTIVATE',
      resourceType: 'School',
      resourceId: updated.id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      actorId,
      schoolId: updated.id,
    });

    return updated;
  }
}
