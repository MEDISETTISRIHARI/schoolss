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
import { AwardsService } from './awards.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { UpdateAwardDto } from './dto/update-award.dto';
import { AwardFiltersDto } from './dto/award-filters.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

const buildRequester = (user: RequestUser) => ({
  role: user.role,
  schoolId: user.schoolId,
  id: user.sub,
});

@Controller('awards')
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Get()
  @RequirePermissions('awards.view.own')
  findAll(@CurrentUser() user: RequestUser, @Query() filters: AwardFiltersDto) {
    return this.awardsService.findAll(buildRequester(user), filters);
  }

  @Post()
  @RequirePermissions('awards.workflow')
  create(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Body() createAwardDto: CreateAwardDto,
  ) {
    return this.awardsService.create(actorId, createAwardDto, { role: user.role, schoolId: user.schoolId });
  }

  @Get(':publicId')
  @RequirePermissions('awards.view.own')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.awardsService.findOne(publicId, buildRequester(user));
  }

  @Patch(':publicId')
  @RequirePermissions('awards.workflow')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateAwardDto: UpdateAwardDto,
  ) {
    return this.awardsService.update(publicId, actorId, updateAwardDto, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId/approve')
  @RequirePermissions('awards.approve')
  approve(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.awardsService.approve(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }

  @Delete(':publicId')
  @RequirePermissions('awards.workflow')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.awardsService.remove(publicId, actorId, { role: user.role, schoolId: user.schoolId });
  }
}
