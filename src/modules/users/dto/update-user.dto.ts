import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../shared-types';

export class UpdateUserDto {
  @ApiPropertyOptional() @IsString() @IsOptional() firstName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() lastName?: string;
  @ApiPropertyOptional({ enum: UserRole }) @IsEnum(UserRole) @IsOptional() role?: UserRole;
  @ApiPropertyOptional() @IsUUID() @IsOptional() teamId?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
}
