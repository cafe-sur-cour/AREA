import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity('webhook_events')
export class WebhookEvents extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  action_type!: string;

  @Column({ type: 'int' })
  user_id!: number;

  @Column({ type: 'int', nullable: true })
  mapping_id?: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  external_id?: string | null;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  processed_payload?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 50, default: 'received' })
  status!: string;

  @Column({ type: 'int', nullable: true })
  processing_time_ms?: number | null;

  @Column({ type: 'text', nullable: true })
  user_agent?: string | null;

  @Column({ type: 'boolean', default: false })
  signature_verified!: boolean;

  @Column({ type: 'text', nullable: true })
  error_message?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at?: Date | null;
}
