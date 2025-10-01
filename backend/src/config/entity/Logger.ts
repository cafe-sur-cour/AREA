import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity('logs')
export class Logger extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: ['info', 'succ', 'warn', 'err'] })
  type!: 'info' | 'succ' | 'warn' | 'err';

  @Column({ type: 'enum', enum: ['login', 'logout', 'other'] })
  kind!: 'login' | 'logout' | 'other';

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @Column({ type: 'text', nullable: true })
  message!: string | null;
}
