import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SubjectsService } from '../../../backend/src/subjects/subjects.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('SubjectsService', () => {
  let service: SubjectsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockSuperAdminRequester = { role: 'SUPER_ADMIN' as UserRole };
  const mockSchoolAdminRequester = { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        {
          provide: PrismaService,
          useValue: {
            subject: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AuditLogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SubjectsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all subjects for SUPER_ADMIN', async () => {
      const mockSubjects = [{ id: 'subject-1', name: 'Mathematics' }];
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await service.findAll(mockSuperAdminRequester);

      expect(result).toEqual(mockSubjects);
    });

    it('should return school-scoped subjects for non-SUPER_ADMIN', async () => {
      const mockSubjects = [{ id: 'subject-1', name: 'Mathematics' }];
      prisma.subject.findMany.mockResolvedValue(mockSubjects as any);

      const result = await service.findAll(mockSchoolAdminRequester);

      expect(result).toEqual(mockSubjects);
      expect(prisma.subject.findMany).toHaveBeenCalledWith(
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
    it('should throw NotFoundException if subject not found', async () => {
      prisma.subject.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockSuperAdminRequester)).rejects.toThrow('Subject not found');
    });
  });
});
