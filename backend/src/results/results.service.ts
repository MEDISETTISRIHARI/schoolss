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
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { QueryResultDto } from './dto/query-result.dto';
import { UserRole, ResultStatus } from '@prisma/client';

@Injectable()
export class ResultsService {
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

  private async validateStudentInSchool(schoolId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null, user: { schoolId } },
    });
    if (!student) {
      throw new BadRequestException('Invalid student for this school');
    }
  }

  async create(actorId: string, createResultDto: CreateResultDto, requester: { role: UserRole; schoolId?: string }) {
    const targetSchoolId = this.getTargetSchoolId(requester, createResultDto.schoolId);

    await this.validateStudentInSchool(targetSchoolId, createResultDto.studentId);

    if (createResultDto.obtainedMarks > createResultDto.totalMarks) {
      throw new BadRequestException('Obtained marks cannot exceed total marks');
    }
    if (createResultDto.percentage > 100) {
      throw new BadRequestException('Percentage cannot exceed 100');
    }

    try {
      const result = await this.prisma.result.create({
        data: {
          ...createResultDto,
          schoolId: targetSchoolId,
          status: createResultDto.status ?? ResultStatus.DRAFT,
        },
      });

      await this.auditLogService.create({
        action: 'CREATE',
        resourceType: 'Result',
        resourceId: result.id,
        newValues: result,
        actorId,
        schoolId: targetSchoolId,
      });

      return result;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Result record already exists for this student, class and academic year');
      }
      throw error;
    }
  }

  async findAll(requester: { role: UserRole; schoolId?: string }, filters: QueryResultDto) {
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
    if (filters.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }
    if (filters.examinationId) {
      where.examinationId = filters.examinationId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const take = Math.min(filters.limit ?? 50, 200);
    const skip = filters.page && filters.page > 1 ? (filters.page - 1) * take : 0;

    return this.prisma.result.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const result = await this.prisma.result.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    return result.id;
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

    const result = await this.prisma.result.findFirst({ where });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    return result;
  }

  async findMy(actorId: string, requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Super admin can not view own results');
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const student = await this.prisma.student.findUnique({ where: { userId: actorId } });
    if (!student) {
      throw new ForbiddenException('Access denied: not a student');
    }

    return this.prisma.result.findMany({
      where: { schoolId: requester.schoolId, studentId: student.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(publicId: string, actorId: string, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const where: any = { id, deletedAt: null };

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    const existing = await this.prisma.result.findFirst({ where });

    if (!existing) {
      throw new NotFoundException('Result not found');
    }

    const updated = await this.prisma.result.update({
      where: { id },
      data: {
        status: ResultStatus.FINALIZED,
        finalizedAt: new Date(),
        finalizedBy: actorId,
      },
    });

    await this.auditLogService.create({
      action: 'APPROVE',
      resourceType: 'Result',
      resourceId: updated.id,
      oldValues: existing,
      newValues: updated,
      actorId,
      schoolId: existing.schoolId,
    });

    return updated;
  }

  async update(publicId: string, actorId: string, updateResultDto: UpdateResultDto, requester: { role: UserRole; schoolId?: string }) {
    const id = await this.resolvePublicId(publicId);
    const where: any = { id, deletedAt: null };

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      where.schoolId = requester.schoolId;
    }

    const existing = await this.prisma.result.findFirst({ where });

    if (!existing) {
      throw new NotFoundException('Result not found');
    }

    if (updateResultDto.studentId) {
      await this.validateStudentInSchool(existing.schoolId, updateResultDto.studentId);
    }

    if (
      updateResultDto.obtainedMarks !== undefined &&
      (updateResultDto.totalMarks !== undefined
        ? updateResultDto.obtainedMarks > updateResultDto.totalMarks
        : updateResultDto.obtainedMarks > Number(existing.totalMarks))
    ) {
      throw new BadRequestException('Obtained marks cannot exceed total marks');
    }
    if (updateResultDto.percentage !== undefined && updateResultDto.percentage > 100) {
      throw new BadRequestException('Percentage cannot exceed 100');
    }

    const updated = await this.prisma.result.update({
      where: { id },
      data: updateResultDto,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Result',
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

    const existing = await this.prisma.result.findFirst({ where });

    if (!existing) {
      throw new NotFoundException('Result not found');
    }

    const removed = await this.prisma.result.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Result',
      resourceId: removed.id,
      oldValues: existing,
      newValues: { deletedAt: removed.deletedAt },
      actorId,
      schoolId: existing.schoolId,
    });

    return removed;
  }
}
