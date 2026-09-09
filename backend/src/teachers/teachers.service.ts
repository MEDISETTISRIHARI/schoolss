import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createTeacherDto: CreateTeacherDto, requester: { role: UserRole; schoolId?: string }) {
    const user = await this.prisma.user.findFirst({
      where: { id: createTeacherDto.userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }

      if (user.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Cannot create teacher for a user in another school');
      }
    }

    const teacher = await this.prisma.teacher.create({
      data: {
        employeeId: createTeacherDto.employeeId,
        userId: createTeacherDto.userId,
        dateOfBirth: new Date(createTeacherDto.dateOfBirth),
        gender: createTeacherDto.gender,
        bloodGroup: createTeacherDto.bloodGroup,
        address: createTeacherDto.address,
        qualification: createTeacherDto.qualification,
        experience: createTeacherDto.experience,
        joiningDate: createTeacherDto.joiningDate ? new Date(createTeacherDto.joiningDate) : new Date(),
      },
      include: { user: true },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'Teacher',
      resourceId: teacher.id,
      newValues: teacher,
      actorId,
      schoolId: user.schoolId ?? undefined,
    });

    return teacher;
  }

  async findAll(requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      return this.prisma.teacher.findMany({
        where: { deletedAt: null },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    return this.prisma.teacher.findMany({
      where: {
        deletedAt: null,
        user: { schoolId: requester.schoolId },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const teacher = await this.prisma.teacher.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher.id;
  }

  async findOne(publicId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && teacher.user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this teacher');
    }

    return teacher;
  }

  async update(publicId: string, actorId: string, updateTeacherDto: UpdateTeacherDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && teacher.user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this teacher');
    }

    const data: Record<string, unknown> = { ...updateTeacherDto };
    if (updateTeacherDto.dateOfBirth) {
      data.dateOfBirth = new Date(updateTeacherDto.dateOfBirth);
    }
    if (updateTeacherDto.joiningDate) {
      data.joiningDate = new Date(updateTeacherDto.joiningDate);
    }

    const updated = await this.prisma.teacher.update({
      where: { id },
      data,
      include: { user: true },
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Teacher',
      resourceId: updated.id,
      oldValues: teacher,
      newValues: updated,
      actorId,
      schoolId: teacher.user.schoolId ?? undefined,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && teacher.user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this teacher');
    }

    await this.prisma.teacher.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Teacher',
      resourceId: id,
      oldValues: teacher,
      actorId,
      schoolId: teacher.user.schoolId ?? undefined,
    });

    return { id };
  }
}
