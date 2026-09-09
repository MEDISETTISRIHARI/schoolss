import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { RequireConfirmation } from '../common/decorators/confirmation.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('users.manage')
  create(@CurrentUser() user: RequestUser, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(user.sub, createUserDto, { role: user.role, schoolId: user.schoolId });
  }

  @Get()
  @RequirePermissions('users.view')
  findAll(@CurrentUser() user: RequestUser) {
    return this.usersService.findAll({ role: user.role, schoolId: user.schoolId });
  }

  @Get('me')
  getMe(@CurrentUserId() userId: string) {
    return this.usersService.getMe(userId);
  }

  @Get(':publicId')
  @RequirePermissions('users.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.usersService.findOne(publicId, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId')
  @RequirePermissions('users.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(publicId, actorId, updateUserDto, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId/role')
  @RequirePermissions('users.manage')
  @RequireConfirmation()
  changeRole(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ) {
    return this.usersService.changeRole(publicId, actorId, changeRoleDto, { role: user.role, schoolId: user.schoolId });
  }

  @Patch(':publicId/status')
  @RequirePermissions('users.manage')
  @RequireConfirmation()
  changeStatus(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() changeStatusDto: ChangeStatusDto,
  ) {
    return this.usersService.changeStatus(publicId, actorId, changeStatusDto, { role: user.role, schoolId: user.schoolId });
  }
}
