---
sidebar_position: 1
---

# Create a Table

This guide explains how to implement database tables in the AREA project using PostgreSQL and TypeORM.

## Prerequisites

To start, you need:
- Basic understanding of SQL databases and PostgreSQL
- Knowledge of TypeScript and decorators
- Familiarity with TypeORM concepts
- Project setup completed (refer to the [Project Overview](../intro.md))

## Database Architecture Overview

The AREA project uses a dual approach for database management:
1. **SQL Files**: Raw SQL table definitions for database initialization
2. **TypeORM Entities**: TypeScript classes that map to database tables

This approach provides both database portability and type safety in the application code.

## Step-by-Step Guide

### 1. Create the SQL Table Definition

First, create a SQL file in the `database/table/` directory:

**File**: `database/table/your_table_name.sql`

```sql
-- Example: Create a new service_configurations table
CREATE TABLE service_configurations (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "service_name" VARCHAR(100) NOT NULL,
    "config_data" JSONB NOT NULL,
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT "unique_user_service" UNIQUE ("user_id", "service_name")
);

-- Add comments for documentation
COMMENT ON TABLE service_configurations IS 'Stores user-specific service configurations';
COMMENT ON COLUMN service_configurations.config_data IS 'JSON object containing service-specific settings';
```

**Naming Conventions:**
- Use lowercase with underscores (`snake_case`)
- Plural table names (e.g., `users`, `webhook_configs`)
- Primary key always named `id`
- Foreign keys: `{referenced_table}_id` (e.g., `user_id`)
- Timestamps: `created_at`, `updated_at`

### 2. Define Relationships (if needed)

If your table has foreign key relationships, create or update the relation file:

**File**: `database/relation/your_relations.sql`

```sql
-- ===========================================
-- FOREIGN KEY CONSTRAINTS
-- ===========================================

-- Add foreign key constraints
ALTER TABLE service_configurations
ADD CONSTRAINT fk_service_configs_user
FOREIGN KEY ("user_id") REFERENCES users("id")
ON DELETE CASCADE;

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Add indexes for frequently queried columns
CREATE INDEX "idx_service_configs_user_id" ON service_configurations("user_id");
CREATE INDEX "idx_service_configs_service_name" ON service_configurations("service_name");
CREATE INDEX "idx_service_configs_active" ON service_configurations("is_active") WHERE "is_active" = true;
```

### 3. Create the TypeORM Entity

Create a TypeScript entity file in `backend/src/config/entity/`:

**File**: `backend/src/config/entity/ServiceConfigurations.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('service_configurations')
@Index(['user_id', 'service_name'], { unique: true })
export class ServiceConfigurations extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  user_id!: number;

  @Column({ type: 'varchar', length: 100 })
  service_name!: string;

  @Column({ type: 'jsonb' })
  config_data!: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
```

### 4. Register the Entity in Database Configuration

Add your new entity to the TypeORM configuration:

**File**: `backend/src/config/db.ts`

```typescript
// Import your new entity
import { ServiceConfigurations } from './entity/ServiceConfigurations';

// Add to the entities array
export const AppDataSource = new DataSource({
  // ... other config
  entities: [
    User,
    UserOAuthProvider,
    UserToken,
    ServiceConfigurations, // Add your entity here
    // ... other entities
  ],
  // ... rest of config
});
```

## TypeORM Decorators Reference

### Common Column Types

```typescript
// Basic types
@Column({ type: 'varchar', length: 255 })
name!: string;

@Column({ type: 'text' })
description!: string;

@Column({ type: 'integer' })
count!: number;

@Column({ type: 'boolean', default: false })
is_active!: boolean;

@Column({ type: 'timestamp' })
expires_at!: Date;

// PostgreSQL specific
@Column({ type: 'jsonb' })
metadata!: Record<string, any>;

@Column({ type: 'jsonb', array: true })
tags!: string[];

// Nullable columns
@Column({ type: 'varchar', length: 500, nullable: true })
optional_field?: string | null;
```

### Relationships

