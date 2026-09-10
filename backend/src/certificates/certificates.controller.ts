import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@school-management/shared-types';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @RequirePermissions('certificates.manage')
  create(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Body() createCertificateDto: CreateCertificateDto,
  ) {
    return this.certificatesService.create(user.sub, createCertificateDto, {
      role: user.role,
      schoolId: user.schoolId,
    });
  }

  @Get()
  @RequirePermissions('certificates.view')
  findAll(@CurrentUser() user: RequestUser) {
    return this.certificatesService.findAll({ role: user.role, schoolId: user.schoolId });
  }

  @Get(':publicId')
  @RequirePermissions('certificates.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.certificatesService.findOne(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Get(':publicId/download')
  @RequirePermissions('certificates.view')
  download(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.certificatesService.download(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId')
  @RequirePermissions('certificates.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateCertificateDto: UpdateCertificateDto,
  ) {
    return this.certificatesService.update(publicId, actorId, updateCertificateDto, {
      role: user.role,
      schoolId: user.schoolId,
    });
  }

  @Delete(':publicId')
  @RequirePermissions('certificates.manage')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.certificatesService.remove(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }
}
