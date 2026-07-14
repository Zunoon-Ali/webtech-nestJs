import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../shared-types';
import { CreateDepartmentDto, CreateTeamDto } from './dto/create-hierarchy.dto';
import { IsOptional, IsUUID } from 'class-validator';

@ApiTags('Hierarchy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CompaniesController {
  constructor(private readonly svc: CompaniesService) {}

  @Get('companies/:id')
  @Roles(UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get company details (HR Admin)' })
  getCompany(@Param('id') id: string) { return this.svc.findCompany(id); }

  // Departments
  @Get('departments')
  @Roles(UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List departments by companyId' })
  getDepts(@Query('companyId') companyId: string) { return this.svc.findDepartments(companyId); }

  @Post('departments')
  @Roles(UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a department' })
  createDept(@Query('companyId') companyId: string, @Body() dto: CreateDepartmentDto) {
    return this.svc.createDepartment(companyId, dto.name);
  }

  // Teams
  @Get('teams')
  @Roles(UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List teams by departmentId' })
  getTeams(@Query('departmentId') departmentId: string) { return this.svc.findTeams(departmentId); }

  @Post('teams')
  @Roles(UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a team' })
  createTeam(@Query('departmentId') departmentId: string, @Body() dto: CreateTeamDto) {
    return this.svc.createTeam(departmentId, dto.name);
  }

  @Patch('teams/:id')
  @Roles(UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update a team (assign manager)' })
  updateTeam(@Param('id') id: string, @Body() body: { managerId?: string; name?: string }) {
    return this.svc.updateTeam(id, body);
  }

  @Get('teams/:id/members')
  @Roles(UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get team members' })
  getTeamMembers(@Param('id') id: string) { return this.svc.getTeamMembers(id); }
}
