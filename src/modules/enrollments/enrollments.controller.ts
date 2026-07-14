import { Controller, Post, Get, Patch, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { SelfEnrollDto, BulkEnrollDto, UpdateProgressDto, QueryEnrollmentsDto } from './dto/enrollment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../shared-types';
import { User } from '../../database/entities';
import { Query } from '@nestjs/common';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly svc: EnrollmentsService) {}

  @Post('self')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Self-enroll in an elective course' })
  selfEnroll(@CurrentUser() user: User, @Body() dto: SelfEnrollDto) {
    return this.svc.selfEnroll(user.id, dto.courseId);
  }

  @Post('bulk')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Bulk-enroll a team in a mandatory course' })
  bulkEnroll(@CurrentUser() manager: User, @Body() dto: BulkEnrollDto) {
    return this.svc.bulkEnroll(manager.id, dto.courseId, dto.teamId);
  }

  @Get('me')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get my enrollments' })
  myEnrollments(@CurrentUser() user: User) {
    return this.svc.getMyEnrollments(user.id);
  }

  @Get()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Get enrollments for a team (Manager)' })
  teamEnrollments(@Query() query: QueryEnrollmentsDto, @CurrentUser() manager: User) {
    const teamId = query.teamId || manager.teamId;
    if (!teamId) {
      throw new BadRequestException({ code: 'TEAM_ID_REQUIRED', message: 'teamId is required' });
    }
    return this.svc.getTeamEnrollments(teamId, { page: query.page || 1, limit: query.limit || 20 });
  }

  @Patch(':id/progress')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Update chapter progress for an enrollment' })
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.updateProgress(id, user.id, dto.chapterId, dto.status);
  }
}
