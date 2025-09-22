
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("external_webhooks")
export class ExternalWebhooks {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "int" })
	user_id!: number;

	@Column({ type: "varchar", length: 100 })
	service!: string;

	@Column({ type: "varchar", length: 255, nullable: true })
	external_id?: string | null;

	@Column({ type: "varchar", length: 255, nullable: true })
	repository?: string | null;

	@Column({ type: "varchar", length: 500 })
	url!: string;

	@Column({ type: "varchar", length: 255, nullable: true })
	secret?: string | null;

	@Column({ type: "text", array: true, nullable: true })
	events?: string[] | null;

	@Column({ type: "boolean", default: true })
	is_active!: boolean;

	@Column({ type: "timestamp", nullable: true })
	last_triggered_at?: Date | null;

	@CreateDateColumn({ type: "timestamp" })
	created_at!: Date;

	@UpdateDateColumn({ type: "timestamp" })
	updated_at!: Date;
}
