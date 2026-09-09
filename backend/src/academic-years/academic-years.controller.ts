import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  @RequirePermissions('academic-years.manage')
  create(@CurrentUser() user: RequestUser, @Body() createAcademicYearDto: CreateAcademicYearDto) {
    return this.academicYearsService.create(user.sub, createAcademicYearDto, { role: user.role, schoolId: user.schoolId });
  }

  @Get()
  @RequirePermissions('academic-years.view')
  findAll(@CurrentUser() user: RequestUser) {
    return this.academicYearsService.findAll({ role: user.role, schoolId: user.schoolId });
  }

  @Get(':publicId')
  @RequirePermissions('academic-years.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.academicYearsService.findOne(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId')
  @RequirePermissions('academic-years.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateAcademicYearDto: UpdateAcademicYearDto,
  ) {
    return this.academicYearsService.update(publicId, actorId, updateAcademicYearDto, { role: user.role, schoolId: user.schoolId });
  }

  @Delete(':publicId')
  @RequirePermissions('academic-years.manage')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.academicYearsService.remove(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }
}
