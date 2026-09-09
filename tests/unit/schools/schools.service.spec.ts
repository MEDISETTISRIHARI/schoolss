import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsService } from '../../../backend/src/schools/schools.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('SchoolsService', () => {
  let service: SchoolsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        {
          provide: PrismaService,
          useValue: {
            school: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SchoolsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a school', async () => {
      const mockSchool = { id: 'school-1', name: 'Test School', isActive: true };
      prisma.school.create.mockResolvedValue(mockSchool as any);

      const result = await service.create('user-1', { name: 'Test School' });

      expect(result).toEqual(mockSchool);
      expect(prisma.school.create).toHaveBeenCalledWith({
        data: { name: 'Test School', isActive: true },
      });
    });
  });

  describe('findAll', () => {
    it('should return all schools for SUPER_ADMIN', async () => {
      const mockSchools = [{ id: 'school-1', name: 'School 1' }];
      prisma.school.findMany.mockResolvedValue(mockSchools as any);

      const result = await service.findAll({ role: 'SUPER_ADMIN' });

      expect(result).toEqual(mockSchools);
      expect(prisma.school.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return only own school for non-SUPER_ADMIN', async () => {
      const mockSchools = [{ id: 'school-1', name: 'School 1' }];
      prisma.school.findMany.mockResolvedValue(mockSchools as any);

      const result = await service.findAll({ role: 'SCHOOL_ADMIN', schoolId: 'school-1' });

      expect(result).toEqual(mockSchools);
      expect(prisma.school.findMany).toHaveBeenCalledWith({
        where: { id: 'school-1', deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw ForbiddenException if schoolId is missing for non-SUPER_ADMIN', async () => {
      await expect(service.findAll({ role: 'SCHOOL_ADMIN' })).rejects.toThrow('School context required');
    });
  });

  describe('findOne', () => {
    it('should return a school for SUPER_ADMIN', async () => {
      const mockSchool = { id: 'school-1', name: 'School 1' };
      prisma.school.findFirst.mockResolvedValue(mockSchool as any);

      const result = await service.findOne('school-1', { role: 'SUPER_ADMIN' });

      expect(result).toEqual(mockSchool);
    });

    it('should throw NotFoundException if school not found', async () => {
      prisma.school.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', { role: 'SUPER_ADMIN' })).rejects.toThrow('School not found');
    });

    it('should throw ForbiddenException if accessing another school', async () => {
      const mockSchool = { id: 'school-1', name: 'School 1' };
      prisma.school.findFirst.mockResolvedValue(mockSchool as any);

      await expect(service.findOne('school-1', { role: 'SCHOOL_ADMIN', schoolId: 'school-2' })).rejects.toThrow('Access denied to this school');
    });
  });
});
