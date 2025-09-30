import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity('webhook_reactions')
export class WebhookReactions extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  webhook_event_id!: number;

  @Column({ type: 'varchar', length: 100 })
  reaction_name!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ type: 'int', nullable: true })
  execution_time_ms?: number | null;

  @Column({ type: 'text', nullable: true })
  error_message?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  output_data?: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  executed_at?: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}
