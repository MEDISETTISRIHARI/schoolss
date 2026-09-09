/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { UserRole } from '@prisma/client';
import { CreateAwardDto } from './dto/create-award.dto';
import { UpdateAwardDto } from './dto/update-award.dto';
import { AwardFiltersDto } from './dto/award-filters.dto';

export interface AwardsRequester {
  role: UserRole;
  schoolId?: string;
  id?: string;
}

@Injectable()
export class AwardsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createAwardDto: CreateAwardDto, requester: AwardsRequester) {
    const student = await this.prisma.student.findFirst({
      where: { id: createAwardDto.studentId, deletedAt: null },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // school is never trusted from the client; it is derived from the student
    const targetSchoolId =
      requester.role === 'SUPER_ADMIN' ? student.user.schoolId : requester.schoolId;

    if (!targetSchoolId) {
      throw new ForbiddenException('School context required');
    }

    if (requester.role !== 'SUPER_ADMIN' && student.user.schoolId !== targetSchoolId) {
      throw new ForbiddenException('Access denied to this student');
    }

    const award = await this.prisma.award.create({
      data: {
        type: createAwardDto.type,
        studentId: createAwardDto.studentId,
        title: createAwardDto.title,
        description: createAwardDto.description,
        awardedDate: new Date(createAwardDto.awardedDate),
        approvedBy: createAwardDto.approvedBy,
        status: createAwardDto.status,
        schoolId: targetSchoolId,
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'Award',
      resourceId: award.id,
      newValues: award,
      actorId,
      schoolId: targetSchoolId,
    });

    return award;
  }

  async findAll(requester: AwardsRequester, filters: AwardFiltersDto) {
    const where: any = { deletedAt: null };

    if (requester.role === 'SUPER_ADMIN') {
      if (requester.schoolId) {
        where.schoolId = requester.schoolId;
      }
    } else {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;

      if (requester.role === 'STUDENT') {
        const student = await this.prisma.student.findFirst({
          where: { userId: requester.id, deletedAt: null },
          include: { user: true },
        });
        if (!student) {
          return [];
        }
        const { studentId } = filters;
        if (studentId && studentId !== student.id) {
          return [];
        }
        where.studentId = studentId ?? student.id;
      } else if (requester.role === 'TEACHER') {
        const allowedStudentIds = await this.resolveTeacherStudentIds(requester);
        if (allowedStudentIds.length === 0) {
          return [];
        }
        const { studentId } = filters;
        if (studentId && !allowedStudentIds.includes(studentId)) {
          return [];
        }
        where.studentId = studentId ? studentId : { in: allowedStudentIds };
      }
    }

    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.award.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const award = await this.prisma.award.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!award) {
      throw new NotFoundException('Award not found');
    }

    return award.id;
  }

  async findOne(publicId: string, requester: AwardsRequester) {
    const id = await this.resolvePublicId(publicId);
    const award = await this.prisma.award.findFirst({
      where: { id, deletedAt: null },
    });

    if (!award) {
      throw new NotFoundException('Award not found');
    }

    const allowed = await this.canAccessAward(award, requester);
    if (!allowed) {
      throw new ForbiddenException('Access denied to this award');
    }

    return award;
  }

  async update(
    publicId: string,
    actorId: string,
    updateAwardDto: UpdateAwardDto,
    requester: AwardsRequester,
  ) {
    const id = await this.resolvePublicId(publicId);
    const award = await this.prisma.award.findFirst({
      where: { id, deletedAt: null },
    });

    if (!award) {
      throw new NotFoundException('Award not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId || award.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this award');
      }
    }

    const data: any = { ...updateAwardDto };
    delete data.schoolId;

    if (data.awardedDate) {
      data.awardedDate = new Date(data.awardedDate);
    }

    if (data.studentId) {
       const student = await this.prisma.student.findFirst({
         where: { id: data.studentId },
         include: { user: true },
       });
       if (!student) {
         throw new NotFoundException('Student not found');
       }
       if (student.user.schoolId !== award.schoolId) {
         throw new ForbiddenException('Access denied to this student');
       }
     }

    const updated = await this.prisma.award.update({
      where: { id },
      data,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Award',
      resourceId: updated.id,
      oldValues: award,
      newValues: updated,
      actorId,
      schoolId: award.schoolId,
    });

    return updated;
  }

  async approve(publicId: string, actorId: string, requester: AwardsRequester) {
    const id = await this.resolvePublicId(publicId);
    const award = await this.prisma.award.findFirst({
      where: { id, deletedAt: null },
    });

    if (!award) {
      throw new NotFoundException('Award not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId || award.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this award');
      }
    }

    if (award.status === 'APPROVED') {
      throw new BadRequestException('Award is already approved');
    }

    const updated = await this.prisma.award.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: actorId },
    });

    await this.auditLogService.create({
      action: 'APPROVE',
      resourceType: 'Award',
      resourceId: updated.id,
      oldValues: award,
      newValues: updated,
      actorId,
      schoolId: award.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: AwardsRequester) {
    const id = await this.resolvePublicId(publicId);
    const award = await this.prisma.award.findFirst({
      where: { id, deletedAt: null },
    });

    if (!award) {
      throw new NotFoundException('Award not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId || award.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this award');
      }
    }

    const updated = await this.prisma.award.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Award',
      resourceId: updated.id,
      oldValues: award,
      newValues: updated,
      actorId,
      schoolId: award.schoolId,
    });

    return updated;
  }

  private async resolveTeacherStudentIds(requester: AwardsRequester): Promise<string[]> {
    if (!requester.schoolId || !requester.id) {
      return [];
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { userId: requester.id, deletedAt: null },
      include: { user: true },
    });

    if (!teacher) {
      return [];
    }

    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { teacherId: teacher.id, deletedAt: null },
      select: { classId: true, sectionId: true },
    });

    if (assignments.length === 0) {
      return [];
    }

    const pairs = new Map<string, { classId: string; sectionId: string | null }>();
    for (const assignment of assignments) {
      const key = `${assignment.classId}|${assignment.sectionId ?? ''}`;
      if (!pairs.has(key)) {
        pairs.set(key, { classId: assignment.classId, sectionId: assignment.sectionId ?? null });
      }
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        schoolId: requester.schoolId,
        deletedAt: null,
        OR: [...pairs.values()].map((p) => ({ classId: p.classId, sectionId: p.sectionId })),
      },
      select: { studentId: true },
    });

    return [...new Set(enrollments.map((e) => e.studentId))];
  }

  private async canAccessAward(award: any, requester: AwardsRequester): Promise<boolean> {
    if (requester.role === 'SUPER_ADMIN') {
      if (requester.schoolId && award.schoolId !== requester.schoolId) {
        return false;
      }
      return true;
    }

    if (!requester.schoolId || award.schoolId !== requester.schoolId) {
      return false;
    }

    if (requester.role === 'STUDENT') {
      const student = await this.prisma.student.findFirst({
        where: { userId: requester.id, deletedAt: null },
        include: { user: true },
      });
      return !!student && award.studentId === student.id;
    }

    if (requester.role === 'TEACHER') {
      const allowedStudentIds = await this.resolveTeacherStudentIds(requester);
      return allowedStudentIds.includes(award.studentId);
    }

    // SCHOOL_ADMIN / PRINCIPAL: any award within their school is accessible
    return true;
  }
}
