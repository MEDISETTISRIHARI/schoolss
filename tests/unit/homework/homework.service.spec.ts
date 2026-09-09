import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { HomeworkService } from '../../../backend/src/homework/homework.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('HomeworkService', () => {
  let service: HomeworkService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockSuperAdminRequester = { role: 'SUPER_ADMIN' as UserRole };
  const mockSchoolAdminRequester = { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworkService,
        {
          provide: PrismaService,
          useValue: {
            class: { findFirst: jest.fn() },
            section: { findFirst: jest.fn() },
            subject: { findFirst: jest.fn() },
            teacher: { findFirst: jest.fn() },
            academicYear: { findFirst: jest.fn() },
            homework: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AuditLogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(HomeworkService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all homework for SUPER_ADMIN', async () => {
      const mockHomework = [{ id: 'hw-1', title: 'Math Homework' }];
      prisma.homework.findMany.mockResolvedValue(mockHomework as any);

      const result = await service.findAll(mockSuperAdminRequester, {});

      expect(result).toEqual(mockHomework);
    });

    it('should throw ForbiddenException if schoolId is missing for non-SUPER_ADMIN', async () => {
      await expect(service.findAll({ role: 'SCHOOL_ADMIN' }, {})).rejects.toThrow('School context required');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if homework not found', async () => {
      prisma.homework.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockSuperAdminRequester)).rejects.toThrow('Homework not found');
    });
  });
});
