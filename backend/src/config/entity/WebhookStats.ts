import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('webhook_stats')
export class WebhookStats {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 100 })
  action_type!: string;

  @Column({ type: 'varchar', length: 100 })
  reaction_name!: string;

  @Column({ type: 'int', default: 0 })
  count!: number;

  @Column({ type: 'int', default: 0 })
  total_processing_time_ms!: number;

  @Column({ type: 'int', default: 0 })
  success_count!: number;

  @Column({ type: 'int', default: 0 })
  error_count!: number;
}
