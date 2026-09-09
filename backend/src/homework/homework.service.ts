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
import { UserRole } from '@prisma/client';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { QueryHomeworkDto } from './dto/query-homework.dto';

export interface HomeworkRequester {
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
export class HomeworkService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private async getTeacherForRequester(requester: HomeworkRequester) {
    if (!requester.schoolId || !requester.id) {
      return null;
    }
    return this.prisma.teacher.findFirst({
      where: { userId: requester.id, deletedAt: null },
    });
  }

  private async getStudentForRequester(requester: HomeworkRequester) {
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
    createHomeworkDto: CreateHomeworkDto,
    requester: HomeworkRequester,
  ) {
    const cls = await this.prisma.class.findFirst({
      where: { id: createHomeworkDto.classId, deletedAt: null },
    });
    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    // school is derived from the class, never trusted from the client
    const targetSchoolId =
      requester.role === 'SUPER_ADMIN' ? cls.schoolId : requester.schoolId;

    if (!targetSchoolId) {
      throw new ForbiddenException('School context required');
    }

    if (requester.role !== 'SUPER_ADMIN' && cls.schoolId !== targetSchoolId) {
      throw new ForbiddenException('Access denied to this class');
    }

    await this.validateRelatedEntities(targetSchoolId, {
      sectionId: createHomeworkDto.sectionId,
      subjectId: createHomeworkDto.subjectId,
      teacherId: createHomeworkDto.teacherId,
      academicYearId: createHomeworkDto.academicYearId,
    });

    let teacherId = createHomeworkDto.teacherId;

    if (requester.role === 'TEACHER') {
      const teacher = await this.getTeacherForRequester(requester);
      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }
      if (createHomeworkDto.teacherId && createHomeworkDto.teacherId !== teacher.id) {
        throw new ForbiddenException('Cannot assign homework to another teacher');
      }
      teacherId = teacher.id;
    }

    try {
      const homework = await this.prisma.homework.create({
        data: {
          schoolId: targetSchoolId,
          classId: createHomeworkDto.classId,
          sectionId: createHomeworkDto.sectionId ?? null,
          subjectId: createHomeworkDto.subjectId,
          teacherId,
          academicYearId: createHomeworkDto.academicYearId,
          title: createHomeworkDto.title,
          description: createHomeworkDto.description,
          dueDate: new Date(createHomeworkDto.dueDate),
          attachmentUrl: createHomeworkDto.attachmentUrl,
          isPublished: createHomeworkDto.isPublished ?? false,
        },
      });

      await this.auditLogService.create({
        action: 'CREATE',
        resourceType: 'Homework',
        resourceId: homework.id,
        newValues: homework,
        actorId,
        schoolId: targetSchoolId,
      });

      return homework;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Homework with these details already exists');
      }
      throw error;
    }
  }

  async findAll(requester: HomeworkRequester, filters: QueryHomeworkDto) {
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
    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }
    if (filters.dueFromDate || filters.dueToDate) {
      where.dueDate = {};
      if (filters.dueFromDate) {
        where.dueDate.gte = new Date(filters.dueFromDate);
      }
      if (filters.dueToDate) {
        where.dueDate.lte = new Date(filters.dueToDate);
      }
    }

    const take = Math.min(filters.limit ?? 50, 200);
    const skip = filters.page && filters.page > 1 ? (filters.page - 1) * take : 0;

    return this.prisma.homework.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const homework = await this.prisma.homework.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!homework) {
      throw new NotFoundException('Homework not found');
    }

    return homework.id;
  }

  async findOne(publicId: string, requester: HomeworkRequester) {
    const id = await this.resolvePublicId(publicId);
    const homework = await this.prisma.homework.findFirst({
      where: { id, deletedAt: null },
    });

    if (!homework) {
      throw new NotFoundException('Homework not found');
    }

    const allowed = await this.canAccessHomework(homework, requester);
    if (!allowed) {
      throw new ForbiddenException('Access denied to this homework');
    }

    return homework;
  }

  async update(
    publicId: string,
    actorId: string,
    updateHomeworkDto: UpdateHomeworkDto,
    requester: HomeworkRequester,
  ) {
    const id = await this.resolvePublicId(publicId);
    const homework = await this.prisma.homework.findFirst({
      where: { id, deletedAt: null },
    });

    if (!homework) {
      throw new NotFoundException('Homework not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId || homework.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this homework');
      }
      const teacher = await this.getTeacherForRequester(requester);
      if (teacher && homework.teacherId !== teacher.id) {
        throw new ForbiddenException('Can only update homework assigned to you');
      }
    }

    await this.validateRelatedEntities(homework.schoolId, {
      classId: updateHomeworkDto.classId,
      sectionId: updateHomeworkDto.sectionId,
      subjectId: updateHomeworkDto.subjectId,
      teacherId: updateHomeworkDto.teacherId,
      academicYearId: updateHomeworkDto.academicYearId,
    });

    const data: any = { ...updateHomeworkDto };
    delete data.schoolId;

    if (data.dueDate) {
      data.dueDate = new Date(data.dueDate);
    }

    if (requester.role === 'TEACHER') {
      const teacher = await this.getTeacherForRequester(requester);
      if (teacher && data.teacherId && data.teacherId !== teacher.id) {
        throw new ForbiddenException('Cannot reassign homework to another teacher');
      }
    }

    const updated = await this.prisma.homework.update({
      where: { id },
      data,
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Homework',
      resourceId: updated.id,
      oldValues: homework,
      newValues: updated,
      actorId,
      schoolId: homework.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: HomeworkRequester) {
    const id = await this.resolvePublicId(publicId);
    const homework = await this.prisma.homework.findFirst({
      where: { id, deletedAt: null },
    });

    if (!homework) {
      throw new NotFoundException('Homework not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId || homework.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this homework');
      }
      const teacher = await this.getTeacherForRequester(requester);
      if (teacher && homework.teacherId !== teacher.id) {
        throw new ForbiddenException('Can only delete homework assigned to you');
      }
    }

    const removed = await this.prisma.homework.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Homework',
      resourceId: removed.id,
      oldValues: homework,
      newValues: { deletedAt: removed.deletedAt },
      actorId,
      schoolId: homework.schoolId,
    });

    return removed;
  }

  private async canAccessHomework(entity: any, requester: HomeworkRequester): Promise<boolean> {
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
