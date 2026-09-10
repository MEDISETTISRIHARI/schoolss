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
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { QueryResultDto } from './dto/query-result.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@school-management/shared-types';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @RequirePermissions('results.prepare')
  create(@CurrentUser() user: RequestUser, @CurrentUserId() actorId: string, @Body() createResultDto: CreateResultDto) {
    return this.resultsService.create(actorId, createResultDto, { role: user.role, schoolId: user.schoolId });
  }

  @Get()
  @RequirePermissions('results.view')
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryResultDto) {
    return this.resultsService.findAll({ role: user.role, schoolId: user.schoolId }, query);
  }

  @Get('my')
  @RequirePermissions('results.view.own')
  findMy(@CurrentUser() user: RequestUser, @CurrentUserId() actorId: string) {
    return this.resultsService.findMy(actorId, { role: user.role, schoolId: user.schoolId });
  }

  @Get(':publicId')
  @RequirePermissions('results.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.resultsService.findOne(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId/approve')
  @RequirePermissions('results.approve')
  approve(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.resultsService.approve(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId')
  @RequirePermissions('results.prepare')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateResultDto: UpdateResultDto,
  ) {
    return this.resultsService.update(publicId, actorId, updateResultDto, { role: user.role, schoolId: user.schoolId });
  }

  @Delete(':publicId')
  @RequirePermissions('results.prepare')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.resultsService.remove(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }
}
