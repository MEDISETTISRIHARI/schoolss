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
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AttendanceService {
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

  private resolveStudentId(actorId: string): Promise<string | null> {
    return this.prisma.student.findUnique({ where: { userId: actorId } }).then((student) => student?.id ?? null);
  }

  async create(actorId: string, createAttendanceDto: CreateAttendanceDto, requester: { role: UserRole; schoolId?: string }) {
    const targetSchoolId = this.getTargetSchoolId(requester, createAttendanceDto.schoolId);

    try {
      const attendance = await this.prisma.attendance.create({
        data: {
          ...createAttendanceDto,
          schoolId: targetSchoolId,
          isFinalized: createAttendanceDto.isFinalized ?? false,
        },
      });

      await this.auditLogService.create({
        action: 'CREATE',
        resourceType: 'Attendance',
        resourceId: attendance.id,
        newValues: attendance,
        actorId,
        schoolId: targetSchoolId,
      });

      return attendance;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Attendance record already exists for this student, class, subject and date');
      }
      throw error;
    }
  }

  async findAll(requester: { role: UserRole; schoolId?: string }, filters: QueryAttendanceDto) {
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

    if (filters.studentId) {
      where.studentId = filters.studentId;
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
    if (filters.status) {
      where.status = filters.status;
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
    if (filters.isFinalized !== undefined) {
      where.isFinalized = filters.isFinalized;
    }

    const take = Math.min(filters.limit ?? 50, 200);
    const skip = filters.page && filters.page > 1 ? (filters.page - 1) * take : 0;

    return this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take,
      skip,
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const attendance = await this.prisma.attendance.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return attendance.id;
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

    const attendance = await this.prisma.attendance.findFirst({ where });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return attendance;
  }

  async findMy(actorId: string, requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Super admin can not view a single student attendance');
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const targetSchoolId = requester.schoolId;
    const studentId = await this.resolveStudentId(actorId);

    if (!studentId) {
      throw new ForbiddenException('Access denied: not a student');
    }

    return this.prisma.attendance.findMany({
      where: { schoolId: targetSchoolId, studentId, deletedAt: null },
      orderBy: { date: 'desc' },
    });
  }

  async update(publicId: string, actorId: string, updateAttendanceDto: UpdateAttendanceDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const where: any = { id, deletedAt: null };

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    const existing = await this.prisma.attendance.findFirst({ where });

    if (!existing) {
      throw new NotFoundException('Attendance record not found');
    }

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: updateAttendanceDto,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Attendance',
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

    const existing = await this.prisma.attendance.findFirst({ where });

    if (!existing) {
      throw new NotFoundException('Attendance record not found');
    }

    const removed = await this.prisma.attendance.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Attendance',
      resourceId: removed.id,
      oldValues: existing,
      newValues: { deletedAt: removed.deletedAt },
      actorId,
      schoolId: existing.schoolId,
    });

    return removed;
  }
}
