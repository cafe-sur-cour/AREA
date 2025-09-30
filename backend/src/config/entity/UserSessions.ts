import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity('user_sessions')
export class UserSessions extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  user_id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  session_token!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  refresh_token?: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent?: string | null;

  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_used_at!: Date;
}
