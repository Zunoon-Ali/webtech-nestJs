import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';
import { QuizAttempt } from './quiz-attempt.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'course_id' })
  courseId: string;

  @Column({ name: 'quiz_attempt_id' })
  quizAttemptId: string;

  @Column({ name: 'verification_code', unique: true })
  verificationCode: string;

  @Column({ name: 'pdf_url' })
  pdfUrl: string;

  @ManyToOne(() => User, (user) => user.certificates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @OneToOne(() => QuizAttempt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_attempt_id' })
  quizAttempt: QuizAttempt;

  @CreateDateColumn({ name: 'issued_at' })
  issuedAt: Date;
}
