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
import { AssignmentsService, AssignmentRequester } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AssignmentFiltersDto } from './dto/assignment-filters.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @RequirePermissions('assignment.manage')
  create(
    @CurrentUser() user: RequestUser,
    @CurrentUserId() actorId: string,
    @Body() createAssignmentDto: CreateAssignmentDto,
  ) {
    const requester: AssignmentRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.assignmentsService.create(actorId, createAssignmentDto, requester);
  }

  @Get()
  @RequirePermissions('assignment.view')
  findAll(@CurrentUser() user: RequestUser, @Query() query: AssignmentFiltersDto) {
    const requester: AssignmentRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.assignmentsService.findAll(requester, query);
  }

  @Get(':id')
  @RequirePermissions('assignment.view')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const requester: AssignmentRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.assignmentsService.findOne(id, requester);
  }

  @Patch(':id')
  @RequirePermissions('assignment.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    const requester: AssignmentRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.assignmentsService.update(id, actorId, updateAssignmentDto, requester);
  }

  @Delete(':id')
  @RequirePermissions('assignment.manage')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    const requester: AssignmentRequester = {
      role: user.role,
      schoolId: user.schoolId,
      id: user.sub,
    };
    return this.assignmentsService.remove(id, actorId, requester);
  }
}
