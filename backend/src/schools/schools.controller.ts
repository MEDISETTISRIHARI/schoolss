import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { RequireConfirmation } from '../common/decorators/confirmation.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@school-management/shared-types';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @RequirePermissions('school.manage')
  create(@CurrentUser() user: RequestUser, @Body() createSchoolDto: CreateSchoolDto) {
    return this.schoolsService.create(user.sub, createSchoolDto);
  }

  @Get()
  @RequirePermissions('school.view')
  findAll(@CurrentUser() user: RequestUser) {
    return this.schoolsService.findAll({ role: user.role, schoolId: user.schoolId });
  }

  @Get(':publicId')
  @RequirePermissions('school.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.schoolsService.findOne(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId')
  @RequirePermissions('school.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
  ) {
    return this.schoolsService.update(publicId, actorId, updateSchoolDto, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId/activate')
  @RequirePermissions('school.manage')
  activate(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.schoolsService.activate(publicId, actorId, { role: user.role });
  }

  @Patch(':publicId/deactivate')
  @RequirePermissions('school.manage')
  @RequireConfirmation()
  deactivate(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.schoolsService.deactivate(publicId, actorId, { role: user.role });
  }
}
