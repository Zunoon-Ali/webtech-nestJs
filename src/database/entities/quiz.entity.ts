import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { CourseVersion } from './course-version.entity';
import { Question } from './question.entity';
import { QuizAttempt } from './quiz-attempt.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_version_id' })
  courseVersionId: string;

  @Column({ name: 'time_limit_minutes' })
  timeLimitMinutes: number;

  @Column({ name: 'pass_threshold_percent', default: 75 })
  passThresholdPercent: number;

  @Column({ name: 'max_attempts', default: 3 })
  maxAttempts: number;

  @Column({ name: 'generated_by_ai', default: false })
  generatedByAI: boolean;

  @ManyToOne(() => CourseVersion, (version) => version.quizzes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_version_id' })
  courseVersion: CourseVersion;

  @OneToMany(() => Question, (question) => question.quiz)
  questions: Question[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];
}
