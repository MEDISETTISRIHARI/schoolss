import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { BrandingService } from './branding.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get(':publicId')
  @RequirePermissions('school.view')
  getBranding(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.brandingService.getBranding(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId')
  @RequirePermissions('school.manage')
  updateBranding(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateBrandingDto: UpdateBrandingDto,
  ) {
    return this.brandingService.updateBranding(publicId, actorId, updateBrandingDto, {
      role: user.role,
      schoolId: user.schoolId,
    });
  }
}
