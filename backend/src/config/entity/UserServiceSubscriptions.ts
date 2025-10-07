import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  Unique,
} from 'typeorm';

@Entity('user_service_subscriptions')
@Unique(['user_id', 'service'])
export class UserServiceSubscriptions extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  user_id!: number;

  @Column({ type: 'varchar', length: 50 })
  service!: string;

  @Column({ type: 'boolean', default: false })
  subscribed!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  subscribed_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  unsubscribed_at?: Date | null;

  @Column({ type: 'jsonb', default: {} })
  state_data!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}
