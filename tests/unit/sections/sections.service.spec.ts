import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SectionsService } from '../../../backend/src/sections/sections.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('SectionsService', () => {
  let service: SectionsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockSuperAdminRequester = { role: 'SUPER_ADMIN' as UserRole };
  const mockSchoolAdminRequester = { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionsService,
        {
          provide: PrismaService,
          useValue: {
            academicYear: { findFirst: jest.fn() },
            section: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AuditLogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SectionsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all sections for SUPER_ADMIN', async () => {
      const mockSections = [{ id: 'section-1', name: 'A' }];
      prisma.section.findMany.mockResolvedValue(mockSections as any);

      const result = await service.findAll(mockSuperAdminRequester);

      expect(result).toEqual(mockSections);
    });

    it('should return school-scoped sections for non-SUPER_ADMIN', async () => {
      const mockSections = [{ id: 'section-1', name: 'A' }];
      prisma.section.findMany.mockResolvedValue(mockSections as any);

      const result = await service.findAll(mockSchoolAdminRequester);

      expect(result).toEqual(mockSections);
      expect(prisma.section.findMany).toHaveBeenCalledWith(
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
    it('should throw NotFoundException if section not found', async () => {
      prisma.section.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockSuperAdminRequester)).rejects.toThrow('Section not found');
    });
  });
});
