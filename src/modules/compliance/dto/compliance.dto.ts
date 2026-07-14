import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComplianceDeadlineDto {
  @ApiProperty() @IsUUID() courseId: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() departmentId?: string;
  @ApiProperty() @IsDateString() deadlineDate: string;
}
