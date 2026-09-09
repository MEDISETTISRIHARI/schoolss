import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

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
      include: { user: true },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'Student',
      resourceId: student.id,
      newValues: student,
      actorId,
      schoolId: user.schoolId ?? undefined,
    });

    return student;
  }

  async findAll(requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      return this.prisma.student.findMany({
        where: { deletedAt: null },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    return this.prisma.student.findMany({
      where: {
        deletedAt: null,
        user: { schoolId: requester.schoolId },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
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
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && student.user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this student');
    }

    return student;
  }

  async update(publicId: string, actorId: string, updateStudentDto: UpdateStudentDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
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
      include: { user: true },
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

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
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
