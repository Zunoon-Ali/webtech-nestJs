import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateChapterDto } from './dto/create-course.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../shared-types';
import { User } from '../../database/entities';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class CourseQueryDto {
  @IsOptional() @Transform(({ value }) => value === 'true') mandatory?: boolean;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}

class AddVersionDto { contentUrl: string; }
class AddPrerequisiteDto { requiredCourseId: string; }

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly svc: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'List course catalogue' })
  findAll(@Query() query: CourseQueryDto) { return this.svc.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Get course with active version' })
  findOne(@Param('id') id: string) { return this.svc.findById(id); }

  @Post()
  @Roles(UserRole.CONTENT_ADMIN)
  @ApiOperation({ summary: 'Create a course (Content Admin)' })
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: User) {
    return this.svc.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.CONTENT_ADMIN)
  @ApiOperation({ summary: 'Update a course (Content Admin)' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateCourseDto>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.CONTENT_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a course (Content Admin)' })
  remove(@Param('id') id: string) { return this.svc.softDelete(id); }

  @Post(':id/versions')
  @Roles(UserRole.CONTENT_ADMIN)
  @ApiOperation({ summary: 'Publish a new version of a course' })
  addVersion(@Param('id') id: string, @Body() dto: AddVersionDto) {
    return this.svc.addVersion(id, dto.contentUrl);
  }

  @Post(':id/prerequisites')
  @Roles(UserRole.CONTENT_ADMIN)
  @ApiOperation({ summary: 'Add a prerequisite course' })
  addPrerequisite(@Param('id') id: string, @Body() dto: AddPrerequisiteDto) {
    return this.svc.addPrerequisite(id, dto.requiredCourseId);
  }

  @Get(':id/chapters')
  @ApiOperation({ summary: 'List chapters for a course' })
  getChapters(@Param('id') id: string) { return this.svc.getChapters(id); }

  @Post(':id/chapters')
  @Roles(UserRole.CONTENT_ADMIN)
  @ApiOperation({ summary: 'Add a chapter to a course' })
  addChapter(@Param('id') id: string, @Body() dto: CreateChapterDto) {
    return this.svc.addChapter(id, dto);
  }
}
