import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../shared-types';

export class QueryUsersDto {
  @ApiPropertyOptional() @IsUUID() @IsOptional() departmentId?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() teamId?: string;
  @ApiPropertyOptional({ enum: UserRole }) @IsEnum(UserRole) @IsOptional() role?: UserRole;
  @ApiPropertyOptional({ default: 1 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @Type(() => Number) @IsInt() @Min(1) @Max(100) @IsOptional() limit?: number = 20;
}
