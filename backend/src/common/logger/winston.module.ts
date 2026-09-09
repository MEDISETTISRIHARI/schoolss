import { Module } from '@nestjs/common';
import { WinstonLoggerService } from './winston.service';

@Module({
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class WinstonModule {}
