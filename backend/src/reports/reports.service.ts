/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { StudentReportDto } from './dto/student-report.dto';
import { ClassReportDto } from './dto/class-report.dto';
import { UserRole } from '@school-management/shared-types';

export interface Requester {
  role: UserRole;
  schoolId?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attended: number;
  attendanceRate: number;
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private getTargetSchoolId(requester: Requester): string {
    if (requester.role === 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new BadRequestException('School assignment is required');
      }
      return requester.schoolId;
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    return requester.schoolId;
  }

  private computeAttendanceSummary(attendances: { status: string }[]): AttendanceSummary {
    const counts = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };
    for (const a of attendances) {
      if (a.status in counts) {
        counts[a.status as keyof typeof counts]++;
      }
    }
    const total = attendances.length;
    const attended = counts.PRESENT + counts.EXCUSED;
    const attendanceRate = total > 0 ? (attended / total) * 100 : 0;
    return {
      total,
      present: counts.PRESENT,
      absent: counts.ABSENT,
      late: counts.LATE,
      excused: counts.EXCUSED,
      attended,
      attendanceRate,
    };
  }

  async getStudentReport(
    actorId: string,
    studentReportDto: StudentReportDto,
    requester: Requester,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentReportDto.studentId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
            schoolId: true,
          },
        },
        enrollments: {
          where: { deletedAt: null },
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            academicYear: { select: { id: true, name: true, isCurrent: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      if (student.user?.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this student');
      }
    }

    const schoolId = student.user?.schoolId ?? requester.schoolId;
    if (!schoolId) {
      throw new ForbiddenException('School context required');
    }

    const [attendances, marks, results, awards] = await Promise.all([
      this.prisma.attendance.findMany({
        where: {
          schoolId,
          studentId: studentReportDto.studentId,
          deletedAt: null,
          ...(studentReportDto.academicYearId
            ? { academicYearId: studentReportDto.academicYearId }
            : {}),
        },
        select: { status: true, date: true },
      }),
      this.prisma.mark.findMany({
        where: {
          schoolId,
          studentId: studentReportDto.studentId,
          deletedAt: null,
          ...(studentReportDto.academicYearId
            ? { examination: { academicYearId: studentReportDto.academicYearId } }
            : {}),
        },
        include: {
          subject: { select: { id: true, name: true } },
          examination: {
            select: { id: true, name: true, type: true, totalMarks: true, date: true },
          },
        },
      }),
      this.prisma.result.findMany({
        where: {
          schoolId,
          deletedAt: null,
          studentId: studentReportDto.studentId,
          ...(studentReportDto.academicYearId
            ? { academicYearId: studentReportDto.academicYearId }
            : {}),
        },
        include: {
          examination: {
            select: { id: true, name: true, type: true, totalMarks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.award.findMany({
        where: {
          schoolId,
          studentId: studentReportDto.studentId,
          deletedAt: null,
        },
        orderBy: { awardedDate: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          awardedDate: true,
          status: true,
        },
      }),
    ]);

    const attendanceSummary = this.computeAttendanceSummary(attendances);

    const subjectAgg: Record<string, any> = {};
    for (const m of marks) {
      const key = m.subjectId;
      if (!subjectAgg[key]) {
        subjectAgg[key] = {
          subjectId: m.subjectId,
          subjectName: m.subject?.name ?? null,
          examinations: [],
          totalObtained: 0,
          totalMax: 0,
        };
      }
      subjectAgg[key].examinations.push({
        examinationId: m.examinationId,
        examinationName: m.examination?.name ?? null,
        examinationType: m.examination?.type ?? null,
        marksObtained: Number(m.marksObtained),
        maxMarks: m.examination ? Number(m.examination.totalMarks) : null,
      });
      subjectAgg[key].totalObtained += Number(m.marksObtained);
      if (m.examination) {
        subjectAgg[key].totalMax += Number(m.examination.totalMarks);
      }
    }

    const perSubject = Object.values(subjectAgg).map((s: any) => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      examinations: s.examinations,
      totalObtained: s.totalObtained,
      totalMax: s.totalMax,
      averagePercentage: s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0,
    }));

    const marksTotalObtained = marks.reduce(
      (sum, m) => sum + Number(m.marksObtained),
      0,
    );
    const marksTotalMax = marks.reduce(
      (sum, m) => sum + (m.examination ? Number(m.examination.totalMarks) : 0),
      0,
    );

    const marksSummary = {
      perSubject,
      overall: {
        totalObtained: marksTotalObtained,
        totalMax: marksTotalMax,
        averagePercentage:
          marksTotalMax > 0 ? (marksTotalObtained / marksTotalMax) * 100 : 0,
        entryCount: marks.length,
      },
    };

    await this.auditLogService.create({
      action: 'VIEW',
      resourceType: 'StudentReport',
      resourceId: student.id,
      actorId,
      schoolId,
    });

    return {
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.user?.firstName,
        lastName: student.user?.lastName,
        email: student.user?.email,
        phone: student.user?.phone,
        profileImageUrl: student.user?.profileImageUrl,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        address: student.address,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail,
        guardianRelation: student.guardianRelation,
        enrollmentDate: student.enrollmentDate,
      },
      enrollments: student.enrollments.map((e) => ({
        id: e.id,
        classId: e.classId,
        className: e.class?.name ?? null,
        sectionId: e.sectionId,
        sectionName: e.section?.name ?? null,
        academicYearId: e.academicYearId,
        academicYearName: e.academicYear?.name ?? null,
        isCurrentYear: e.academicYear?.isCurrent ?? null,
        rollNumber: e.rollNumber,
      })),
      attendanceSummary,
      marksSummary,
      results: results.map((r) => ({
        id: r.id,
        examinationId: r.examinationId,
        examinationName: r.examination?.name ?? null,
        examinationType: r.examination?.type ?? null,
        totalMarks: Number(r.totalMarks),
        obtainedMarks: Number(r.obtainedMarks),
        percentage: Number(r.percentage),
        grade: r.grade,
        gpa: r.gpa,
        cgpa: r.cgpa,
        status: r.status,
        publishedAt: r.publishedAt,
        finalizedAt: r.finalizedAt,
      })),
      awards: awards.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        awardedDate: a.awardedDate,
        status: a.status,
      })),
      summary: {
        totalResults: results.length,
        totalMarksObtained: results.reduce(
          (sum, r) => sum + Number(r.obtainedMarks),
          0,
        ),
        totalMarks: results.reduce(
          (sum, r) => sum + Number(r.totalMarks),
          0,
        ),
        averagePercentage:
          results.length > 0
            ? results.reduce(
                (sum, r) => sum + Number(r.percentage),
                0,
              ) / results.length
            : 0,
        totalAwards: awards.length,
      },
    };
  }

  async getClassReport(
    actorId: string,
    classReportDto: ClassReportDto,
    requester: Requester,
  ) {
    const classRecord = await this.prisma.class.findFirst({
      where: { id: classReportDto.classId, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true, isCurrent: true } },
      },
    });

    if (!classRecord) {
      throw new NotFoundException('Class not found');
    }

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }
      if (classRecord.schoolId !== requester.schoolId) {
        throw new ForbiddenException('Access denied to this class');
      }
    }

    const schoolId = classRecord.schoolId;

    const enrollmentWhere: any = {
      schoolId,
      deletedAt: null,
      classId: classReportDto.classId,
    };
    if (classReportDto.sectionId) {
      enrollmentWhere.sectionId = classReportDto.sectionId;
    }
    if (classReportDto.academicYearId) {
      enrollmentWhere.academicYearId = classReportDto.academicYearId;
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        section: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const studentIds = enrollments.map((e) => e.studentId);

    const [attendances, marks, results] = await Promise.all([
      this.prisma.attendance.findMany({
        where: {
          schoolId,
          classId: classRecord.id,
          deletedAt: null,
          ...(classReportDto.sectionId ? { sectionId: classReportDto.sectionId } : {}),
          ...(classReportDto.academicYearId
            ? { academicYearId: classReportDto.academicYearId }
            : {}),
        },
        select: { status: true, studentId: true },
      }),
      this.prisma.mark.findMany({
        where: {
          schoolId,
          deletedAt: null,
          ...(studentIds.length > 0 ? { studentId: { in: studentIds } } : {}),
          ...(classReportDto.examinationId
            ? { examinationId: classReportDto.examinationId }
            : {}),
          ...(classReportDto.subjectId
            ? { subjectId: classReportDto.subjectId }
            : {}),
        },
        include: {
          subject: { select: { id: true, name: true } },
          examination: {
            select: { id: true, name: true, type: true, totalMarks: true },
          },
        },
      }),
      this.prisma.result.findMany({
        where: {
          schoolId,
          deletedAt: null,
          classId: classRecord.id,
          ...(classReportDto.sectionId ? { sectionId: classReportDto.sectionId } : {}),
          ...(classReportDto.academicYearId
            ? { academicYearId: classReportDto.academicYearId }
            : {}),
          ...(classReportDto.examinationId
            ? { examinationId: classReportDto.examinationId }
            : {}),
        },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          examination: {
            select: { id: true, name: true, type: true, totalMarks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const attendanceSummary = this.computeAttendanceSummary(attendances);

    const subjectAgg: Record<string, any> = {};
    for (const m of marks) {
      const subKey = m.subjectId;
      if (!subjectAgg[subKey]) {
        subjectAgg[subKey] = {
          subjectId: m.subjectId,
          subjectName: m.subject?.name ?? null,
          totalObtained: 0,
          totalMax: 0,
          count: 0,
        };
      }
      subjectAgg[subKey].totalObtained += Number(m.marksObtained);
      if (m.examination) {
        subjectAgg[subKey].totalMax += Number(m.examination.totalMarks);
      }
      subjectAgg[subKey].count += 1;
    }

    const marksSummary = {
      perSubject: Object.values(subjectAgg).map((s: any) => ({
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        totalObtained: s.totalObtained,
        totalMax: s.totalMax,
        entryCount: s.count,
        averageObtained: s.count > 0 ? s.totalObtained / s.count : 0,
        averagePercentage:
          s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0,
      })),
      overall: {
        totalObtained: marks.reduce((sum, m) => sum + Number(m.marksObtained), 0),
        totalMax: marks.reduce(
          (sum, m) => sum + (m.examination ? Number(m.examination.totalMarks) : 0),
          0,
        ),
        entryCount: marks.length,
      },
    };

    const passingThreshold = 40;
    const passed = results.filter(
      (r) => Number(r.percentage) >= passingThreshold,
    ).length;

    await this.auditLogService.create({
      action: 'VIEW',
      resourceType: 'ClassReport',
      resourceId: classRecord.id,
      actorId,
      schoolId,
    });

    return {
      classInfo: {
        id: classRecord.id,
        name: classRecord.name,
        academicYear: classRecord.academicYear,
        school: classRecord.school,
      },
      enrollmentCount: enrollments.length,
      students: enrollments.map((e) => ({
        studentId: e.studentId,
        name: `${e.student?.user?.firstName ?? ''} ${e.student?.user?.lastName ?? ''}`.trim(),
        sectionId: e.sectionId,
        sectionName: e.section?.name ?? null,
        rollNumber: e.rollNumber,
        academicYearId: e.academicYearId,
        academicYearName: e.academicYear?.name ?? null,
      })),
      attendanceSummary,
      marksSummary,
      results: results.map((r) => ({
        studentId: r.studentId,
        studentName: `${r.student?.user?.firstName ?? ''} ${r.student?.user?.lastName ?? ''}`.trim(),
        examinationId: r.examinationId,
        examinationName: r.examination?.name ?? null,
        examinationType: r.examination?.type ?? null,
        totalMarks: Number(r.totalMarks),
        obtainedMarks: Number(r.obtainedMarks),
        percentage: Number(r.percentage),
        grade: r.grade,
        status: r.status,
      })),
      summary: {
        totalStudents: enrollments.length,
        totalResults: results.length,
        totalMarksObtained: results.reduce(
          (sum, r) => sum + Number(r.obtainedMarks),
          0,
        ),
        totalMarks: results.reduce(
          (sum, r) => sum + Number(r.totalMarks),
          0,
        ),
        averagePercentage:
          results.length > 0
            ? results.reduce(
                (sum, r) => sum + Number(r.percentage),
                0,
              ) / results.length
            : 0,
        passRate:
          results.length > 0 ? (passed / results.length) * 100 : 0,
      },
    };
  }

  async getSchoolAcademicOverview(actorId: string, requester: Requester) {
    const schoolId = this.getTargetSchoolId(requester);

    const school = await this.prisma.school.findFirst({
      where: { id: schoolId, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const [
      studentCount,
      teacherCount,
      classCount,
      attendanceCount,
      resultCount,
      examinationCount,
      publishedResultCount,
    ] = await Promise.all([
      this.prisma.student.count({
        where: {
          user: { schoolId, deletedAt: null },
          deletedAt: null,
        },
      }),
      this.prisma.teacher.count({
        where: {
          user: { schoolId, deletedAt: null },
          deletedAt: null,
        },
      }),
      this.prisma.class.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.attendance.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.result.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.examination.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.result.count({
        where: {
          schoolId,
          deletedAt: null,
          status: { in: ['PUBLISHED', 'FINALIZED'] },
        },
      }),
    ]);

    await this.auditLogService.create({
      action: 'VIEW',
      resourceType: 'SchoolAcademicOverview',
      resourceId: schoolId,
      actorId,
      schoolId,
    });

    return {
      school,
      overview: {
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
        attendances: attendanceCount,
        results: resultCount,
        examinations: examinationCount,
        publishedResults: publishedResultCount,
      },
    };
  }
}
