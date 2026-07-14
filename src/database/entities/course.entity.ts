import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { CourseVersion } from './course-version.entity';
import { Prerequisite } from './prerequisite.entity';
import { Enrollment } from './enrollment.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'is_mandatory', default: false })
  isMandatory: boolean;

  @Column({ name: 'regulatory_deadline', type: 'date', nullable: true })
  regulatoryDeadline: string | null;

  @Column({ name: 'target_department_ids', type: 'uuid', array: true, default: '{}' })
  targetDepartmentIds: string[];

  @Column({ name: 'estimated_duration_minutes' })
  estimatedDurationMinutes: number;

  @Column({ name: 'current_version_id', type: 'uuid', nullable: true })
  currentVersionId: string | null;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => CourseVersion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'current_version_id' })
  currentVersion: CourseVersion | null;

  @OneToMany(() => CourseVersion, (version) => version.course)
  versions: CourseVersion[];

  @OneToMany(() => Prerequisite, (prereq) => prereq.course)
  prerequisites: Prerequisite[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
