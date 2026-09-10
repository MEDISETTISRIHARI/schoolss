import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UserRole } from '@school-management/shared-types';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private stripUserPasswordHash(student: { user?: Record<string, unknown> }) {
    if (student.user) {
      delete (student.user as { passwordHash?: string }).passwordHash;
    }
    return student;
  }

  async create(actorId: string, createStudentDto: CreateStudentDto, requester: { role: UserRole; schoolId?: string }) {
    const user = await this.prisma.user.findFirst({
      where: { id: createStudentDto.userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }

      if (user.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Cannot create student for a user in another school');
      }
    }

    const student = await this.prisma.student.create({
      data: {
        admissionNumber: createStudentDto.admissionNumber,
        userId: createStudentDto.userId,
        dateOfBirth: new Date(createStudentDto.dateOfBirth),
        gender: createStudentDto.gender,
        bloodGroup: createStudentDto.bloodGroup,
        address: createStudentDto.address,
        guardianName: createStudentDto.guardianName,
        guardianPhone: createStudentDto.guardianPhone,
        guardianEmail: createStudentDto.guardianEmail,
        guardianRelation: createStudentDto.guardianRelation,
        enrollmentDate: createStudentDto.enrollmentDate ? new Date(createStudentDto.enrollmentDate) : new Date(),
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
      resourceType: 'Student',
      resourceId: student.id,
      newValues: student,
      actorId,
      schoolId: user.schoolId ?? undefined,
    });

    return this.stripUserPasswordHash(student);
  }

  async findAll(requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      const students = await this.prisma.student.findMany({
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
      return students.map((s) => this.stripUserPasswordHash(s));
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const students = await this.prisma.student.findMany({
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
    return students.map((s) => this.stripUserPasswordHash(s));
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const student = await this.prisma.student.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student.id;
  }

  async findOne(publicId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const student = await this.prisma.student.findFirst({
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

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && student.user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this student');
    }

    return this.stripUserPasswordHash(student);
  }

  async update(publicId: string, actorId: string, updateStudentDto: UpdateStudentDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const student = await this.prisma.student.findFirst({
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

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && student.user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this student');
    }

    const data: Record<string, unknown> = { ...updateStudentDto };
    if (updateStudentDto.dateOfBirth) {
      data.dateOfBirth = new Date(updateStudentDto.dateOfBirth);
    }
    if (updateStudentDto.enrollmentDate) {
      data.enrollmentDate = new Date(updateStudentDto.enrollmentDate);
    }

    const updated = await this.prisma.student.update({
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
      resourceType: 'Student',
      resourceId: updated.id,
      oldValues: student,
      newValues: updated,
      actorId,
      schoolId: student.user.schoolId ?? undefined,
    });

    return this.stripUserPasswordHash(updated);
  }

  async remove(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const student = await this.prisma.student.findFirst({
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

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && student.user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this student');
    }

    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Student',
      resourceId: id,
      oldValues: student,
      actorId,
      schoolId: student.user.schoolId ?? undefined,
    });

    return { id };
  }
}
