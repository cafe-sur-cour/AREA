import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    email!: string;

    @Column({ type: "varchar", length: 255 })
    password_hash!: string;

    @Column({ type: "boolean", default: false })
    is_admin!: boolean;

    @Column({ type: "varchar", length: 500, nullable: true })
    picture!: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at!: Date;

    // Security fields
    @Column({ type: "boolean", default: false })
    email_verified!: boolean;

    @Column({ type: "varchar", length: 255, nullable: true })
    email_verification_token!: string;

    @Column({ type: "timestamp", nullable: true })
    email_verification_expires!: Date;

    // Password management
    @Column({ type: "varchar", length: 255, nullable: true })
    password_reset_token!: string;

    @Column({ type: "timestamp", nullable: true })
    password_reset_expires!: Date;

    // Security and authentication
    @Column({ type: "integer", default: 0 })
    failed_login_attempts!: number;

    @Column({ type: "timestamp", nullable: true })
    locked_until!: Date;

    @Column({ type: "timestamp", nullable: true })
    last_login_at!: Date;

    @Column({ type: "timestamp", nullable: true })
    last_password_change!: Date;

    // User preferences
    @Column({ type: "varchar", length: 50, default: 'UTC' })
    timezone!: string;

    @Column({ type: "varchar", length: 10, default: 'en' })
    language!: string;

    @Column({ type: "varchar", length: 20, default: 'light' })
    theme!: string;

    // Metadata
    @Column({ type: "boolean", default: true })
    is_active!: boolean;

    @Column({ type: "timestamp", nullable: true })
    deleted_at!: Date;
}
