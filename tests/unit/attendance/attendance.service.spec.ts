import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from '../../../backend/src/attendance/attendance.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { AttendanceStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: {
            attendance: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            student: {
              findUnique: jest.fn(),
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

    service = module.get(AttendanceService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const baseDto = {
    studentId: 'student-1',
    classId: 'class-1',
    teacherId: 'teacher-1',
    academicYearId: 'ay-1',
    date: '2024-04-01T00:00:00.000Z',
    status: AttendanceStatus.PRESENT,
  };

  describe('create', () => {
    it('should scope to the requester school and audit log the creation', async () => {
      const mockAttendance = { id: 'att-1', ...baseDto, schoolId: 'school-1', isFinalized: false };
      prisma.attendance.create.mockResolvedValue(mockAttendance as any);

      const result = await service.create('actor-1', { ...baseDto }, { role: 'SCHOOL_ADMIN', schoolId: 'school-1' });

      expect(result).toEqual(mockAttendance);
      expect(prisma.attendance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ schoolId: 'school-1' }),
        }),
      );
      expect(auditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', resourceType: 'Attendance', schoolId: 'school-1' }),
      );
    });

    it('should use the dto schoolId for SUPER_ADMIN', async () => {
      const mockAttendance = { id: 'att-1', ...baseDto, schoolId: 'school-2', isFinalized: false };
      prisma.attendance.create.mockResolvedValue(mockAttendance as any);

      await service.create('actor-1', { ...baseDto, schoolId: 'school-2' }, { role: 'SUPER_ADMIN' });

      expect(prisma.attendance.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ schoolId: 'school-2' }) }),
      );
    });

    it('should throw ForbiddenException when a non-SUPER_ADMIN has no school context', async () => {
      await expect(service.create('actor-1', { ...baseDto }, { role: 'SCHOOL_ADMIN' })).rejects.toThrow(ForbiddenException);
    });

    it('should reject a client-supplied schoolId that does not match the requester school', async () => {
      await expect(
        service.create('actor-1', { ...baseDto, schoolId: 'school-2' }, { role: 'SCHOOL_ADMIN', schoolId: 'school-1' }),
      ).rejects.toThrow('Cannot assign record to another school');
    });

    it('should throw ConflictException when a duplicate record is created', async () => {
      prisma.attendance.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create('actor-1', { ...baseDto }, { role: 'SCHOOL_ADMIN', schoolId: 'school-1' })).rejects.toThrow(
        'Attendance record already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should scope results to the requester school for non-SUPER_ADMIN', async () => {
      prisma.attendance.findMany.mockResolvedValue([] as any);

      await service.findAll({ role: 'PRINCIPAL', schoolId: 'school-1' }, {});

      expect(prisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ schoolId: 'school-1', deletedAt: null }) }),
      );
    });

    it('should allow SUPER_ADMIN to query across schools via filters', async () => {
      prisma.attendance.findMany.mockResolvedValue([] as any);

      await service.findAll({ role: 'SUPER_ADMIN' }, { schoolId: 'school-2' });

      expect(prisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ schoolId: 'school-2' }) }),
      );
    });
  });

  describe('findOne', () => {
    it('should return the record for the requester school', async () => {
      const mockAttendance = { id: 'att-1', schoolId: 'school-1' };
      prisma.attendance.findFirst.mockResolvedValue(mockAttendance as any);

      const result = await service.findOne('att-1', { role: 'PRINCIPAL', schoolId: 'school-1' });

      expect(result).toEqual(mockAttendance);
      expect(prisma.attendance.findFirst).toHaveBeenCalledWith({ where: { id: 'att-1', schoolId: 'school-1', deletedAt: null } });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.attendance.findFirst.mockResolvedValue(null);

      await expect(service.findOne('att-1', { role: 'PRINCIPAL', schoolId: 'school-1' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMy', () => {
    it('should throw ForbiddenException for a non-student user', async () => {
      prisma.student.findUnique.mockResolvedValue(null);

      await expect(service.findMy('actor-1', { role: 'TEACHER', schoolId: 'school-1' })).rejects.toThrow(ForbiddenException);
    });

    it('should return attendance scoped to the resolved student', async () => {
      prisma.student.findUnique.mockResolvedValue({ id: 'student-1' } as any);
      prisma.attendance.findMany.mockResolvedValue([{ id: 'att-1' }] as any);

      const result = await service.findMy('user-1', { role: 'STUDENT', schoolId: 'school-1' });

      expect(prisma.student.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { schoolId: 'school-1', studentId: 'student-1', deletedAt: null } }),
      );
      expect(result).toEqual([{ id: 'att-1' }]);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when record does not exist', async () => {
      prisma.attendance.findFirst.mockResolvedValue(null);

      await expect(service.update('att-1', 'actor-1', { status: AttendanceStatus.ABSENT }, { role: 'SCHOOL_ADMIN', schoolId: 'school-1' })).rejects.toThrow(NotFoundException);
    });

    it('should update and audit the change', async () => {
      const existing = { id: 'att-1', schoolId: 'school-1', status: AttendanceStatus.PRESENT };
      const updated = { id: 'att-1', schoolId: 'school-1', status: AttendanceStatus.ABSENT };
      prisma.attendance.findFirst.mockResolvedValue(existing as any);
      prisma.attendance.update.mockResolvedValue(updated as any);

      const result = await service.update('att-1', 'actor-1', { status: AttendanceStatus.ABSENT }, { role: 'SCHOOL_ADMIN', schoolId: 'school-1' });

      expect(prisma.attendance.update).toHaveBeenCalledWith({ where: { id: 'att-1' }, data: { status: AttendanceStatus.ABSENT } });
      expect(auditLogService.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', resourceType: 'Attendance' }));
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should soft delete and audit the deletion', async () => {
      const existing = { id: 'att-1', schoolId: 'school-1', status: AttendanceStatus.PRESENT };
      const removed = { id: 'att-1', schoolId: 'school-1', deletedAt: new Date() };
      prisma.attendance.findFirst.mockResolvedValue(existing as any);
      prisma.attendance.update.mockResolvedValue(removed as any);

      const result = await service.remove('att-1', 'actorId', { role: 'SCHOOL_ADMIN', schoolId: 'school-1' });

      expect(prisma.attendance.update).toHaveBeenCalledWith({ where: { id: 'att-1' }, data: { deletedAt: expect.any(Date) } });
      expect(auditLogService.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE', resourceType: 'Attendance' }));
      expect(result.deletedAt).toBeDefined();
    });

    it('should throw NotFoundException when trying to remove a non-existing record', async () => {
      prisma.attendance.findFirst.mockResolvedValue(null);

      await expect(service.remove('att-1', 'actor-1', { role: 'SCHOOL_ADMIN', schoolId: 'school-1' })).rejects.toThrow(NotFoundException);
    });
  });
});
