import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Quiz } from './quiz.entity';
import { User } from './user.entity';
import { Answer } from './answer.entity';

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id' })
  quizId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'attempt_number' })
  attemptNumber: number;

  @Column({ name: 'score_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  scorePercent: number | null;

  @Column({ type: 'boolean', nullable: true })
  passed: boolean | null;

  @Column({ name: 'overridden_by_manager_id', type: 'uuid', nullable: true })
  overriddenByManagerId: string | null;

  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @ManyToOne(() => User, (user) => user.quizAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'overridden_by_manager_id' })
  overriddenByManager: User | null;

  @OneToMany(() => Answer, (answer) => answer.quizAttempt)
  answers: Answer[];

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;
}
