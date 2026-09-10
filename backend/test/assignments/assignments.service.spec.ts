import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { AssignmentsService, AssignmentRequester } from '../../src/assignments/assignments.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuditLogService } from '../../src/audit/audit.service';
import { UserRole } from '@school-management/shared-types';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let prismaService: any;

  const mockClass = {
    id: 'class-1',
    publicId: 'class-public-1',
    schoolId: 'school-1',
    name: 'Class 10',
    displayName: '10th Grade',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockSubject = {
    id: 'subject-1',
    publicId: 'subject-public-1',
    schoolId: 'school-1',
    name: 'Math',
    code: 'MTH101',
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockAcademicYear = {
    id: 'year-1',
    publicId: 'year-public-1',
    schoolId: 'school-1',
    name: '2024-2025',
    startDate: new Date(),
    endDate: new Date(),
    isActive: true,
    isCurrent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTeacher = {
    id: 'teacher-1',
    publicId: 'teacher-public-1',
    userId: 'user-1',
    employeeId: 'EMP001',
    dateOfBirth: new Date(),
    gender: 'Male',
    bloodGroup: null,
    address: null,
    qualification: null,
    experience: 5,
    joiningDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockAssignment = {
    id: 'assignment-1',
    publicId: 'assignment-public-1',
    schoolId: 'school-1',
    teacherId: 'teacher-1',
    classId: 'class-1',
    sectionId: null,
    subjectId: 'subject-1',
    academicYearId: 'year-1',
    isClassTeacher: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: PrismaService,
          useValue: {
            class: {
              findFirst: jest.fn(),
            },
            section: {
              findFirst: jest.fn(),
            },
            subject: {
              findFirst: jest.fn(),
            },
            teacher: {
              findFirst: jest.fn(),
            },
            academicYear: {
              findFirst: jest.fn(),
            },
            student: {
              findFirst: jest.fn(),
            },
            enrollment: {
              findMany: jest.fn(),
            },
            teacherAssignment: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        { provide: AuditLogService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a teacher assignment for SUPER_ADMIN', async () => {
      prismaService.class.findFirst.mockResolvedValue(mockClass);
      prismaService.subject.findFirst.mockResolvedValue(mockSubject);
      prismaService.academicYear.findFirst.mockResolvedValue(mockAcademicYear);
      prismaService.teacherAssignment.create.mockResolvedValue(mockAssignment);

      const result = await service.create('actor-1', {
        classId: 'class-1',
        subjectId: 'subject-1',
        academicYearId: 'year-1',
      }, {
        role: 'SUPER_ADMIN' as UserRole,
        schoolId: 'school-1',
        id: 'user-1',
      });

      expect(prismaService.teacherAssignment.create).toHaveBeenCalledWith({
        data: {
          schoolId: 'school-1',
          teacherId: undefined,
          classId: 'class-1',
          sectionId: null,
          subjectId: 'subject-1',
          academicYearId: 'year-1',
          isClassTeacher: false,
        },
      });
      expect(result).toEqual(mockAssignment);
    });

    it('should throw NotFoundException when class is not found', async () => {
      prismaService.class.findFirst.mockResolvedValue(null);

      await expect(service.create('actor-1', {
        classId: 'class-999',
        subjectId: 'subject-1',
        academicYearId: 'year-1',
      }, {
        role: 'SCHOOL_ADMIN' as UserRole,
        schoolId: 'school-1',
      })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate assignment', async () => {
      prismaService.class.findFirst.mockResolvedValue(mockClass);
      prismaService.subject.findFirst.mockResolvedValue(mockSubject);
      prismaService.academicYear.findFirst.mockResolvedValue(mockAcademicYear);
      prismaService.teacherAssignment.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create('actor-1', {
        classId: 'class-1',
        subjectId: 'subject-1',
        academicYearId: 'year-1',
      }, {
        role: 'SUPER_ADMIN' as UserRole,
        schoolId: 'school-1',
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all assignments for SUPER_ADMIN', async () => {
      prismaService.teacherAssignment.findMany.mockResolvedValue([mockAssignment]);

      const result = await service.findAll(
        { role: 'SUPER_ADMIN' as UserRole } as AssignmentRequester,
        { classId: 'class-1', academicYearId: 'year-1' },
      );

      expect(prismaService.teacherAssignment.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          classId: 'class-1',
          academicYearId: 'year-1',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockAssignment]);
    });

    it('should return only own school assignments for school-scoped user', async () => {
      prismaService.teacherAssignment.findMany.mockResolvedValue([mockAssignment]);

      const result = await service.findAll(
        { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' } as AssignmentRequester,
        {},
      );

      expect(prismaService.teacherAssignment.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          schoolId: 'school-1',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockAssignment]);
    });
  });

  describe('findOne', () => {
    it('should return assignment when found and authorized', async () => {
      prismaService.teacherAssignment.findFirst.mockResolvedValue(mockAssignment);

      const result = await service.findOne('assignment-1', {
        role: 'SUPER_ADMIN' as UserRole,
        schoolId: 'school-1',
      });

      expect(result).toEqual(mockAssignment);
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      prismaService.teacherAssignment.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('assignment-999', {
          role: 'SCHOOL_ADMIN' as UserRole,
          schoolId: 'school-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when accessing another school assignment', async () => {
      prismaService.teacherAssignment.findFirst.mockResolvedValue({
        ...mockAssignment,
        schoolId: 'school-2',
      });

      await expect(
        service.findOne('assignment-1', {
          role: 'SCHOOL_ADMIN' as UserRole,
          schoolId: 'school-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update assignment when authorized', async () => {
      const updatedAssignment = { ...mockAssignment, isClassTeacher: true };
      prismaService.teacherAssignment.findFirst.mockResolvedValue(mockAssignment);
      prismaService.teacherAssignment.update.mockResolvedValue(updatedAssignment);

      const result = await service.update(
        'assignment-1',
        'actor-1',
        { isClassTeacher: true },
        { role: 'SUPER_ADMIN' as UserRole, schoolId: 'school-1' },
      );

      expect(prismaService.teacherAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assignment-1' },
        data: { isClassTeacher: true },
      });
      expect(result).toEqual(updatedAssignment);
    });
  });

  describe('remove', () => {
    it('should soft delete assignment with audit log', async () => {
      const softDeleted = {
        ...mockAssignment,
        deletedAt: new Date(),
      };
      prismaService.teacherAssignment.findFirst.mockResolvedValue(mockAssignment);
      prismaService.teacherAssignment.update.mockResolvedValue(softDeleted);

      const result = await service.remove(
        'assignment-1',
        'actor-1',
        { role: 'SUPER_ADMIN' as UserRole, schoolId: 'school-1' },
      );

      expect(prismaService.teacherAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assignment-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).not.toBeNull();
    });
  });
});
