import { IsArray, IsUUID, IsString, IsBoolean, IsEnum, IsInt, IsOptional, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QuestionType } from '../../../shared-types';

export class SubmitAnswerDto {
  @ApiProperty() @IsUUID() questionId: string;
  @ApiProperty() @IsString() @IsNotEmpty() submittedAnswer: string;
}

export class SubmitQuizAttemptDto {
  @ApiProperty({ type: [SubmitAnswerDto] })
  @IsArray()
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}

export class CreateQuizDto {
  @ApiProperty() @IsUUID() courseVersionId: string;
  @ApiProperty() @IsInt() @Min(5) @Max(120) timeLimitMinutes: number;
  @ApiPropertyOptional({ default: 75 }) @IsInt() @Min(1) @Max(100) @IsOptional() passThresholdPercent?: number;
  @ApiPropertyOptional({ default: 3 }) @IsInt() @Min(1) @IsOptional() maxAttempts?: number;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional() @IsString() @IsOptional() text?: string;
  @ApiPropertyOptional({ type: [String] }) @IsArray() @IsOptional() options?: string[];
  @ApiPropertyOptional() @IsString() @IsOptional() correctAnswer?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() explanation?: string;
}

export class ManagerOverrideDto {
  @ApiProperty() @IsBoolean() pass: boolean;
}
