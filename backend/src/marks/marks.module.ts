import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { MarksController } from './marks.controller';
import { MarksService } from './marks.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [MarksController],
  providers: [MarksService],
  exports: [MarksService],
})
export class MarksModule {}
