import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { BackupService } from './backup.service';
import { CreateBackupRecordDto } from './dto/create-backup-record.dto';
import { UpdateBackupRecordDto } from './dto/update-backup-record.dto';
import { BackupFiltersDto } from './dto/backup-filters.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  @RequirePermissions('backup.manage')
  create(
    @CurrentUser() user: RequestUser,
    @Body() createBackupRecordDto: CreateBackupRecordDto,
  ) {
    return this.backupService.create(
      user.sub,
      createBackupRecordDto,
      { role: user.role, schoolId: user.schoolId },
    );
  }

  @Get()
  @RequirePermissions('backup.view')
  findAll(
    @CurrentUser() user: RequestUser,
    @Query() filters: BackupFiltersDto,
  ) {
    return this.backupService.findAll(
      { role: user.role, schoolId: user.schoolId },
      filters,
    );
  }

  @Get(':publicId')
  @RequirePermissions('backup.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.backupService.findOne(
      publicId,
      { role: user.role, schoolId: user.schoolId },
    );
  }

  @Patch(':publicId')
  @RequirePermissions('backup.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateBackupRecordDto: UpdateBackupRecordDto,
  ) {
    return this.backupService.update(
      publicId,
      actorId,
      updateBackupRecordDto,
      { role: user.role, schoolId: user.schoolId },
    );
  }

  @Delete(':publicId')
  @RequirePermissions('backup.manage')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.backupService.remove(
      publicId,
      actorId,
      { role: user.role, schoolId: user.schoolId },
    );
  }
}
