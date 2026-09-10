import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { UserRole } from '@school-management/shared-types';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private stripUserPasswordHash(teacher: { user?: Record<string, unknown> }) {
    if (teacher.user) {
      delete (teacher.user as { passwordHash?: string }).passwordHash;
    }
    return teacher;
  }

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
      include: {
        user: {
          select: {
            id: true,
            publicId: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
            role: true,
            status: true,
            schoolId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'Teacher',
      resourceId: teacher.id,
      newValues: teacher,
      actorId,
      schoolId: user.schoolId ?? undefined,
    });

    return this.stripUserPasswordHash(teacher);
  }

  async findAll(requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      const teachers = await this.prisma.teacher.findMany({
        where: { deletedAt: null },
        include: {
          user: {
            select: {
              id: true,
              publicId: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              profileImageUrl: true,
              role: true,
              status: true,
              schoolId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return teachers.map((t) => this.stripUserPasswordHash(t));
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const teachers = await this.prisma.teacher.findMany({
      where: {
        deletedAt: null,
        user: { schoolId: requester.schoolId },
      },
      include: {
        user: {
          select: {
            id: true,
            publicId: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
            role: true,
            status: true,
            schoolId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return teachers.map((t) => this.stripUserPasswordHash(t));
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
      include: {
        user: {
          select: {
            id: true,
            publicId: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
            role: true,
            status: true,
            schoolId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && teacher.user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this teacher');
    }

    return this.stripUserPasswordHash(teacher);
  }

  async update(publicId: string, actorId: string, updateTeacherDto: UpdateTeacherDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            publicId: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
            role: true,
            status: true,
            schoolId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
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
      include: {
        user: {
          select: {
            id: true,
            publicId: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
            role: true,
            status: true,
            schoolId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
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

    return this.stripUserPasswordHash(updated);
  }

  async remove(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            publicId: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
            role: true,
            status: true,
            schoolId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
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
