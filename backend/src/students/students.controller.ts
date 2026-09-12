import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateStudentWithUserDto } from './dto/create-student-with-user.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@school-management/shared-types';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @RequirePermissions('students.manage')
  create(@CurrentUser() user: RequestUser, @Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(user.sub, createStudentDto, { role: user.role, schoolId: user.schoolId });
  }

  @Post('with-user')
  @RequirePermissions('students.manage')
  createWithUser(@CurrentUser() user: RequestUser, @Body() createStudentWithUserDto: CreateStudentWithUserDto) {
    return this.studentsService.createWithUser(user.sub, createStudentWithUserDto, { role: user.role, schoolId: user.schoolId });
  }

  @Get()
  @RequirePermissions('students.view.assigned')
  findAll(@CurrentUser() user: RequestUser) {
    return this.studentsService.findAll({ role: user.role, schoolId: user.schoolId });
  }

  @Get(':publicId')
  @RequirePermissions('students.view.assigned')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.studentsService.findOne(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId')
  @RequirePermissions('students.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(publicId, actorId, updateStudentDto, { role: user.role, schoolId: user.schoolId });
  }

  @Delete(':publicId')
  @RequirePermissions('students.manage')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.studentsService.remove(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }
}
