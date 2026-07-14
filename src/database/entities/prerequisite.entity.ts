import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity('prerequisites')
export class Prerequisite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id' })
  courseId: string;

  @Column({ name: 'required_course_id' })
  requiredCourseId: string;

  @ManyToOne(() => Course, (course) => course.prerequisites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'required_course_id' })
  requiredCourse: Course;
}
