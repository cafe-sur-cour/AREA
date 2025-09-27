import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('user_service_configs')
@Index(['user_id', 'service'], { unique: true })
export class UserServiceConfigs {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  user_id!: number;

  @Column({ type: 'varchar', length: 100 })
  service!: string;

  @Column({ type: 'jsonb' })
  credentials!: Record<string, string>;

  @Column({ type: 'jsonb', default: '{}' })
  settings!: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
