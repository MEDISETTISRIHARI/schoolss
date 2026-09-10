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
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@school-management/shared-types';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @RequirePermissions('attendance.enter.assigned')
  create(@CurrentUser() user: RequestUser, @CurrentUserId() actorId: string, @Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(actorId, createAttendanceDto, { role: user.role, schoolId: user.schoolId });
  }

  @Get()
  @RequirePermissions('attendance.view')
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryAttendanceDto) {
    return this.attendanceService.findAll({ role: user.role, schoolId: user.schoolId }, query);
  }

  @Get('my')
  @RequirePermissions('attendance.view.own')
  findMy(@CurrentUser() user: RequestUser, @CurrentUserId() actorId: string) {
    return this.attendanceService.findMy(actorId, { role: user.role, schoolId: user.schoolId });
  }

  @Get(':publicId')
  @RequirePermissions('attendance.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.attendanceService.findOne(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId')
  @RequirePermissions('attendance.enter.assigned')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(publicId, actorId, updateAttendanceDto, { role: user.role, schoolId: user.schoolId });
  }

  @Delete(':publicId')
  @RequirePermissions('attendance.manage')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.attendanceService.remove(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }
}
