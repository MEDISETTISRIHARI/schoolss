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
import { MarksService } from './marks.service';
import { CreateMarkDto } from './dto/create-mark.dto';
import { UpdateMarkDto } from './dto/update-mark.dto';
import { QueryMarkDto } from './dto/query-mark.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@school-management/shared-types';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('marks')
export class MarksController {
  constructor(private readonly marksService: MarksService) {}

  @Post()
  @RequirePermissions('marks.enter.assigned')
  create(@CurrentUser() user: RequestUser, @CurrentUserId() actorId: string, @Body() createMarkDto: CreateMarkDto) {
    return this.marksService.create(actorId, createMarkDto, { role: user.role, schoolId: user.schoolId });
  }

  @Get()
  @RequirePermissions('marks.view')
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryMarkDto) {
    return this.marksService.findAll({ role: user.role, schoolId: user.schoolId }, query);
  }

  @Get('my')
  @RequirePermissions('marks.view.own')
  findMy(@CurrentUser() user: RequestUser, @CurrentUserId() actorId: string) {
    return this.marksService.findMy(actorId, { role: user.role, schoolId: user.schoolId });
  }

  @Get(':publicId')
  @RequirePermissions('marks.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.marksService.findOne(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId')
  @RequirePermissions('marks.enter.assigned')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateMarkDto: UpdateMarkDto,
  ) {
    return this.marksService.update(publicId, actorId, updateMarkDto, { role: user.role, schoolId: user.schoolId });
  }

  @Delete(':publicId')
  @RequirePermissions('marks.prepare')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.marksService.remove(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }
}
