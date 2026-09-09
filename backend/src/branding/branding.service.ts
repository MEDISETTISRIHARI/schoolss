import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { UserRole } from '@prisma/client';
import { BrandingResponseDto } from './dto/branding-response.dto';

@Injectable()
export class BrandingService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private async resolvePublicId(publicId: string): Promise<string> {
    const school = await this.prisma.school.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return school.id;
  }

  async getBranding(publicId: string, requester: { role: UserRole; schoolId?: string }): Promise<BrandingResponseDto> {
    const id = await this.resolvePublicId(publicId);
    const school = await this.prisma.school.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        publicId: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && school.id !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this school');
    }

    return {
      publicId: school.publicId,
      name: school.name,
      logoUrl: school.logoUrl,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
    };
  }

  async updateBranding(
    publicId: string,
    actorId: string,
    updateBrandingDto: UpdateBrandingDto,
    requester: { role: UserRole; schoolId?: string },
  ): Promise<BrandingResponseDto> {
    const id = await this.resolvePublicId(publicId);
    const school = await this.prisma.school.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        publicId: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && school.id !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this school');
    }

    const oldValues = {
      logoUrl: school.logoUrl,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
    };

    const updated = await this.prisma.school.update({
      where: { id },
      data: updateBrandingDto,
      select: {
        id: true,
        publicId: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'SchoolBranding',
      resourceId: updated.id,
      oldValues,
      newValues: {
        logoUrl: updated.logoUrl,
        primaryColor: updated.primaryColor,
        secondaryColor: updated.secondaryColor,
      },
      actorId,
      schoolId: updated.id,
    });

    return {
      publicId: updated.publicId,
      name: updated.name,
      logoUrl: updated.logoUrl,
      primaryColor: updated.primaryColor,
      secondaryColor: updated.secondaryColor,
    };
  }
}
