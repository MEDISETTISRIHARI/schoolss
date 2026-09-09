import { Test, TestingModule } from '@nestjs/testing';
import { CertificatesService } from '../../src/certificates/certificates.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuditLogService } from '../../src/audit/audit.service';
import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let prismaService: any;
  let auditLogService: any;

  const mockAuditor = {
    id: 'audit-1',
    email: 'admin@school.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.SCHOOL_ADMIN,
    schoolId: 'school-1',
  };

  const mockAward = {
    id: 'award-1',
    schoolId: 'school-1',
    student: { id: 'student-1', userId: 'user-1', user: mockAuditor },
  };

  const mockStudent = {
    id: 'student-1',
    userId: 'user-1',
    user: { id: 'user-1', schoolId: 'school-1' },
  };

  const mockCertificate = {
    id: 'cert-1',
    schoolId: 'school-1',
    awardId: 'award-1',
    studentId: 'student-1',
    certificateNumber: 'CERT-001',
    fileUrl: 'https://example.com/cert.pdf',
    issuedBy: 'user-1',
    issuedAt: new Date(),
    school: { id: 'school-1', name: 'Test School' },
    student: { user: { firstName: 'Test', lastName: 'User', email: 'test@example.com' } },
    award: { id: 'award-1', title: 'Best Student', type: 'ACADEMIC' },
  };

  beforeEach(async () => {
    const mockPrisma: any = {
      award: {
        findFirst: jest.fn().mockResolvedValue(mockAward),
      },
      student: {
        findFirst: jest.fn().mockResolvedValue(mockStudent),
      },
      certificate: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue(mockCertificate),
        findMany: jest.fn().mockResolvedValue([mockCertificate]),
        findFirst: jest.fn().mockResolvedValue(mockCertificate),
        update: jest.fn().mockResolvedValue(mockCertificate),
      },
    };

    const mockAudit = { create: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    prismaService = module.get(PrismaService);
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create certificate successfully', async () => {
      prismaService.certificate.findUnique.mockResolvedValue(null);
      prismaService.certificate.create.mockResolvedValue(mockCertificate);

      const result = await service.create('user-1', {
        awardId: 'award-1',
        studentId: 'student-1',
        certificateNumber: 'CERT-001',
        fileUrl: 'https://example.com/cert.pdf',
      }, { role: UserRole.SCHOOL_ADMIN, schoolId: 'school-1' });

      expect(prismaService.award.findFirst).toHaveBeenCalled();
      expect(prismaService.student.findFirst).toHaveBeenCalled();
      expect(prismaService.certificate.create).toHaveBeenCalled();
      expect(auditLogService.create).toHaveBeenCalled();
      expect(result).toEqual(mockCertificate);
    });

    it('should throw NotFoundException when award not found', async () => {
      prismaService.award.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          awardId: 'nonexistent',
          studentId: 'student-1',
          certificateNumber: 'CERT-001',
        }, { role: UserRole.SCHOOL_ADMIN, schoolId: 'school-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when student not found', async () => {
      prismaService.student.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          awardId: 'award-1',
          studentId: 'nonexistent',
          certificateNumber: 'CERT-001',
        }, { role: UserRole.SCHOOL_ADMIN, schoolId: 'school-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when certificate number exists', async () => {
      prismaService.certificate.findUnique.mockResolvedValue(mockCertificate);

      await expect(
        service.create('user-1', {
          awardId: 'award-1',
          studentId: 'student-1',
          certificateNumber: 'CERT-001',
        }, { role: UserRole.SCHOOL_ADMIN, schoolId: 'school-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when school context missing', async () => {
      await expect(
        service.create('user-1', {
          awardId: 'award-1',
          studentId: 'student-1',
          certificateNumber: 'CERT-001',
        }, { role: UserRole.TEACHER }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all certificates for SUPER_ADMIN', async () => {
      const result = await service.findAll({ role: UserRole.SUPER_ADMIN });
      expect(prismaService.certificate.findMany).toHaveBeenCalled();
      expect(result).toEqual([mockCertificate]);
    });

    it('should return school certificates for SCHOOL_ADMIN', async () => {
      const result = await service.findAll({ role: UserRole.SCHOOL_ADMIN, schoolId: 'school-1' });
      expect(prismaService.certificate.findMany).toHaveBeenCalledWith({
        where: { schoolId: 'school-1', deletedAt: null },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockCertificate]);
    });

    it('should throw ForbiddenException for non-SUPER_ADMIN without schoolId', async () => {
      await expect(
        service.findAll({ role: UserRole.SCHOOL_ADMIN }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return certificate by id for authorized user', async () => {
      const result = await service.findOne('cert-1', { role: UserRole.SCHOOL_ADMIN, schoolId: 'school-1' });
      expect(result).toEqual(mockCertificate);
    });

    it('should throw NotFoundException when certificate not found', async () => {
      prismaService.certificate.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', { role: UserRole.SCHOOL_ADMIN, schoolId: 'school-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      await expect(
        service.findOne('cert-1', { role: UserRole.SCHOOL_ADMIN, schoolId: 'different-school' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft delete certificate successfully', async () => {
      const result = await service.remove('cert-1', 'user-1', { role: UserRole.SCHOOL_ADMIN, schoolId: 'school-1' });
      expect(prismaService.certificate.update).toHaveBeenCalledWith({
        where: { id: 'cert-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Certificate deleted successfully' });
    });

    it('should throw NotFoundException when certificate not found', async () => {
      prismaService.certificate.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent', 'user-1', { role: UserRole.SCHOOL_ADMIN, schoolId: 'school-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('download', () => {
    it('should return certificate with download URL', async () => {
      const result = await service.download('cert-1', { role: UserRole.SCHOOL_ADMIN, schoolId: 'school-1' });
      expect(result).toHaveProperty('downloadUrl');
    });

    it('should throw BadRequestException when fileUrl is missing', async () => {
      prismaService.certificate.findFirst.mockResolvedValue({ ...mockCertificate, fileUrl: null });

      await expect(
        service.download('cert-1', { role: UserRole.TEACHER, schoolId: 'school-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