```typescript
// One-to-Many (User has many configurations)
@OneToMany(() => ServiceConfigurations, config => config.user)
configurations!: ServiceConfigurations[];

// Many-to-One (Configuration belongs to one user)
@ManyToOne(() => User, user => user.configurations, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'user_id' })
user!: User;

// Many-to-Many
@ManyToMany(() => Tag)
@JoinTable({
  name: 'service_tags',
  joinColumn: { name: 'service_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' }
})
tags!: Tag[];
```

### Indexes and Constraints

```typescript
// Unique constraint
@Column({ type: 'varchar', length: 255, unique: true })
email!: string;

// Composite index
@Index(['user_id', 'service_name'], { unique: true })

// Index on entity level
@Index('idx_service_active')
@Entity('service_configurations')
export class ServiceConfigurations {
  // ...
}
```

## Database Initialization

The database initialization happens through the `database/init-postgres.sh` script, which:

1. Executes all SQL files in `database/table/` (table creation)
2. Executes all SQL files in `database/relation/` (relationships and indexes)

Make sure your SQL files follow the naming convention to ensure proper execution order.

## Best Practices

### 1. Naming Conventions
- **Tables**: `snake_case`, plural (e.g., `user_tokens`, `webhook_configs`)
- **Columns**: `snake_case` (e.g., `created_at`, `user_id`)
- **Entities**: `PascalCase`, singular (e.g., `UserToken`, `WebhookConfig`)
- **Foreign Keys**: `{table}_id` (e.g., `user_id`)

### 2. Required Fields
Always include these standard fields:
```sql
"id" SERIAL PRIMARY KEY,
"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 3. Data Types
- Use `JSONB` for flexible data storage (better performance than JSON)
- Use `VARCHAR` with appropriate length limits
- Use `TEXT` for unlimited text content
- Use `BOOLEAN` with meaningful defaults

### 4. Constraints
- Add foreign key constraints for data integrity
- Use unique constraints where appropriate
- Add check constraints for data validation

### 5. Indexes
- Index foreign key columns
- Index frequently searched columns
- Use partial indexes for boolean flags: `WHERE "is_active" = true`

## Example: Complete Implementation

Here's a complete example for a `notifications` table:

**1. SQL Table** (`database/table/notifications.sql`):
```sql
CREATE TABLE notifications (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP,

    CONSTRAINT "valid_notification_type"
    CHECK ("type" IN ('info', 'warning', 'error', 'success'))
);
```

**2. Relations** (`database/relation/notifications.sql`):
```sql
ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_user
FOREIGN KEY ("user_id") REFERENCES users("id")
ON DELETE CASCADE;

CREATE INDEX "idx_notifications_user_id" ON notifications("user_id");
CREATE INDEX "idx_notifications_unread" ON notifications("is_read") WHERE "is_read" = false;
CREATE INDEX "idx_notifications_type" ON notifications("type");
```

**3. TypeORM Entity** (`backend/src/config/entity/Notifications.ts`):
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

@Entity('notifications')
export class Notifications extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  user_id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type!: NotificationType;

  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  read_at?: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
```

**4. Register in `db.ts`**:
```typescript
import { Notifications } from './entity/Notifications';

// Add to entities array
entities: [
  // ... existing entities
  Notifications,
],
```

## Testing Your Implementation

After creating your table:

1. **Run the database initialization**:
   ```bash
   # If using Docker
   docker-compose down
   docker-compose up --build

   # Or manually
   psql -d area_db -f database/table/your_table.sql
   psql -d area_db -f database/relation/your_relations.sql
   ```

2. **Test the TypeORM entity**:
   ```typescript
   // In your service or route
   const newRecord = new YourEntity();
   newRecord.field = 'value';
   await newRecord.save();
   ```

3. **Verify in database**:
   ```sql
   \d your_table_name  -- Describe table structure
   SELECT * FROM your_table_name LIMIT 5;  -- Check data
   ```

Following this guide ensures your tables are properly integrated into both the database schema and the TypeScript application code.
