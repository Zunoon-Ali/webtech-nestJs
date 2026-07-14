import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { SubmitQuizAttemptDto, CreateQuizDto, UpdateQuestionDto, ManagerOverrideDto } from './dto/quiz.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../shared-types';
import { User } from '../../database/entities';

@ApiTags('Quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class QuizzesController {
  constructor(private readonly svc: QuizzesService) {}

  @Get('quizzes/:id')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get quiz with randomised questions (no correct answers)' })
  getQuiz(@Param('id') id: string) { return this.svc.getQuiz(id); }

  @Post('quizzes/:id/start')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Start a quiz attempt' })
  startAttempt(@Param('id') quizId: string, @CurrentUser() user: User) {
    return this.svc.startAttempt(quizId, user.id);
  }

  @Post('quiz-attempts/:attemptId/submit')
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Submit quiz answers for grading' })
  submitAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: User,
    @Body() dto: SubmitQuizAttemptDto,
  ) {
    return this.svc.submitAttempt(attemptId, user.id, dto);
  }

  @Post('quiz-attempts/:attemptId/override')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Manager override after 3 failed attempts' })
  override(
    @Param('attemptId') attemptId: string,
    @CurrentUser() manager: User,
    @Body() dto: ManagerOverrideDto,
  ) {
    return this.svc.managerOverride(attemptId, manager.id, dto.pass);
  }

  @Post('quizzes')
  @Roles(UserRole.CONTENT_ADMIN)
  @ApiOperation({ summary: 'Manually create a quiz for a course version' })
  createQuiz(@Body() dto: CreateQuizDto) { return this.svc.createQuiz(dto); }

  @Patch('quizzes/:id/questions/:qid')
  @Roles(UserRole.CONTENT_ADMIN)
  @ApiOperation({ summary: 'Edit an AI-generated or manually-created question' })
  updateQuestion(
    @Param('id') quizId: string,
    @Param('qid') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.svc.updateQuestion(quizId, questionId, dto as any);
  }
}
