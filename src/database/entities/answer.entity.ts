import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { QuizAttempt } from './quiz-attempt.entity';
import { Question } from './question.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_attempt_id' })
  quizAttemptId: string;

  @Column({ name: 'question_id' })
  questionId: string;

  @Column({ name: 'submitted_answer', type: 'text' })
  submittedAnswer: string;

  @Column({ name: 'is_correct', type: 'boolean', nullable: true })
  isCorrect: boolean | null;

  @ManyToOne(() => QuizAttempt, (attempt) => attempt.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_attempt_id' })
  quizAttempt: QuizAttempt;

  @ManyToOne(() => Question, (question) => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
