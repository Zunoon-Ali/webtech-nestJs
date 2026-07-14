import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { Chapter } from './chapter.entity';
import { ProgressStatus } from '../../shared-types';

@Entity('progress')
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enrollment_id' })
  enrollmentId: string;

  @Column({ name: 'chapter_id' })
  chapterId: string;

  @Column({
    type: 'enum',
    enum: ProgressStatus,
    default: ProgressStatus.NOT_STARTED,
  })
  status: ProgressStatus;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.progressList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Enrollment;

  @ManyToOne(() => Chapter, (chapter) => chapter.progressList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
