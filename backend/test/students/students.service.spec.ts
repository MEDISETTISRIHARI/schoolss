import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StudentsService } from '../../src/students/students.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuditLogService } from '../../src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('StudentsService', () => {
  let service: StudentsService;
  let prismaService: any;

  const mockStudent = {
    id: 'student-1',
    userId: 'user-1',
    admissionNumber: 'STU001',
    dateOfBirth: new Date('2010-01-01'),
    gender: 'FEMALE',
    bloodGroup: 'O+',
    address: '123 Main St',
    guardianName: 'Parent Name',
    guardianPhone: '1234567890',
    guardianEmail: 'parent@example.com',
    guardianRelation: 'Mother',
    enrollmentDate: new Date('2024-04-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-1',
      email: 'student@example.com',
      firstName: 'Bob',
      lastName: 'Student',
      role: 'STUDENT',
      schoolId: 'school-1',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: PrismaService,
          useValue: {
            student: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findFirst: jest.fn(),
            },
          },
        },
        { provide: AuditLogService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a student when user belongs to the same school', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        schoolId: 'school-1',
      });
      prismaService.student.create.mockResolvedValue(mockStudent);

      const result = await service.create(
        'actor-1',
        {
          userId: 'user-1',
          admissionNumber: 'STU001',
          dateOfBirth: '2010-01-01',
          gender: 'FEMALE',
          bloodGroup: 'O+',
          address: '123 Main St',
          guardianName: 'Parent Name',
          guardianPhone: '1234567890',
          guardianEmail: 'parent@example.com',
          guardianRelation: 'Mother',
          enrollmentDate: '2024-04-01',
        },
        { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' },
      );

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', deletedAt: null },
      });
      expect(prismaService.student.create).toHaveBeenCalled();
      expect(result).toEqual(mockStudent);
    });

    it('should throw NotFoundException when user is not found', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          'actor-1',
          {
            userId: 'non-existent',
            admissionNumber: 'STU001',
            dateOfBirth: '2010-01-01',
            gender: 'FEMALE',
          },
          { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow SUPER_ADMIN to create student for any user', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        schoolId: 'school-2',
      });
      prismaService.student.create.mockResolvedValue(mockStudent);

      const result = await service.create(
        'actor-1',
        {
          userId: 'user-1',
          admissionNumber: 'STU001',
          dateOfBirth: '2010-01-01',
          gender: 'FEMALE',
        },
        { role: 'SUPER_ADMIN' as UserRole },
      );

      expect(result).toEqual(mockStudent);
    });

    it('should throw ForbiddenException when school admin tries to create student for another school', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        schoolId: 'school-2',
      });

      await expect(
        service.create(
          'actor-1',
          {
            userId: 'user-1',
            admissionNumber: 'STU001',
            dateOfBirth: '2010-01-01',
            gender: 'FEMALE',
          },
          { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all students for SUPER_ADMIN', async () => {
      prismaService.student.findMany.mockResolvedValue([mockStudent]);

      const result = await service.findAll({ role: 'SUPER_ADMIN' as UserRole });

      expect(prismaService.student.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockStudent]);
    });

    it('should return only school students for regular users', async () => {
      prismaService.student.findMany.mockResolvedValue([mockStudent]);

      const result = await service.findAll({ role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' });

      expect(prismaService.student.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          user: { schoolId: 'school-1' },
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockStudent]);
    });

    it('should throw ForbiddenException when school ID is missing for non-super-admin', async () => {
      await expect(service.findAll({ role: 'TEACHER' as UserRole })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return student when found and accessible', async () => {
      prismaService.student.findFirst.mockResolvedValue(mockStudent);

      const result = await service.findOne('student-1', { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' });

      expect(result).toEqual(mockStudent);
    });

    it('should throw NotFoundException when student does not exist', async () => {
      prismaService.student.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when accessing student from another school', async () => {
      const otherStudent = {
        ...mockStudent,
        user: { ...mockStudent.user, schoolId: 'school-2' },
      };
      prismaService.student.findFirst.mockResolvedValue(otherStudent);

      await expect(
        service.findOne('student-1', { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to access any student', async () => {
      const otherStudent = {
        ...mockStudent,
        user: { ...mockStudent.user, schoolId: 'school-2' },
      };
      prismaService.student.findFirst.mockResolvedValue(otherStudent);

      const result = await service.findOne('student-1', { role: 'SUPER_ADMIN' as UserRole });

      expect(result).toEqual(otherStudent);
    });
  });

  describe('update', () => {
    it('should update student when authorized', async () => {
      const updatedStudent = { ...mockStudent, address: '456 New St' };
      prismaService.student.findFirst.mockResolvedValue(mockStudent);
      prismaService.student.update.mockResolvedValue(updatedStudent);

      const result = await service.update(
        'student-1',
        'actor-1',
        { address: '456 New St' },
        { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' },
      );

      expect(prismaService.student.update).toHaveBeenCalled();
      expect(result).toEqual(updatedStudent);
    });

    it('should throw NotFoundException when student does not exist', async () => {
      prismaService.student.findFirst.mockResolvedValue(null);

      await expect(
        service.update(
          'non-existent',
          'actor-1',
          { address: '456 New St' },
          { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when updating student from another school', async () => {
      const otherStudent = {
        ...mockStudent,
        user: { ...mockStudent.user, schoolId: 'school-2' },
      };
      prismaService.student.findFirst.mockResolvedValue(otherStudent);

      await expect(
        service.update(
          'student-1',
          'actor-1',
          { address: '456 New St' },
          { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft delete student when authorized', async () => {
      prismaService.student.findFirst.mockResolvedValue(mockStudent);
      prismaService.student.update.mockResolvedValue({ ...mockStudent, deletedAt: new Date() });

      const result = await service.remove('student-1', 'actor-1', {
        role: 'SCHOOL_ADMIN' as UserRole,
        schoolId: 'school-1',
      });

      expect(prismaService.student.update).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ id: 'student-1' });
    });

    it('should throw NotFoundException when student does not exist', async () => {
      prismaService.student.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('non-existent', 'actor-1', {
          role: 'SCHOOL_ADMIN' as UserRole,
          schoolId: 'school-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deleting student from another school', async () => {
      const otherStudent = {
        ...mockStudent,
        user: { ...mockStudent.user, schoolId: 'school-2' },
      };
      prismaService.student.findFirst.mockResolvedValue(otherStudent);

      await expect(
        service.remove('student-1', 'actor-1', {
          role: 'SCHOOL_ADMIN' as UserRole,
          schoolId: 'school-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
