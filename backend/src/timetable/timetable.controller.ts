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
import { TimetableService, TimetableRequester } from './timetable.service';
import { CreateTimetableEntryDto } from './dto/create-timetable-entry.dto';
import { UpdateTimetableEntryDto } from './dto/update-timetable-entry.dto';
import { QueryTimetableDto } from './dto/query-timetable.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@school-management/shared-types';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  @RequirePermissions('timetable.manage')
  create(
    @CurrentUser() user: RequestUser,
    @CurrentUserId() actorId: string,
    @Body() createTimetableEntryDto: CreateTimetableEntryDto,
  ) {
    const requester: TimetableRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.timetableService.create(actorId, createTimetableEntryDto, requester);
  }

  @Get()
  @RequirePermissions('timetable.view.own')
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryTimetableDto) {
    const requester: TimetableRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.timetableService.findAll(requester, query);
  }

  @Get(':publicId')
  @RequirePermissions('timetable.view.own')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    const requester: TimetableRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.timetableService.findOne(publicId, requester);
  }

  @Patch(':publicId')
  @RequirePermissions('timetable.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateTimetableEntryDto: UpdateTimetableEntryDto,
  ) {
    const requester: TimetableRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.timetableService.update(publicId, actorId, updateTimetableEntryDto, requester);
  }

  @Delete(':publicId')
  @RequirePermissions('timetable.manage')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    const requester: TimetableRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.timetableService.remove(publicId, actorId, requester);
  }
}
