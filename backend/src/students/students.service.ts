import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateStudentWithUserDto } from './dto/create-student-with-user.dto';
import { UserRole } from '@school-management/shared-types';
import * as bcrypt from 'bcrypt';

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

  async createWithUser(actorId: string, dto: CreateStudentWithUserDto, requester: { role: UserRole; schoolId?: string }) {
    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
    }

    const targetSchoolId = requester.role === 'SUPER_ADMIN'
      ? dto.schoolId
      : requester.schoolId;

    if (!targetSchoolId) {
      throw new BadRequestException('School assignment is required');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingAdmission = await this.prisma.student.findFirst({
      where: { admissionNumber: dto.admissionNumber, deletedAt: null },
    });

    if (existingAdmission) {
      throw new ConflictException('Student with this admission number already exists');
    }

    const cls = await this.prisma.class.findFirst({
      where: { id: dto.classId, deletedAt: null },
    });

    if (!cls) {
      throw new BadRequestException('Class not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && cls.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Cannot assign student to a class in another school');
    }

    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, classId: dto.classId, deletedAt: null },
    });

    if (!section) {
      throw new BadRequestException('Section not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && section.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Cannot assign student to a section in another school');
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, deletedAt: null },
    });

    if (!academicYear) {
      throw new BadRequestException('Academic year not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && academicYear.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Cannot assign student to an academic year in another school');
    }

    if (dto.rollNumber) {
      const existingEnrollment = await this.prisma.enrollment.findFirst({
        where: {
          classId: dto.classId,
          sectionId: dto.sectionId,
          academicYearId: dto.academicYearId,
          rollNumber: dto.rollNumber,
          deletedAt: null,
        },
      });

      if (existingEnrollment) {
        throw new ConflictException('Roll number already exists in this class and section');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: 'STUDENT',
          schoolId: targetSchoolId,
          status: 'ACTIVE',
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          admissionNumber: dto.admissionNumber,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          bloodGroup: dto.bloodGroup,
          address: dto.address,
          guardianName: dto.guardianName,
          guardianPhone: dto.guardianPhone,
          guardianEmail: dto.guardianEmail,
          guardianRelation: dto.guardianRelation,
          enrollmentDate: dto.enrollmentDate ? new Date(dto.enrollmentDate) : new Date(),
        },
      });

      const enrollment = await tx.enrollment.create({
        data: {
          schoolId: targetSchoolId,
          studentId: student.id,
          classId: dto.classId,
          sectionId: dto.sectionId,
          academicYearId: dto.academicYearId,
          rollNumber: dto.rollNumber,
        },
      });

      const createdStudent = await tx.student.findFirst({
        where: { id: student.id },
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

      return { user, student, enrollment, createdStudent: createdStudent! };
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'Student',
      resourceId: result.student.id,
      newValues: result.createdStudent,
      actorId,
      schoolId: targetSchoolId,
    });

    return this.stripUserPasswordHash(result.createdStudent);
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
