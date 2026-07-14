import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsDateString, IsArray, IsUUID, IsInt, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType } from '../../../shared-types';

export class CreateCourseDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiProperty() @IsBoolean() isMandatory: boolean;
  @ApiPropertyOptional() @IsDateString() @IsOptional() regulatoryDeadline?: string;
  @ApiProperty({ type: [String] }) @IsArray() @IsUUID('4', { each: true }) targetDepartmentIds: string[];
  @ApiProperty() @IsInt() @Min(1) estimatedDurationMinutes: number;
}

export class CreateChapterDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsInt() @Min(0) order: number;
  @ApiProperty({ enum: ContentType }) @IsEnum(ContentType) contentType: ContentType;
  @ApiProperty() @IsString() @IsNotEmpty() contentUrl: string;
}
