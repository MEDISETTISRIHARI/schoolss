import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { StudentReportDto } from './dto/student-report.dto';
import { ClassReportDto } from './dto/class-report.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserId } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

interface RequestUser {
  sub: string;
  role: UserRole;
  schoolId?: string;
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('student')
  @RequirePermissions('reports.view')
  getStudentReport(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Query() studentReportDto: StudentReportDto,
  ) {
    return this.reportsService.getStudentReport(actorId, studentReportDto, {
      role: user.role,
      schoolId: user.schoolId,
    });
  }

  @Get('class')
  @RequirePermissions('reports.view')
  getClassReport(
    @CurrentUserId() actorId: string,
    @CurrentUser() user: RequestUser,
    @Query() classReportDto: ClassReportDto,
  ) {
    return this.reportsService.getClassReport(actorId, classReportDto, {
      role: user.role,
      schoolId: user.schoolId,
    });
  }

  @Get('overview')
  @RequirePermissions('reports.view')
  getSchoolAcademicOverview(@CurrentUser() user: RequestUser) {
    return this.reportsService.getSchoolAcademicOverview({
      role: user.role,
      schoolId: user.schoolId,
    });
  }
}
