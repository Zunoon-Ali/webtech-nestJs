import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Quiz, Question, QuizAttempt, Answer, Enrollment } from '../../database/entities';
import { EnrollmentStatus, QuestionType } from '../../shared-types';
import { QuizAttemptsExceededException } from '../../common/exceptions/app.exception';
import { SubmitQuizAttemptDto } from './dto/quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz) private quizRepo: Repository<Quiz>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
    @InjectRepository(QuizAttempt) private attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(Answer) private answerRepo: Repository<Answer>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getQuiz(quizId: string) {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId }, relations: { questions: true } });
    if (!quiz) throw new NotFoundException({ code: 'QUIZ_NOT_FOUND', message: `Quiz ${quizId} not found` });

    // Shuffle questions, strip correct answers for client
    const shuffled = [...quiz.questions].sort(() => Math.random() - 0.5);
    return {
      ...quiz,
      questions: shuffled.map(({ correctAnswer, ...q }) => q),
    };
  }

  async startAttempt(quizId: string, userId: string) {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException({ code: 'QUIZ_NOT_FOUND', message: `Quiz ${quizId} not found` });

    const pastAttempts = await this.attemptRepo.count({ where: { quizId, userId } });
    if (pastAttempts >= quiz.maxAttempts) throw new QuizAttemptsExceededException();

    const attempt = this.attemptRepo.create({
      quizId,
      userId,
      attemptNumber: pastAttempts + 1,
    });
    return this.attemptRepo.save(attempt);
  }

  async submitAttempt(attemptId: string, userId: string, dto: SubmitQuizAttemptDto) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId, userId } });
    if (!attempt) throw new NotFoundException({ code: 'ATTEMPT_NOT_FOUND', message: 'Quiz attempt not found' });
    if (attempt.submittedAt) throw new ForbiddenException({ code: 'ATTEMPT_ALREADY_SUBMITTED', message: 'Attempt already submitted' });

    const quiz = await this.quizRepo.findOne({
      where: { id: attempt.quizId },
      relations: { courseVersion: { course: true } },
    });
    if (!quiz) throw new NotFoundException({ code: 'QUIZ_NOT_FOUND', message: 'Quiz not found' });
    const questions = await this.questionRepo.find({ where: { quizId: attempt.quizId } });

    // Grade answers
    let correctCount = 0;
    const answerEntities: Partial<Answer>[] = [];

    for (const submitted of dto.answers) {
      const question = questions.find(q => q.id === submitted.questionId);
      if (!question) continue;

      const isCorrect = question.type === QuestionType.MCQ
        ? submitted.submittedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
        : submitted.submittedAnswer.trim().toLowerCase().includes(question.correctAnswer.trim().toLowerCase());

      if (isCorrect) correctCount++;
      answerEntities.push({
        quizAttemptId: attemptId,
        questionId: submitted.questionId,
        submittedAnswer: submitted.submittedAnswer,
        isCorrect,
      });
    }

    await this.answerRepo.save(answerEntities);

    const scorePercent = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
    const passed = scorePercent >= quiz.passThresholdPercent;

    const pastAttempts = await this.attemptRepo.count({ where: { quizId: attempt.quizId, userId } });
    const attemptsRemaining = Math.max(0, quiz.maxAttempts - pastAttempts);

    await this.attemptRepo.update(attemptId, {
      scorePercent,
      passed,
      submittedAt: new Date(),
    });

    // Emit live score event via WebSocket
    this.eventEmitter.emit('quiz.liveScore', {
      attemptId,
      answeredCount: dto.answers.length,
      totalQuestions: questions.length,
      runningScorePercent: Math.round(scorePercent),
    });

    // If passed, trigger certificate generation
    if (passed) {
      // Find the enrollment to get courseId
      const enrollment = await this.enrollmentRepo.findOne({
        where: { userId, courseId: quiz.courseVersion?.courseId },
      });

      await this.enrollmentRepo.update(
        { userId, courseVersionId: attempt.quizId },
        { status: EnrollmentStatus.PASSED, completedAt: new Date() },
      );

      this.eventEmitter.emit('certificate.requested', {
        userId,
        quizAttemptId: attemptId,
      });
    } else {
      await this.enrollmentRepo.update(
        { userId },
        { status: EnrollmentStatus.FAILED },
      );
    }

    return {
      attemptId,
      scorePercent: Math.round(scorePercent * 100) / 100,
      passed,
      attemptsRemaining,
      certificateId: null, // will be set asynchronously via event
    };
  }

  async managerOverride(attemptId: string, managerId: string, pass: boolean) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException({ code: 'ATTEMPT_NOT_FOUND', message: 'Quiz attempt not found' });

    await this.attemptRepo.update(attemptId, {
      passed: pass,
      overriddenByManagerId: managerId,
    });

    if (pass) {
      this.eventEmitter.emit('certificate.requested', {
        userId: attempt.userId,
        quizAttemptId: attemptId,
      });
    }

    return { success: true, overridden: true };
  }

  async createQuiz(data: { courseVersionId: string; timeLimitMinutes: number; passThresholdPercent?: number; maxAttempts?: number }) {
    const quiz = this.quizRepo.create({ ...data, generatedByAI: false });
    return this.quizRepo.save(quiz);
  }

  async updateQuestion(quizId: string, questionId: string, data: Partial<Question>) {
    const question = await this.questionRepo.findOne({ where: { id: questionId, quizId } });
    if (!question) throw new NotFoundException({ code: 'QUESTION_NOT_FOUND', message: 'Question not found' });
    Object.assign(question, data);
    return this.questionRepo.save(question);
  }
}
