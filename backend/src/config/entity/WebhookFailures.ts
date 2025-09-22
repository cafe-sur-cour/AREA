import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("webhook_failures")
export class WebhookFailures {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 100, nullable: true })
    action_type?: string | null;

    @Column({ type: "jsonb", nullable: true })
    payload?: Record<string, any> | null;

    @Column({ type: "text" })
    error_message!: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    error_code?: string | null;

    @Column({ type: "text", nullable: true })
    user_agent?: string | null;

    @Column({ type: "int", default: 0 })
    retry_count!: number;

    @Column({ type: "timestamp", nullable: true })
    last_retry_at?: Date | null;

    @Column({ type: "boolean", default: false })
    resolved!: boolean;

    @Column({ type: "timestamp", nullable: true })
    resolved_at?: Date | null;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}
