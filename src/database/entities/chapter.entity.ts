import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { CourseVersion } from './course-version.entity';
import { ContentType } from '../../shared-types';
import { Progress } from './progress.entity';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_version_id' })
  courseVersionId: string;

  @Column()
  title: string;

  @Column({ name: 'chapter_order' })
  order: number;

  @Column({
    type: 'enum',
    enum: ContentType,
  })
  contentType: ContentType;

  @Column({ name: 'content_url' })
  contentUrl: string;

  @ManyToOne(() => CourseVersion, (version) => version.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_version_id' })
  courseVersion: CourseVersion;

  @OneToMany(() => Progress, (progress) => progress.chapter)
  progressList: Progress[];
}
