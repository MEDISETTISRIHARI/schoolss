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
import { ExaminationsService } from './examinations.service';
import { CreateExaminationDto } from './dto/create-examination.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';
import { QueryExaminationDto } from './dto/query-examination.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('examinations')
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  @Post()
  @RequirePermissions('examinations.manage')
  create(@CurrentUser() user: RequestUser, @CurrentUserId() actorId: string, @Body() createExaminationDto: CreateExaminationDto) {
    return this.examinationsService.create(actorId, createExaminationDto, { role: user.role, schoolId: user.schoolId });
  }

  @Get()
  @RequirePermissions('examinations.view')
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryExaminationDto) {
    return this.examinationsService.findAll({ role: user.role, schoolId: user.schoolId }, query);
  }

  @Get('my')
  @RequirePermissions('examinations.view.own')
  findMy(@CurrentUser() user: RequestUser, @CurrentUserId() actorId: string) {
    return this.examinationsService.findMy(actorId, { role: user.role, schoolId: user.schoolId });
  }

  @Get(':publicId')
  @RequirePermissions('examinations.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.examinationsService.findOne(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId/publish')
  @RequirePermissions('examinations.assigned')
  publish(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.examinationsService.publish(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId')
  @RequirePermissions('examinations.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateExaminationDto: UpdateExaminationDto,
  ) {
    return this.examinationsService.update(publicId, actorId, updateExaminationDto, { role: user.role, schoolId: user.schoolId });
  }

  @Delete(':publicId')
  @RequirePermissions('examinations.manage')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.examinationsService.remove(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }
}
