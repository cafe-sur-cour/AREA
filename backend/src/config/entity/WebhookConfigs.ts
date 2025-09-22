import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("webhook_configs")
export class WebhookConfigs {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 100, unique: true })
    name!: string;

    @Column({ type: "varchar", length: 100 })
    action_type!: string;

    @Column({ type: "text", array: true })
    reactions!: string[];

    @Column({ type: "boolean", default: true })
    is_active!: boolean;

    @Column({ type: "text", nullable: true })
    description?: string | null;

    @Column({ type: "int", nullable: true })
    created_by?: number | null;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;
}
