import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AwardsService } from '../../../backend/src/awards/awards.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('AwardsService', () => {
  let service: AwardsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockSuperAdminRequester = { role: 'SUPER_ADMIN' as UserRole, schoolId: 'school-1' };
  const mockSchoolAdminRequester = { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwardsService,
        {
          provide: PrismaService,
          useValue: {
            award: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
            student: { findFirst: jest.fn() },
            teacher: { findFirst: jest.fn() },
            teacherAssignment: { findMany: jest.fn() },
            enrollment: { findMany: jest.fn() },
          },
        },
        {
          provide: AuditLogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AwardsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all awards for SUPER_ADMIN', async () => {
      const mockAwards = [{ id: 'award-1', title: 'Best Student' }];
      prisma.award.findMany.mockResolvedValue(mockAwards as any);

      const result = await service.findAll(mockSuperAdminRequester, {});

      expect(result).toEqual(mockAwards);
    });

    it('should throw ForbiddenException if schoolId is missing for non-SUPER_ADMIN', async () => {
      await expect(service.findAll({ role: 'SCHOOL_ADMIN' }, {})).rejects.toThrow('School context required');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if award not found', async () => {
      prisma.award.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockSuperAdminRequester)).rejects.toThrow('Award not found');
    });
  });
});
