import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { AiFeature } from '../../shared-types';

@Entity('ai_request_logs')
export class AiRequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: AiFeature,
  })
  feature: AiFeature;

  @Column({ name: 'request_id', unique: true })
  requestId: string;

  @Column({ name: 'prompt_tokens', type: 'int', default: 0 })
  promptTokens: number;

  @Column({ name: 'completion_tokens', type: 'int', default: 0 })
  completionTokens: number;

  @Column({
    type: 'varchar',
    default: 'success',
  })
  status: 'success' | 'failed' | 'fallback_used';

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
