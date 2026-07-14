import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';
import { CourseVersion } from './course-version.entity';
import { EnrollmentStatus } from '../../shared-types';
import { Progress } from './progress.entity';

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'course_id' })
  courseId: string;

  @Column({ name: 'course_version_id' })
  courseVersionId: string;

  @Column({ name: 'enrolled_by', type: 'varchar', default: 'self' })
  enrolledBy: 'self' | 'manager';

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.NOT_STARTED,
  })
  status: EnrollmentStatus;

  @ManyToOne(() => User, (user) => user.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Course, (course) => course.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => CourseVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_version_id' })
  courseVersion: CourseVersion;

  @OneToMany(() => Progress, (progress) => progress.enrollment)
  progressList: Progress[];

  @CreateDateColumn({ name: 'enrolled_at' })
  enrolledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;
}
