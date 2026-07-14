import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Department } from './department.entity';
import { User } from './user.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'department_id' })
  departmentId: string;

  @Column()
  name: string;

  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  managerId: string | null;

  @ManyToOne(() => Department, (department) => department.teams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(() => User, (user) => user.team)
  members: User[];

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_id' })
  manager: User | null;
}
