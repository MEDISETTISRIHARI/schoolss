import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TeachersService } from '../../../backend/src/teachers/teachers.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('TeachersService', () => {
  let service: TeachersService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockSuperAdminRequester = { role: 'SUPER_ADMIN' as UserRole };
  const mockSchoolAdminRequester = { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        {
          provide: PrismaService,
          useValue: {
            user: { findFirst: jest.fn() },
            teacher: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AuditLogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(TeachersService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all teachers for SUPER_ADMIN', async () => {
      const mockTeachers = [{ id: 'teacher-1', employeeId: 'EMP001' }];
      prisma.teacher.findMany.mockResolvedValue(mockTeachers as any);

      const result = await service.findAll(mockSuperAdminRequester);

      expect(result).toEqual(mockTeachers);
    });

    it('should return school-scoped teachers for non-SUPER_ADMIN', async () => {
      const mockTeachers = [{ id: 'teacher-1', employeeId: 'EMP001' }];
      prisma.teacher.findMany.mockResolvedValue(mockTeachers as any);

      const result = await service.findAll(mockSchoolAdminRequester);

      expect(result).toEqual(mockTeachers);
      expect(prisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: { schoolId: 'school-1' },
            deletedAt: null,
          }),
        }),
      );
    });

    it('should throw ForbiddenException if schoolId is missing for non-SUPER_ADMIN', async () => {
      await expect(service.findAll({ role: 'SCHOOL_ADMIN' })).rejects.toThrow('School context required');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if teacher not found', async () => {
      prisma.teacher.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockSuperAdminRequester)).rejects.toThrow('Teacher not found');
    });
  });
});
