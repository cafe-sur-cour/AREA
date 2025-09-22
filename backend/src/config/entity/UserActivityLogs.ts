
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("user_activity_logs")
export class UserActivityLogs {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "int" })
	user_id!: number;

	@Column({ type: "varchar", length: 100 })
	action!: string;

	@Column({ type: "text", nullable: true })
	user_agent?: string | null;

	@Column({ type: "jsonb", nullable: true })
	metadata?: Record<string, any> | null;

	@CreateDateColumn({ type: "timestamp" })
	created_at!: Date;
}
