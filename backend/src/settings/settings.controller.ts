import {
  Controller,
  Get,
  Patch,
  Body,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('settings.manage')
  getSettings(@CurrentUser() user: RequestUser) {
    return this.settingsService.getSettings({ role: user.role, schoolId: user.schoolId });
  }

  @Patch()
  @RequirePermissions('settings.manage')
  updateSettings(@CurrentUser() user: RequestUser, @Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(user.sub, updateSettingsDto, { role: user.role, schoolId: user.schoolId });
  }
}
