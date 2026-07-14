import { IsString, IsNotEmpty, IsInt, Min, Max, IsUUID, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LearningPathRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() currentRole: string;
  @ApiProperty() @IsString() @IsNotEmpty() department: string;
  @ApiProperty() @IsString() @IsNotEmpty() careerGoal: string;
  @ApiProperty() @IsUUID() requestId: string;
}

export class QuizGenerateRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() extractedText: string;
  @ApiProperty({ default: 10 }) @IsInt() @Min(1) @Max(50) questionCount: number;
  @ApiProperty({ example: 'medium' }) @IsString() @IsNotEmpty() difficulty: string;
  @ApiProperty() @IsUUID() requestId: string;
}

export class GapAnalysisRequestDto {
  @ApiProperty() @IsUUID() teamId: string;
  @ApiProperty() @IsUUID() frameworkId: string;
  @ApiProperty() @IsUUID() requestId: string;
}

export class RiskAlertsGenerateDto {
  @ApiProperty() @IsUUID() requestId: string;
}

export class RiskAlertsSendDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  alertIds: string[];
}
