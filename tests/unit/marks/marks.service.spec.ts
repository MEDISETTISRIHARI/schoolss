import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MarksService } from '../../../backend/src/marks/marks.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('MarksService', () => {
  let service: MarksService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockSuperAdminRequester = { role: 'SUPER_ADMIN' as UserRole };
  const mockSchoolAdminRequester = { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarksService,
        {
          provide: PrismaService,
          useValue: {
            examination: { findFirst: jest.fn() },
            subject: { findFirst: jest.fn() },
            student: { findFirst: jest.fn() },
            teacher: { findFirst: jest.fn() },
            mark: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AuditLogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(MarksService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all marks for SUPER_ADMIN', async () => {
      const mockMarks = [{ id: 'mark-1', marksObtained: 85 }];
      prisma.mark.findMany.mockResolvedValue(mockMarks as any);

      const result = await service.findAll(mockSuperAdminRequester, {});

      expect(result).toEqual(mockMarks);
    });

    it('should throw ForbiddenException if schoolId is missing for non-SUPER_ADMIN', async () => {
      await expect(service.findAll({ role: 'SCHOOL_ADMIN' }, {})).rejects.toThrow('School context required');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if mark not found', async () => {
      prisma.mark.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockSuperAdminRequester)).rejects.toThrow('Mark not found');
    });
  });
});
