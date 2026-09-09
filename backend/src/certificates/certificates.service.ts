import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { UserRole } from '@prisma/client';

export interface CertificatesRequester {
  role: UserRole;
  schoolId?: string;
}

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createCertificateDto: CreateCertificateDto, requester: CertificatesRequester) {
    const award = await this.prisma.award.findFirst({
      where: { id: createCertificateDto.awardId, deletedAt: null },
      include: { student: { include: { user: true } } },
    });

    if (!award) {
      throw new NotFoundException('Award not found');
    }

    const targetSchoolId =
      requester.role === 'SUPER_ADMIN' ? (createCertificateDto.schoolId ?? award.schoolId) : requester.schoolId;

    if (!targetSchoolId) {
      throw new ForbiddenException('School context required');
    }

    if (targetSchoolId !== award.schoolId) {
      throw new ForbiddenException('Access denied to this award');
    }

    if (award.schoolId !== targetSchoolId) {
      throw new ForbiddenException('Award belongs to a different school');
    }

    const student = await this.prisma.student.findFirst({
      where: { id: createCertificateDto.studentId, deletedAt: null },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.user.schoolId !== award.schoolId) {
      throw new ForbiddenException('Access denied to this student');
    }

    const existing = await this.prisma.certificate.findUnique({
      where: { certificateNumber: createCertificateDto.certificateNumber },
    });

    if (existing) {
      throw new ConflictException('Certificate with this number already exists');
    }

    const certificate = await this.prisma.certificate.create({
      data: {
        schoolId: award.schoolId,
        awardId: award.id,
        studentId: createCertificateDto.studentId,
        certificateNumber: createCertificateDto.certificateNumber,
        fileUrl: createCertificateDto.fileUrl,
        issuedBy: createCertificateDto.issuedBy ?? actorId,
        issuedAt: createCertificateDto.issuedAt ? new Date(createCertificateDto.issuedAt) : new Date(),
      },
      include: {
        school: { select: { id: true, name: true } },
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        award: { select: { id: true, title: true, type: true } },
      },
    });

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'Certificate',
      resourceId: certificate.id,
      newValues: certificate,
      actorId,
      schoolId: award.schoolId,
    });

    return certificate;
  }

  async findAll(requester: CertificatesRequester) {
    if (requester.role === 'SUPER_ADMIN') {
      return this.prisma.certificate.findMany({
        where: { deletedAt: null },
        include: {
          school: { select: { id: true, name: true } },
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          award: { select: { id: true, title: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    return this.prisma.certificate.findMany({
      where: { schoolId: requester.schoolId, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        award: { select: { id: true, title: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const certificate = await this.prisma.certificate.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return certificate.id;
  }

  async findOne(publicId: string, requester: CertificatesRequester) {
    const id = await this.resolvePublicId(publicId);
    const certificate = await this.prisma.certificate.findFirst({
      where: { id, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        award: { select: { id: true, title: true, type: true } },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && certificate.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this certificate');
    }

    return certificate;
  }

  async update(publicId: string, actorId: string, updateCertificateDto: UpdateCertificateDto, requester: CertificatesRequester) {
    const id = await this.resolvePublicId(publicId);
    const certificate = await this.prisma.certificate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && certificate.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this certificate');
    }

    if (updateCertificateDto.certificateNumber) {
      const existing = await this.prisma.certificate.findUnique({
        where: { certificateNumber: updateCertificateDto.certificateNumber },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Certificate with this number already exists');
      }
    }

    const oldCertificate = { ...certificate };

    const updated = await this.prisma.certificate.update({
      where: { id },
      data: updateCertificateDto,
      include: {
        school: { select: { id: true, name: true } },
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        award: { select: { id: true, title: true, type: true } },
      },
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'Certificate',
      resourceId: updated.id,
      oldValues: oldCertificate,
      newValues: updated,
      actorId,
      schoolId: certificate.schoolId,
    });

    return updated;
  }

  async remove(publicId: string, actorId: string, requester: CertificatesRequester) {
    const id = await this.resolvePublicId(publicId);
    const certificate = await this.prisma.certificate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && certificate.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this certificate');
    }

    await this.prisma.certificate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.create({
      action: 'DELETE',
      resourceType: 'Certificate',
      resourceId: id,
      oldValues: certificate,
      newValues: { deletedAt: new Date() },
      actorId,
      schoolId: certificate.schoolId,
    });

    return { message: 'Certificate deleted successfully' };
  }

  async download(publicId: string, requester: CertificatesRequester) {
    const id = await this.resolvePublicId(publicId);
    const certificate = await this.prisma.certificate.findFirst({
      where: { id, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        award: { select: { id: true, title: true, type: true } },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && certificate.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this certificate');
    }

    if (requester.role !== 'SUPER_ADMIN' && !certificate.fileUrl) {
      throw new BadRequestException('Certificate file is not available');
    }

    return {
      ...certificate,
      downloadUrl: certificate.fileUrl,
    };
  }
}
