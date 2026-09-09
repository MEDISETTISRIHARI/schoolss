import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExaminationsService } from '../../../backend/src/examinations/examinations.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('ExaminationsService', () => {
  let service: ExaminationsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockSuperAdminRequester = { role: 'SUPER_ADMIN' as UserRole };
  const mockSchoolAdminRequester = { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExaminationsService,
        {
          provide: PrismaService,
          useValue: {
            academicYear: { findFirst: jest.fn() },
            class: { findFirst: jest.fn() },
            section: { findFirst: jest.fn() },
            subject: { findFirst: jest.fn() },
            examination: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AuditLogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ExaminationsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all examinations for SUPER_ADMIN', async () => {
      const mockExams = [{ id: 'exam-1', name: 'Midterm' }];
      prisma.examination.findMany.mockResolvedValue(mockExams as any);

      const result = await service.findAll(mockSuperAdminRequester, {});

      expect(result).toEqual(mockExams);
    });

    it('should throw ForbiddenException if schoolId is missing for non-SUPER_ADMIN', async () => {
      await expect(service.findAll({ role: 'SCHOOL_ADMIN' }, {})).rejects.toThrow('School context required');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if examination not found', async () => {
      prisma.examination.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockSuperAdminRequester)).rejects.toThrow('Examination not found');
    });
  });
});
