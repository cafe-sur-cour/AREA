import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity('user_tokens')
export class UserToken extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  user_id!: number;

  @Column({ type: 'varchar', length: 50 })
  token_type!: string;

  @Column({ type: 'text', unique: true })
  token_value!: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date | null;

  @Column({ type: 'text', array: true, nullable: true })
  scopes?: string[];

  @Column({ type: 'boolean', default: false })
  is_revoked!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at?: Date | null;

  @Column({ type: 'text', nullable: true })
  revoked_reason?: string | null;
}
