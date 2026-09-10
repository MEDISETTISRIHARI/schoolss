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
import { HomeworkService, HomeworkRequester } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { QueryHomeworkDto } from './dto/query-homework.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@school-management/shared-types';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('homework')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  @RequirePermissions('homework.manage.assigned')
  create(
    @CurrentUser() user: RequestUser,
    @CurrentUserId() actorId: string,
    @Body() createHomeworkDto: CreateHomeworkDto,
  ) {
    const requester: HomeworkRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.homeworkService.create(actorId, createHomeworkDto, requester);
  }

  @Get()
  @RequirePermissions('homework.view.own')
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryHomeworkDto) {
    const requester: HomeworkRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.homeworkService.findAll(requester, query);
  }

  @Get(':publicId')
  @RequirePermissions('homework.view.own')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    const requester: HomeworkRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.homeworkService.findOne(publicId, requester);
  }

  @Patch(':publicId')
  @RequirePermissions('homework.manage.assigned')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateHomeworkDto: UpdateHomeworkDto,
  ) {
    const requester: HomeworkRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.homeworkService.update(publicId, actorId, updateHomeworkDto, requester);
  }

  @Delete(':publicId')
  @RequirePermissions('homework.manage.assigned')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    const requester: HomeworkRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.homeworkService.remove(publicId, actorId, requester);
  }
}
