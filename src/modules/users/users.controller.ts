import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../shared-types';
import { User } from '../../database/entities';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'List all users (HR Admin only)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID (self, manager-of-team, or HR Admin)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string, @CurrentUser() requester: User) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (HR Admin or self — limited fields)' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() requester: User) {
    // Self can only update firstName/lastName; HR Admin can update all
    if (requester.role !== UserRole.HR_ADMIN) {
      const { role, isActive, teamId, ...allowed } = dto;
      return this.usersService.update(id, allowed);
    }
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user (HR Admin only)' })
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
