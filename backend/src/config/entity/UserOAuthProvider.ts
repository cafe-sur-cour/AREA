import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

@Entity('user_oauth_providers')
export class UserOAuthProvider {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  user_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 50 })
  connection_type!: 'auth' | 'service'; // 'auth' pour login, 'service' pour webhooks/APIs

  @Column({ type: 'varchar', length: 255 })
  provider!: string;

  @Column({ type: 'varchar', length: 255 })
  provider_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  provider_email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  provider_username?: string;

  @Column({ type: 'text', nullable: true })
  provider_profile_data?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at?: Date;
}
