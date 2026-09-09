import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StudentsService } from '../../../backend/src/students/students.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockSuperAdminRequester = { role: 'SUPER_ADMIN' as UserRole };
  const mockSchoolAdminRequester = { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: PrismaService,
          useValue: {
            student: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AuditLogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(StudentsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all students for SUPER_ADMIN', async () => {
      const mockStudents = [{ id: 'student-1', admissionNumber: 'ADM001' }];
      prisma.student.findMany.mockResolvedValue(mockStudents as any);

      const result = await service.findAll(mockSuperAdminRequester);

      expect(result).toEqual(mockStudents);
      expect(prisma.student.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return school-scoped students for non-SUPER_ADMIN', async () => {
      const mockStudents = [{ id: 'student-1', admissionNumber: 'ADM001' }];
      prisma.student.findMany.mockResolvedValue(mockStudents as any);

      const result = await service.findAll(mockSchoolAdminRequester);

      expect(result).toEqual(mockStudents);
    });

    it('should throw ForbiddenException if schoolId is missing for non-SUPER_ADMIN', async () => {
      await expect(service.findAll({ role: 'SCHOOL_ADMIN' })).rejects.toThrow('School context required');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if student not found', async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockSuperAdminRequester)).rejects.toThrow('Student not found');
    });
  });
});
