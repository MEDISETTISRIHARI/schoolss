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
import { CreateExaminationDto } from './dto/create-examination.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';
import { QueryExaminationDto } from './dto/query-examination.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ExaminationsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private getTargetSchoolId(requester: { role: UserRole; schoolId?: string }, dtoSchoolId?: string): string {
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

  private async validateRelatedEntities(targetSchoolId: string, dto: Partial<CreateExaminationDto & UpdateExaminationDto>) {
    if (dto.academicYearId) {
      const academicYear = await this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, schoolId: targetSchoolId, deletedAt: null },
      });
      if (!academicYear) {
        throw new BadRequestException('Invalid academic year for this school');
      }
    }
    if (dto.classId) {
      const cls = await this.prisma.class.findFirst({
        where: { id: dto.classId, schoolId: targetSchoolId, deletedAt: null },
      });
      if (!cls) {
        throw new BadRequestException('Invalid class for this school');
      }
    }
    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({
        where: { id: dto.sectionId, schoolId: targetSchoolId, deletedAt: null },
      });
      if (!section) {
        throw new BadRequestException('Invalid section for this school');
      }
    }
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, schoolId: targetSchoolId, deletedAt: null },
      });
      if (!subject) {
        throw new BadRequestException('Invalid subject for this school');
      }
    }
  }

  async create(actorId: string, createExaminationDto: CreateExaminationDto, requester: { role: UserRole; schoolId?: string }) {
    const targetSchoolId = this.getTargetSchoolId(requester, createExaminationDto.schoolId);

    await this.validateRelatedEntities(targetSchoolId, createExaminationDto);

    if (createExaminationDto.passingMarks > createExaminationDto.totalMarks) {
      throw new BadRequestException('Passing marks cannot exceed total marks');
    }

    try {
      const examination = await this.prisma.examination.create({
        data: {
          ...createExaminationDto,
          schoolId: targetSchoolId,
          date: new Date(createExaminationDto.date),
          isPublished: createExaminationDto.isPublished ?? false,
          isFinalized: createExaminationDto.isFinalized ?? false,
        },
      });

      await this.auditLogService.create({
        action: 'CREATE',
        resourceType: 'Examination',
        resourceId: examination.id,
        newValues: examination,
        actorId,
        schoolId: targetSchoolId,
      });

      return examination;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Examination already exists for this class, subject and academic year');
      }
      throw error;
    }
  }

  async findAll(requester: { role: UserRole; schoolId?: string }, filters: QueryExaminationDto) {
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

    if (filters.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }
    if (filters.classId) {
      where.classId = filters.classId;
    }
    if (filters.sectionId) {
      where.sectionId = filters.sectionId;
    }
    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }
    if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.date.lte = new Date(filters.dateTo);
      }
    }
    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }
    if (filters.isFinalized !== undefined) {
      where.isFinalized = filters.isFinalized;
    }

    const take = Math.min(filters.limit ?? 50, 200);
    const skip = filters.page && filters.page > 1 ? (filters.page - 1) * take : 0;

    return this.prisma.examination.findMany({
      where,
      orderBy: { date: 'desc' },
      take,
      skip,
    });
  }

  async findOne(publicId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const where: any = { id, deletedAt: null };

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    const examination = await this.prisma.examination.findFirst({ where });

    if (!examination) {
      throw new NotFoundException('Examination not found');
    }

    return examination;
  }

  async findMy(actorId: string, requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Super admin can not view own examinations');
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const student = await this.prisma.student.findUnique({ where: { userId: actorId } });
    if (!student) {
      throw new ForbiddenException('Access denied: not a student');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { schoolId: requester.schoolId, studentId: student.id, deletedAt: null },
      select: { classId: true },
    });

    const classIds = enrollments.map((e) => e.classId);
    if (classIds.length === 0) {
      return [];
    }

    return this.prisma.examination.findMany({
      where: { schoolId: requester.schoolId, classId: { in: classIds }, deletedAt: null },
      orderBy: { date: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const examination = await this.prisma.examination.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!examination) {
      throw new NotFoundException('Examination not found');
    }

    return examination.id;
  }

  async publish(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const where: any = { id, deletedAt: null };

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    const examination = await this.prisma.examination.findFirst({
      where,
      select: { id: true, schoolId: true, teacherId: true, isPublished: true },
    });

    if (!examination) {
      throw new NotFoundException('Examination not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: actorId } });
      if (!teacher || examination.teacherId !== teacher.id) {
        throw new ForbiddenException('Access denied: examination is not assigned to this teacher');
      }
    }

    const updated = await this.prisma.examination.update({
      where: { id },
      data: { isPublished: true, isFinalized: true },
    });

    await this.auditLogService.create({
      action: 'PUBLISH',
      resourceType: 'Examination',
      resourceId: updated.id,
      oldValues: examination,
      newValues: updated,
      actorId,
      schoolId: examination.schoolId,
    });

    return updated;
  }

  async update(publicId: string, actorId: string, updateExaminationDto: UpdateExaminationDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const where: any = { id, deletedAt: null };

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    const existing = await this.prisma.examination.findFirst({ where });

    if (!existing) {
      throw new NotFoundException('Examination not found');
    }

    const targetSchoolId = existing.schoolId;

    await this.validateRelatedEntities(targetSchoolId, updateExaminationDto);

    if (updateExaminationDto.passingMarks !== undefined && updateExaminationDto.totalMarks !== undefined) {
      if (updateExaminationDto.passingMarks > updateExaminationDto.totalMarks) {
        throw new BadRequestException('Passing marks cannot exceed total marks');
      }
    }

    const data: any = { ...updateExaminationDto };
    delete data.schoolId;
    if (updateExaminationDto.date) {
      data.date = new Date(updateExaminationDto.date);
    }

    const updated = await this.prisma.examination.update({
      where: { id },
      data,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Examination',
      resourceId: updated.id,
      oldValues: existing,
      newValues: updated,
      actorId,
      schoolId: existing.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const where: any = { id, deletedAt: null };

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    const existing = await this.prisma.examination.findFirst({ where });

    if (!existing) {
      throw new NotFoundException('Examination not found');
    }

    const removed = await this.prisma.examination.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Examination',
      resourceId: removed.id,
      oldValues: existing,
      newValues: { deletedAt: removed.deletedAt },
      actorId,
      schoolId: existing.schoolId,
    });

    return removed;
  }
}
