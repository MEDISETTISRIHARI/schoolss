import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AcademicYearsService } from '../../../backend/src/academic-years/academic-years.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('AcademicYearsService', () => {
  let service: AcademicYearsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockSuperAdminRequester = { role: 'SUPER_ADMIN' as UserRole };
  const mockSchoolAdminRequester = { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicYearsService,
        {
          provide: PrismaService,
          useValue: {
            academicYear: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AuditLogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AcademicYearsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all academic years for SUPER_ADMIN', async () => {
      const mockYears = [{ id: 'year-1', name: '2024-2025' }];
      prisma.academicYear.findMany.mockResolvedValue(mockYears as any);

      const result = await service.findAll(mockSuperAdminRequester);

      expect(result).toEqual(mockYears);
    });

    it('should return school-scoped academic years for non-SUPER_ADMIN', async () => {
      const mockYears = [{ id: 'year-1', name: '2024-2025' }];
      prisma.academicYear.findMany.mockResolvedValue(mockYears as any);

      const result = await service.findAll(mockSchoolAdminRequester);

      expect(result).toEqual(mockYears);
      expect(prisma.academicYear.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: 'school-1',
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
    it('should throw NotFoundException if academic year not found', async () => {
      prisma.academicYear.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockSuperAdminRequester)).rejects.toThrow('Academic year not found');
    });
  });

  describe('create', () => {
    it('should throw ForbiddenException if schoolId is missing for non-SUPER_ADMIN', async () => {
      await expect(
        service.create('actor-1', { name: '2024-2025', startDate: '2024-01-01', endDate: '2025-12-31' }, { role: 'SCHOOL_ADMIN' }),
      ).rejects.toThrow('School context required');
    });
  });
});
