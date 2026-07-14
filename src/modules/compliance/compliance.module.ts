import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { ComplianceDeadline, Enrollment, Team, User } from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplianceDeadline, Enrollment, Team, User]),
    ScheduleModule.forRoot(),
  ],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
