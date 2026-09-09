import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchoolsModule } from './schools/schools.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { ClassesModule } from './classes/classes.module';
import { SectionsModule } from './sections/sections.module';
import { SubjectsModule } from './subjects/subjects.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ExaminationsModule } from './examinations/examinations.module';
import { MarksModule } from './marks/marks.module';
import { ResultsModule } from './results/results.module';
import { AwardsModule } from './awards/awards.module';
import { CertificatesModule } from './certificates/certificates.module';
import { HomeworkModule } from './homework/homework.module';
import { TimetableModule } from './timetable/timetable.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { FilesModule } from './files/files.module';
import { SettingsModule } from './settings/settings.module';
import { BrandingModule } from './branding/branding.module';
import { AuditModule } from './audit/audit.module';
import { BackupModule } from './backup/backup.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    SchoolsModule,
    StudentsModule,
    TeachersModule,
    AcademicYearsModule,
    ClassesModule,
    SectionsModule,
    SubjectsModule,
    AttendanceModule,
    ExaminationsModule,
    MarksModule,
    ResultsModule,
    AwardsModule,
    CertificatesModule,
    HomeworkModule,
    TimetableModule,
    AssignmentsModule,
    NotificationsModule,
    ReportsModule,
    FilesModule,
    SettingsModule,
    BrandingModule,
    AuditModule,
    BackupModule,
    HealthModule,
  ],
})
export class AppModule {}
