import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Course } from './course.entity';
import { Chapter } from './chapter.entity';
import { Quiz } from './quiz.entity';

@Entity('course_versions')
export class CourseVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id' })
  courseId: string;

  @Column({ name: 'version_number' })
  versionNumber: number;

  @Column({ name: 'content_url' })
  contentUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Course, (course) => course.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @OneToMany(() => Chapter, (chapter) => chapter.courseVersion)
  chapters: Chapter[];

  @OneToMany(() => Quiz, (quiz) => quiz.courseVersion)
  quizzes: Quiz[];

  @CreateDateColumn({ name: 'published_at' })
  publishedAt: Date;
}
