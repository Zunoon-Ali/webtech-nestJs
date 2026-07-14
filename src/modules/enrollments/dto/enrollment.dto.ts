import { IsUUID, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProgressStatus } from '../../../shared-types';

export class SelfEnrollDto {
  @ApiProperty() @IsUUID() courseId: string;
}

export class BulkEnrollDto {
  @ApiProperty() @IsUUID() courseId: string;
  @ApiProperty() @IsUUID() teamId: string;
}

export class UpdateProgressDto {
  @ApiProperty() @IsUUID() chapterId: string;
  @ApiProperty({ enum: ProgressStatus }) @IsEnum(ProgressStatus) status: ProgressStatus;
}

export class QueryEnrollmentsDto {
  @ApiPropertyOptional() @IsUUID() @IsOptional() teamId?: string;
  @ApiPropertyOptional({ default: 1 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @Type(() => Number) @IsInt() @Min(1) @Max(100) @IsOptional() limit?: number = 20;
}
