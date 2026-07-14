import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiProxyService } from './ai-proxy.service';
import {
  LearningPathRequestDto,
  QuizGenerateRequestDto,
  GapAnalysisRequestDto,
  RiskAlertsGenerateDto,
  RiskAlertsSendDto,
} from './dto/ai-proxy-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities';
import { AiFeature } from '../../shared-types';

@ApiTags('AI Proxy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiProxyController {
  constructor(private readonly svc: AiProxyService) {}

  @Post('learning-path')
  @ApiOperation({ summary: 'Generate custom learning path recommendations (Employee)' })
  async learningPath(@Body() dto: LearningPathRequestDto, @CurrentUser() user: User) {
    const { requestId, ...payload } = dto;
    return this.svc.call(AiFeature.LEARNING_PATH, requestId, payload, user.id);
  }

  @Post('quiz-generate')
  @ApiOperation({ summary: 'Draft quiz questions based on PDF/extracted content (Content Admin)' })
  async quizGenerate(@Body() dto: QuizGenerateRequestDto, @CurrentUser() user: User) {
    const { requestId, ...payload } = dto;
    return this.svc.call(AiFeature.QUIZ_GEN, requestId, payload, user.id);
  }

  @Post('gap-analysis')
  @ApiOperation({ summary: 'Analyze team competency gaps against frameworks (Manager)' })
  async gapAnalysis(@Body() dto: GapAnalysisRequestDto, @CurrentUser() user: User) {
    const { requestId, ...payload } = dto;
    return this.svc.call(AiFeature.GAP_ANALYSIS, requestId, payload, user.id);
  }

  @Post('risk-alerts/generate')
  @ApiOperation({ summary: 'Generate compliance email alert templates' })
  async generateRiskAlerts(@Body() dto: RiskAlertsGenerateDto, @CurrentUser() user: User) {
    const { requestId } = dto;
    // Mock user list details to run templates
    const payload = {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      courseListWithDeadlines: 'Data Protection (overdue)',
      daysRemaining: 0,
    };
    return this.svc.call(AiFeature.RISK_ALERT, requestId, payload, user.id);
  }

  @Post('risk-alerts/send')
  @ApiOperation({ summary: 'Send generated email alert alerts to learners (HR Admin)' })
  async sendRiskAlerts(@Body() dto: RiskAlertsSendDto) {
    // Return mock verification for bulk email notifications
    return {
      success: true,
      sentCount: dto.alertIds.length,
      timestamp: new Date().toISOString(),
    };
  }
}
