import { Injectable, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateTimetableEntryDto } from './dto/create-timetable-entry.dto';
import { UpdateTimetableEntryDto } from './dto/update-timetable-entry.dto';
import { QueryTimetableDto } from './dto/query-timetable.dto';
import { UserRole } from '@school-management/shared-types';

export interface TimetableRequester {
  role: UserRole;
  schoolId?: string;
  id?: string;
}

@Injectable()
export class TimetableService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private async getTeacherForRequester(requester: TimetableRequester) {
    if (!requester.schoolId || !requester.id) {
      return null;
    }
    return this.prisma.teacher.findFirst({
      where: { userId: requester.id, deletedAt: null },
    });
  }

  private async getStudentForRequester(requester: TimetableRequester) {
    if (!requester.schoolId || !requester.id) {
      return null;
    }
    return this.prisma.student.findFirst({
      where: { userId: requester.id, deletedAt: null },
    });
  }

  private async validateRelatedEntities(schoolId: string, dto: Partial<CreateTimetableEntryDto & UpdateTimetableEntryDto>) {
    if (dto.classId) {
      const classRecord = await this.prisma.class.findFirst({
        where: { id: dto.classId, schoolId, deletedAt: null },
      });
      if (!classRecord) {
        throw new BadRequestException('Invalid class for this school');
      }
    }

    if (dto.sectionId) {
      const sectionWhere: Record<string, unknown> = { id: dto.sectionId, schoolId, deletedAt: null };
      if (dto.classId) {
        sectionWhere.classId = dto.classId;
      }
      const section = await this.prisma.section.findFirst({ where: sectionWhere });
      if (!section) {
        throw new BadRequestException('Invalid section for this school');
      }
    }

    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, schoolId, deletedAt: null },
      });
      if (!subject) {
        throw new BadRequestException('Invalid subject for this school');
      }
    }

    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { id: dto.teacherId, deletedAt: null, user: { schoolId } },
      });
      if (!teacher) {
        throw new BadRequestException('Invalid teacher for this school');
      }
    }

    if (dto.academicYearId) {
      const academicYear = await this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, schoolId, deletedAt: null },
      });
      if (!academicYear) {
        throw new BadRequestException('Invalid academic year for this school');
      }
    }
  }

  async create(
    actorId: string,
    createTimetableEntryDto: CreateTimetableEntryDto,
    requester: TimetableRequester,
  ) {
    const cls = await this.prisma.class.findFirst({
      where: { id: createTimetableEntryDto.classId, deletedAt: null },
    });
    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    const targetSchoolId =
      requester.role === 'SUPER_ADMIN' ? cls.schoolId : requester.schoolId;

    if (!targetSchoolId) {
      throw new ForbiddenException('School context required');
    }

    if (requester.role !== 'SUPER_ADMIN' && cls.schoolId !== targetSchoolId) {
      throw new ForbiddenException('Access denied to this class');
    }

    await this.validateRelatedEntities(targetSchoolId, createTimetableEntryDto);

    let teacherId = createTimetableEntryDto.teacherId;

    if (requester.role === 'TEACHER') {
      const teacher = await this.getTeacherForRequester(requester);
      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }
      if (createTimetableEntryDto.teacherId && createTimetableEntryDto.teacherId !== teacher.id) {
        throw new ForbiddenException('Cannot assign timetable to another teacher');
      }
      teacherId = teacher.id;
    }

    try {
      const timetableEntry = await this.prisma.timetableEntry.create({
        data: {
          schoolId: targetSchoolId,
          classId: createTimetableEntryDto.classId,
          sectionId: createTimetableEntryDto.sectionId ?? null,
          subjectId: createTimetableEntryDto.subjectId,
          teacherId,
          academicYearId: createTimetableEntryDto.academicYearId,
          dayOfWeek: createTimetableEntryDto.dayOfWeek,
          startTime: new Date(`1970-01-01T${createTimetableEntryDto.startTime}:00`),
          endTime: new Date(`1970-01-01T${createTimetableEntryDto.endTime}:00`),
          roomNumber: createTimetableEntryDto.roomNumber,
        },
      });

      await this.auditLogService.create({
        action: 'CREATE',
        resourceType: 'TimetableEntry',
        resourceId: timetableEntry.id,
        newValues: timetableEntry,
        actorId,
        schoolId: targetSchoolId,
      });

      return timetableEntry;
    } catch (error) {
      if (error instanceof Object && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Timetable slot already exists');
      }
      throw error;
    }
  }

  async findAll(requester: TimetableRequester, filters: QueryTimetableDto) {
    const where: Record<string, unknown> = { deletedAt: null };

    if (requester.role === 'SUPER_ADMIN') {
      if (filters.schoolId) {
        where.schoolId = filters.schoolId;
      }
    } else {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;

      if (requester.role === 'STUDENT') {
        const student = await this.getStudentForRequester(requester);
        if (!student) {
          return [];
        }
        const enrollments = await this.prisma.enrollment.findMany({
          where: {
            studentId: student.id,
            schoolId: requester.schoolId,
            deletedAt: null,
          },
          select: { classId: true, sectionId: true },
        });
        if (enrollments.length === 0) {
          return [];
        }
        where.OR = enrollments.map((e) => ({
          classId: e.classId,
          sectionId: e.sectionId ?? null,
        }));
      } else if (requester.role === 'TEACHER') {
        const teacher = await this.getTeacherForRequester(requester);
        if (!teacher) {
          return [];
        }
        if (filters.teacherId && filters.teacherId !== teacher.id) {
          return [];
        }
        where.teacherId = teacher.id;
      }
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
    if (filters.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }
    if (filters.dayOfWeek !== undefined) {
      where.dayOfWeek = filters.dayOfWeek;
    }

    return this.prisma.timetableEntry.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const timetableEntry = await this.prisma.timetableEntry.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!timetableEntry) {
      throw new NotFoundException('Timetable entry not found');
    }

    return timetableEntry.id;
  }

  async findOne(publicId: string, requester: TimetableRequester) {
    const id = await this.resolvePublicId(publicId);
    const timetableEntry = await this.prisma.timetableEntry.findFirst({
      where: { id, deletedAt: null },
    });

    if (!timetableEntry) {
      throw new NotFoundException('Timetable entry not found');
    }

    const allowed = await this.canAccessTimetable(timetableEntry, requester);
    if (!allowed) {
      throw new ForbiddenException('Access denied to this timetable entry');
    }

    return timetableEntry;
  }

  async update(
    publicId: string,
    actorId: string,
    updateTimetableEntryDto: UpdateTimetableEntryDto,
    requester: TimetableRequester,
  ) {
    const id = await this.resolvePublicId(publicId);
    const timetableEntry = await this.prisma.timetableEntry.findFirst({
      where: { id, deletedAt: null },
    });

    if (!timetableEntry) {
      throw new NotFoundException('Timetable entry not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId || timetableEntry.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this timetable entry');
      }
      const teacher = await this.getTeacherForRequester(requester);
      if (teacher && timetableEntry.teacherId !== teacher.id) {
        throw new ForbiddenException('Can only update timetable entries assigned to you');
      }
    }

    await this.validateRelatedEntities(timetableEntry.schoolId, updateTimetableEntryDto);

    const data: Record<string, unknown> = { ...updateTimetableEntryDto };
    delete data.schoolId;

    if (data.startTime) {
      data.startTime = new Date(`1970-01-01T${data.startTime}:00`);
    }
    if (data.endTime) {
      data.endTime = new Date(`1970-01-01T${data.endTime}:00`);
    }

    if (requester.role === 'TEACHER') {
      const teacher = await this.getTeacherForRequester(requester);
      if (teacher && data.teacherId && data.teacherId !== teacher.id) {
        throw new ForbiddenException('Cannot reassign timetable to another teacher');
      }
    }

    const updated = await this.prisma.timetableEntry.update({
      where: { id },
      data,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'TimetableEntry',
      resourceId: updated.id,
      oldValues: timetableEntry,
      newValues: updated,
      actorId,
      schoolId: timetableEntry.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: TimetableRequester) {
    const id = await this.resolvePublicId(publicId);
    const timetableEntry = await this.prisma.timetableEntry.findFirst({
      where: { id, deletedAt: null },
    });

    if (!timetableEntry) {
      throw new NotFoundException('Timetable entry not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId || timetableEntry.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this timetable entry');
      }
      const teacher = await this.getTeacherForRequester(requester);
      if (teacher && timetableEntry.teacherId !== teacher.id) {
        throw new ForbiddenException('Can only delete timetable entries assigned to you');
      }
    }

    const removed = await this.prisma.timetableEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'TimetableEntry',
      resourceId: removed.id,
      oldValues: timetableEntry,
      newValues: { deletedAt: removed.deletedAt },
      actorId,
      schoolId: timetableEntry.schoolId,
    });

    return removed;
  }

  private async canAccessTimetable(entity: Record<string, unknown>, requester: TimetableRequester): Promise<boolean> {
    if (requester.role === 'SUPER_ADMIN') {
      if (requester.schoolId && entity.schoolId !== requester.schoolId) {
        return false;
      }
      return true;
    }

    if (!requester.schoolId || entity.schoolId !== requester.schoolId) {
      return false;
    }

    if (requester.role === 'STUDENT') {
      const student = await this.getStudentForRequester(requester);
      if (!student) {
        return false;
      }
      const enrollments = await this.prisma.enrollment.findMany({
        where: { studentId: student.id, schoolId: requester.schoolId, deletedAt: null },
        select: { classId: true, sectionId: true },
      });
      return enrollments.some(
        (e) =>
          e.classId === entity.classId &&
          (e.sectionId ?? null) === (entity.sectionId ?? null),
      );
    }

    if (requester.role === 'TEACHER') {
      const teacher = await this.getTeacherForRequester(requester);
      if (!teacher) {
        return false;
      }
      return entity.teacherId === teacher.id;
    }

    return true;
  }
}
