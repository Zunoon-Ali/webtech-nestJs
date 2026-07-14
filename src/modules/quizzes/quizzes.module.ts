import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { Quiz, Question, QuizAttempt, Answer, Enrollment } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, Question, QuizAttempt, Answer, Enrollment])],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
