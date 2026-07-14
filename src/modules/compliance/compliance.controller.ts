import { Controller, Post, Get, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { CreateComplianceDeadlineDto } from './dto/compliance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../shared-types';

@ApiTags('Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly svc: ComplianceService) {}

  @Post('deadlines')
  @Roles(UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a compliance deadline (HR Admin)' })
  createDeadline(@Body() dto: CreateComplianceDeadlineDto) {
    return this.svc.createDeadline(dto);
  }

  @Get('deadlines')
  @Roles(UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all compliance deadlines, optionally filtered by team' })
  getDeadlines(@Query('teamId') teamId?: string) {
    return this.svc.getDeadlines(teamId);
  }

  @Get('teams/:teamId/report')
  @Roles(UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get compliance completion report for a team' })
  getTeamReport(@Param('teamId') teamId: string) {
    return this.svc.getTeamComplianceReport(teamId);
  }
}
