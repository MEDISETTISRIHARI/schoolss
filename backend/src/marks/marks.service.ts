/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateMarkDto } from './dto/create-mark.dto';
import { UpdateMarkDto } from './dto/update-mark.dto';
import { QueryMarkDto } from './dto/query-mark.dto';
import { UserRole } from '@prisma/client';

interface Requester {
  role: UserRole;
  schoolId?: string;
}

interface SchoolMembershipIds {
  examinationId: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
}

@Injectable()
export class MarksService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private getTargetSchoolId(requester: Requester, dtoSchoolId?: string): string {
    if (requester.role === 'SUPER_ADMIN') {
      const sid = dtoSchoolId ?? requester.schoolId;
      if (!sid) {
        throw new BadRequestException('School assignment is required');
      }
      return sid;
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    if (dtoSchoolId && dtoSchoolId !== requester.schoolId) {
      throw new ForbiddenException('Cannot assign record to another school');
    }

    return requester.schoolId;
  }

  private async validateSchoolMemberships(schoolId: string, ids: SchoolMembershipIds) {
    const examination = await this.prisma.examination.findFirst({
      where: { id: ids.examinationId, schoolId, deletedAt: null },
    });
    if (!examination) {
      throw new BadRequestException('Invalid examination for this school');
    }

    const subject = await this.prisma.subject.findFirst({
      where: { id: ids.subjectId, schoolId, deletedAt: null },
    });
    if (!subject) {
      throw new BadRequestException('Invalid subject for this school');
    }

    const student = await this.prisma.student.findFirst({
      where: { id: ids.studentId, deletedAt: null, user: { schoolId } },
    });
    if (!student) {
      throw new BadRequestException('Invalid student for this school');
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { id: ids.teacherId, deletedAt: null, user: { schoolId } },
    });
    if (!teacher) {
      throw new BadRequestException('Invalid teacher for this school');
    }

    return examination.totalMarks;
  }

  async create(actorId: string, createMarkDto: CreateMarkDto, requester: Requester) {
    const targetSchoolId = this.getTargetSchoolId(requester, createMarkDto.schoolId);

    const totalMarks = await this.validateSchoolMemberships(targetSchoolId, {
      examinationId: createMarkDto.examinationId,
      studentId: createMarkDto.studentId,
      subjectId: createMarkDto.subjectId,
      teacherId: createMarkDto.teacherId,
    });

    if (createMarkDto.marksObtained > totalMarks) {
      throw new BadRequestException('Marks obtained cannot exceed the examination total marks');
    }

    try {
      const mark = await this.prisma.mark.create({
        data: {
          ...createMarkDto,
          schoolId: targetSchoolId,
        },
      });

      await this.auditLogService.create({
        action: 'CREATE',
        resourceType: 'Mark',
        resourceId: mark.id,
        newValues: mark,
        actorId,
        schoolId: targetSchoolId,
      });

      return mark;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Mark already exists for this examination, student and subject');
      }
      throw error;
    }
  }

  async findAll(requester: Requester, filters: QueryMarkDto) {
    const where: any = { deletedAt: null };

    if (requester.role === 'SUPER_ADMIN') {
      if (filters.schoolId) {
        where.schoolId = filters.schoolId;
      }
    } else {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    if (filters.examinationId) {
      where.examinationId = filters.examinationId;
    }
    if (filters.studentId) {
      where.studentId = filters.studentId;
    }
    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }
    if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }

    const take = Math.min(filters.limit ?? 50, 200);
    const skip = filters.page && filters.page > 1 ? (filters.page - 1) * take : 0;

    return this.prisma.mark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const mark = await this.prisma.mark.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!mark) {
      throw new NotFoundException('Mark not found');
    }

    return mark.id;
  }

  async findOne(publicId: string, requester: Requester) {
    const id = await this.resolvePublicId(publicId);
    const where: any = { id, deletedAt: null };

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    const mark = await this.prisma.mark.findFirst({ where });

    if (!mark) {
      throw new NotFoundException('Mark not found');
    }

    return mark;
  }

  async findMy(actorId: string, requester: Requester) {
    if (requester.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Super admin can not view own marks');
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const student = await this.prisma.student.findUnique({ where: { userId: actorId } });
    if (!student) {
      throw new ForbiddenException('Access denied: not a student');
    }

    return this.prisma.mark.findMany({
      where: { schoolId: requester.schoolId, studentId: student.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(publicId: string, actorId: string, updateMarkDto: UpdateMarkDto, requester: Requester) {
    const id = await this.resolvePublicId(publicId);
    const where: any = { id, deletedAt: null };

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    const existing = await this.prisma.mark.findFirst({ where });

    if (!existing) {
      throw new NotFoundException('Mark not found');
    }

    const targetSchoolId = existing.schoolId;

    const resolved = {
      examinationId: updateMarkDto.examinationId ?? existing.examinationId,
      studentId: updateMarkDto.studentId ?? existing.studentId,
      subjectId: updateMarkDto.subjectId ?? existing.subjectId,
      teacherId: updateMarkDto.teacherId ?? existing.teacherId,
    };

    const totalMarks = await this.validateSchoolMemberships(targetSchoolId, resolved);

    if (updateMarkDto.marksObtained !== undefined && updateMarkDto.marksObtained > totalMarks) {
      throw new BadRequestException('Marks obtained cannot exceed the examination total marks');
    }

    const updated = await this.prisma.mark.update({
      where: { id },
      data: updateMarkDto,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Mark',
      resourceId: updated.id,
      oldValues: existing,
      newValues: updated,
      actorId,
      schoolId: targetSchoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: Requester) {
    const id = await this.resolvePublicId(publicId);
    const where: any = { id, deletedAt: null };

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    const existing = await this.prisma.mark.findFirst({ where });

    if (!existing) {
      throw new NotFoundException('Mark not found');
    }

    const removed = await this.prisma.mark.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Mark',
      resourceId: removed.id,
      oldValues: existing,
      newValues: { deletedAt: removed.deletedAt },
      actorId,
      schoolId: existing.schoolId,
    });

    return removed;
  }
}
