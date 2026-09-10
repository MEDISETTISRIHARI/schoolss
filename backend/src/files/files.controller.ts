import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileFiltersDto } from './dto/file-filters.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@school-management/shared-types';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @RequirePermissions('files.upload')
  create(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() createFileDto: CreateFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.filesService.create(
      user.sub,
      createFileDto,
      file.buffer,
      file.originalname,
      file.mimetype,
      { role: user.role, schoolId: user.schoolId },
    );
  }

  @Get()
  @RequirePermissions('files.view')
  findAll(
    @CurrentUser() user: RequestUser,
    @Query() filters: FileFiltersDto,
  ) {
    return this.filesService.findAll(
      { role: user.role, schoolId: user.schoolId },
      filters,
    );
  }

  @Get(':publicId')
  @RequirePermissions('files.view')
  findOne(@CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.filesService.findOne(
      publicId,
      { role: user.role, schoolId: user.schoolId },
    );
  }

  @Patch(':publicId')
  @RequirePermissions('files.manage')
  update(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Param('publicId') publicId: string,
    @Body() updateFileDto: UpdateFileDto,
  ) {
    return this.filesService.update(
      publicId,
      actorId,
      updateFileDto,
      { role: user.role, schoolId: user.schoolId },
    );
  }

  @Delete(':publicId')
  @RequirePermissions('files.manage')
  remove(@CurrentUserId() actorId: string, @CurrentUser() user: RequestUser, @Param('publicId') publicId: string) {
    return this.filesService.remove(
      publicId,
      actorId,
      { role: user.role, schoolId: user.schoolId },
    );
  }
}
