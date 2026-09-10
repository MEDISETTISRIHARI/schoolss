/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { UserRole } from '@school-management/shared-types';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AssignmentFiltersDto } from './dto/assignment-filters.dto';

export interface AssignmentRequester {
  role: UserRole;
  schoolId?: string;
  id?: string;
}

interface RelatedIds {
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  teacherId?: string;
  academicYearId?: string;
}

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private async getTeacherForRequester(requester: AssignmentRequester) {
    if (!requester.schoolId || !requester.id) {
      return null;
    }
    return this.prisma.teacher.findFirst({
      where: { userId: requester.id, deletedAt: null },
    });
  }

  private async getStudentForRequester(requester: AssignmentRequester) {
    if (!requester.schoolId || !requester.id) {
      return null;
    }
    return this.prisma.student.findFirst({
      where: { userId: requester.id, deletedAt: null },
    });
  }

  private async validateRelatedEntities(schoolId: string, ids: RelatedIds) {
    const { classId, sectionId, subjectId, teacherId, academicYearId } = ids;

    if (classId) {
      const classRecord = await this.prisma.class.findFirst({
        where: { id: classId, schoolId, deletedAt: null },
      });
      if (!classRecord) {
        throw new BadRequestException('Invalid class for this school');
      }
    }

    if (sectionId) {
      const sectionWhere: any = { id: sectionId, schoolId, deletedAt: null };
      if (classId) {
        sectionWhere.classId = classId;
      }
      const section = await this.prisma.section.findFirst({ where: sectionWhere });
      if (!section) {
        throw new BadRequestException('Invalid section for this school');
      }
    }

    if (subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: subjectId, schoolId, deletedAt: null },
      });
      if (!subject) {
        throw new BadRequestException('Invalid subject for this school');
      }
    }

    if (teacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { id: teacherId, deletedAt: null, user: { schoolId } },
      });
      if (!teacher) {
        throw new BadRequestException('Invalid teacher for this school');
      }
    }

    if (academicYearId) {
      const academicYear = await this.prisma.academicYear.findFirst({
        where: { id: academicYearId, schoolId, deletedAt: null },
      });
      if (!academicYear) {
        throw new BadRequestException('Invalid academic year for this school');
      }
    }
  }

  async create(
    actorId: string,
    createAssignmentDto: CreateAssignmentDto,
    requester: AssignmentRequester,
  ) {
    const cls = await this.prisma.class.findFirst({
      where: { id: createAssignmentDto.classId, deletedAt: null },
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

    await this.validateRelatedEntities(targetSchoolId, {
      sectionId: createAssignmentDto.sectionId,
      subjectId: createAssignmentDto.subjectId,
      academicYearId: createAssignmentDto.academicYearId,
    });

    let teacherId: string | undefined;

    if (requester.role === 'TEACHER') {
      const teacher = await this.getTeacherForRequester(requester);
      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }
      teacherId = teacher.id;
    }

    try {
      const assignment = await this.prisma.teacherAssignment.create({
        data: {
          schoolId: targetSchoolId,
          teacherId: teacherId!,
          classId: createAssignmentDto.classId,
          sectionId: createAssignmentDto.sectionId ?? null,
          subjectId: createAssignmentDto.subjectId,
          academicYearId: createAssignmentDto.academicYearId,
          isClassTeacher: createAssignmentDto.isClassTeacher ?? false,
        },
      });

      await this.auditLogService.create({
        action: 'CREATE',
        resourceType: 'TeacherAssignment',
        resourceId: assignment.id,
        newValues: assignment,
        actorId,
        schoolId: targetSchoolId,
      });

      return assignment;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Teacher assignment with these details already exists');
      }
      throw error;
    }
  }

  async findAll(requester: AssignmentRequester, filters: AssignmentFiltersDto) {
    const where: any = { deletedAt: null };

    if (requester.role === 'SUPER_ADMIN') {
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
      if (filters.isClassTeacher !== undefined) {
        where.isClassTeacher = filters.isClassTeacher;
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

      if (filters.classId) {
        where.classId = filters.classId;
      }
      if (filters.sectionId) {
        where.sectionId = filters.sectionId;
      }
      if (filters.subjectId) {
        where.subjectId = filters.subjectId;
      }
      if (filters.academicYearId) {
        where.academicYearId = filters.academicYearId;
      }
      if (filters.isClassTeacher !== undefined) {
        where.isClassTeacher = filters.isClassTeacher;
      }
    }

    return this.prisma.teacherAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolveId(id: string) {
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!assignment) {
      throw new NotFoundException('Teacher assignment not found');
    }

    return assignment;
  }

  async findOne(id: string, requester: AssignmentRequester) {
    const assignment = await this.resolveId(id);

    const allowed = await this.canAccessAssignment(assignment, requester);
    if (!allowed) {
      throw new ForbiddenException('Access denied to this teacher assignment');
    }

    return assignment;
  }

  async update(
    id: string,
    actorId: string,
    updateAssignmentDto: UpdateAssignmentDto,
    requester: AssignmentRequester,
  ) {
    const assignment = await this.resolveId(id);

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId || assignment.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this teacher assignment');
      }
      const teacher = await this.getTeacherForRequester(requester);
      if (teacher && assignment.teacherId !== teacher.id) {
        throw new ForbiddenException('Can only update teacher assignments assigned to you');
      }
    }

    await this.validateRelatedEntities(assignment.schoolId, {
      classId: updateAssignmentDto.classId,
      sectionId: updateAssignmentDto.sectionId,
      subjectId: updateAssignmentDto.subjectId,
      academicYearId: updateAssignmentDto.academicYearId,
    });

    const data: any = { ...updateAssignmentDto };
    delete data.schoolId;

    const updated = await this.prisma.teacherAssignment.update({
      where: { id },
      data,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'TeacherAssignment',
      resourceId: updated.id,
      oldValues: assignment,
      newValues: updated,
      actorId,
      schoolId: assignment.schoolId,
    });

    return updated;
  }

  async remove(id: string, actorId: string, requester: AssignmentRequester) {
    const assignment = await this.resolveId(id);

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId || assignment.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this teacher assignment');
      }
      const teacher = await this.getTeacherForRequester(requester);
      if (teacher && assignment.teacherId !== teacher.id) {
        throw new ForbiddenException('Can only delete teacher assignments assigned to you');
      }
    }

    const removed = await this.prisma.teacherAssignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'TeacherAssignment',
      resourceId: removed.id,
      oldValues: assignment,
      newValues: { deletedAt: removed.deletedAt },
      actorId,
      schoolId: assignment.schoolId,
    });

    return removed;
  }

  private async canAccessAssignment(entity: any, requester: AssignmentRequester): Promise<boolean> {
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
