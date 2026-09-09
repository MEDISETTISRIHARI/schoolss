import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClassesService } from '../../../backend/src/classes/classes.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('ClassesService', () => {
  let service: ClassesService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockSuperAdminRequester = { role: 'SUPER_ADMIN' as UserRole };
  const mockSchoolAdminRequester = { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: PrismaService,
          useValue: {
            academicYear: { findFirst: jest.fn() },
            class: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: AuditLogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ClassesService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all classes for SUPER_ADMIN', async () => {
      const mockClasses = [{ id: 'class-1', name: '10A' }];
      prisma.class.findMany.mockResolvedValue(mockClasses as any);

      const result = await service.findAll(mockSuperAdminRequester);

      expect(result).toEqual(mockClasses);
      expect(prisma.class.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: { school: true, academicYear: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return school-scoped classes for non-SUPER_ADMIN', async () => {
      const mockClasses = [{ id: 'class-1', name: '10A' }];
      prisma.class.findMany.mockResolvedValue(mockClasses as any);

      const result = await service.findAll(mockSchoolAdminRequester);

      expect(result).toEqual(mockClasses);
      expect(prisma.class.findMany).toHaveBeenCalledWith({
        where: { schoolId: 'school-1', deletedAt: null },
        include: { school: true, academicYear: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw ForbiddenException if schoolId is missing for non-SUPER_ADMIN', async () => {
      await expect(service.findAll({ role: 'SCHOOL_ADMIN' })).rejects.toThrow('School context required');
    });
  });

  describe('findOne', () => {
    it('should return a class for SUPER_ADMIN', async () => {
      const mockClass = { id: 'class-1', name: '10A', schoolId: 'school-1' };
      prisma.class.findFirst.mockResolvedValue(mockClass as any);

      const result = await service.findOne('class-1', mockSuperAdminRequester);

      expect(result).toEqual(mockClass);
    });

    it('should throw NotFoundException if class not found', async () => {
      prisma.class.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockSuperAdminRequester)).rejects.toThrow('Class not found');
    });

    it('should throw ForbiddenException if accessing another school', async () => {
      const mockClass = { id: 'class-1', name: '10A', schoolId: 'school-2' };
      prisma.class.findFirst.mockResolvedValue(mockClass as any);

      await expect(service.findOne('class-1', mockSchoolAdminRequester)).rejects.toThrow('Access denied to this class');
    });
  });

  describe('remove', () => {
    it('should soft-delete a class', async () => {
      const mockClass = { id: 'class-1', name: '10A', schoolId: 'school-1' };
      prisma.class.findFirst.mockResolvedValue(mockClass as any);
      prisma.class.update.mockResolvedValue({ ...mockClass, deletedAt: new Date() } as any);

      const result = await service.remove('class-1', 'actor-1', mockSuperAdminRequester);

      expect(prisma.class.update).toHaveBeenCalledWith({
        where: { id: 'class-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toHaveProperty('message');
    });

    it('should throw NotFoundException if class not found', async () => {
      prisma.class.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'actor-1', mockSuperAdminRequester)).rejects.toThrow('Class not found');
    });
  });
});
