---
sidebar_position: 5
---

# Create an Action

This guide explains how to create actions (triggers) for services in the AREA platform. Actions are events that initiate automation workflows when specific conditions are met.

:::tip 🎯 Modular Architecture

Actions should be defined **inside your service folder**:
- ✅ Place actions in: `/backend/src/services/services/your-service/actions.ts`
- ✅ Place schemas in: `/backend/src/services/services/your-service/schemas.ts`
- ❌ Don't modify central files to register actions

Actions are **automatically registered** by the ServiceRegistry. No need to edit central files!

:::

## Overview

Actions in AREA represent triggers or events that occur in external services. When an action is triggered (via webhook, polling, or manual execution), it can activate one or more reactions. Actions define what data is available for reactions and how the trigger conditions are configured.

## Prerequisites

- Understanding of the service architecture
- Knowledge of TypeScript and JSON Schema
- Familiarity with the external service you're integrating
- Basic understanding of webhook or polling mechanisms

## Action Implementation Structure

### 1. Define Action Schema

First, create the configuration schema for your action:

**File**: `backend/src/services/services/your-service/schemas.ts`

```typescript
import type { ActionReactionSchema } from '../../../types/mapping';

export const yourServiceNewEventSchema: ActionReactionSchema = {
  name: 'Your Service New Event',
  description: 'Triggers when a new event occurs in Your Service',
  fields: [
    {
      name: 'resource_id',
      type: 'text',
      label: 'Resource ID',
      required: true,
      placeholder: 'resource-123',
      description: 'The ID of the resource to monitor',
    },
    {
      name: 'event_types',
      type: 'multiselect',
      label: 'Event Types',
      required: true,
      options: [
        { value: 'created', label: 'Created' },
        { value: 'updated', label: 'Updated' },
        { value: 'deleted', label: 'Deleted' },
      ],
      description: 'Types of events to monitor',
    },
    {
      name: 'filter_tags',
      type: 'text',
      label: 'Filter Tags (optional)',
      required: false,
      placeholder: 'tag1,tag2',
      description: 'Comma-separated list of tags to filter events',
    },
    {
      name: 'priority_level',
      type: 'select',
      label: 'Priority Level',
      required: false,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
      ],
      default: 'medium',
      description: 'Minimum priority level to trigger',
    },
  ],
};

export const yourServiceStatusChangeSchema: ActionReactionSchema = {
  name: 'Your Service Status Change',
  description: 'Triggers when the status of an item changes',
  fields: [
    {
      name: 'item_id',
      type: 'text',
      label: 'Item ID',
      required: true,
      placeholder: 'item-456',
    },
    {
      name: 'from_status',
      type: 'select',
      label: 'From Status (optional)',
      required: false,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      description: 'Previous status (leave empty for any)',
    },
    {
      name: 'to_status',
      type: 'select',
      label: 'To Status',
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      description: 'New status to trigger on',
    },
  ],
};
```

### 2. Create Action Definitions

Define your actions with their input schemas and metadata:

**File**: `backend/src/services/services/your-service/actions.ts`

```typescript
import type { ActionDefinition } from '../../../types/service';
import {
  yourServiceNewEventSchema,
  yourServiceStatusChangeSchema,
} from './schemas';

export const yourServiceActions: ActionDefinition[] = [
  {
    id: 'yourservice.new_event',
    name: 'New Event',
    description: 'Triggers when a new event occurs in Your Service',
    configSchema: yourServiceNewEventSchema,
    inputSchema: {
      type: 'object',
      properties: {
        event: {
          type: 'object',
          description: 'Event details',
          properties: {
            id: { type: 'string', description: 'Event ID' },
            type: { type: 'string', description: 'Event type' },
            resource_id: { type: 'string', description: 'Resource ID' },
            resource_type: { type: 'string', description: 'Resource type' },
            title: { type: 'string', description: 'Event title' },
            description: { type: 'string', description: 'Event description' },
            priority: { type: 'string', description: 'Event priority' },
            tags: {
              type: 'array',
              description: 'Event tags',
              items: { type: 'string' },
            },
            metadata: {
              type: 'object',
              description: 'Additional event metadata',
              additionalProperties: true,
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Event timestamp',
            },
          },
          required: ['id', 'type', 'resource_id', 'timestamp'],
        },
        user: {
          type: 'object',
          description: 'User who triggered the event',
          properties: {
            id: { type: 'string', description: 'User ID' },
            username: { type: 'string', description: 'Username' },
            email: { type: 'string', description: 'User email' },
            display_name: { type: 'string', description: 'Display name' },
          },
          required: ['id', 'username'],
        },
        service_context: {
          type: 'object',
          description: 'Service-specific context',
          properties: {
            workspace_id: { type: 'string', description: 'Workspace ID' },
            organization_id: { type: 'string', description: 'Organization ID' },
            api_version: { type: 'string', description: 'API version used' },
          },
        },
      },
      required: ['event', 'user'],
    },
    metadata: {
      category: 'Your Service',
      tags: ['events', 'notifications'],
      requiresAuth: true,
      supportsWebhooks: true,
      supportsPolling: true,
      estimatedFrequency: 'medium', // low, medium, high
      documentation: 'https://docs.yourservice.com/webhooks/events',
    },
  },
  {
    id: 'yourservice.status_change',
    name: 'Status Change',
    description: 'Triggers when the status of an item changes',
    configSchema: yourServiceStatusChangeSchema,
    inputSchema: {
      type: 'object',
      properties: {
        item: {
          type: 'object',
          description: 'Item that changed status',
          properties: {
            id: { type: 'string', description: 'Item ID' },
            title: { type: 'string', description: 'Item title' },
            type: { type: 'string', description: 'Item type' },
            url: { type: 'string', description: 'Item URL' },
          },
          required: ['id', 'title'],
        },
        status_change: {
          type: 'object',
          description: 'Status change details',
          properties: {
            from: { type: 'string', description: 'Previous status' },
            to: { type: 'string', description: 'New status' },
            reason: { type: 'string', description: 'Change reason' },
            changed_by: {
              type: 'object',
              description: 'User who made the change',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
              },
            },
            changed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Change timestamp',
            },
          },
          required: ['to', 'changed_at'],
        },
      },
      required: ['item', 'status_change'],
    },
    metadata: {
      category: 'Your Service',
      tags: ['status', 'workflow'],
      requiresAuth: true,
      supportsWebhooks: true,
      supportsPolling: false,
      estimatedFrequency: 'low',
    },
  },
];
```

### 3. Field Types Reference

The configuration schema supports various field types:

```typescript
// Text input
{
  name: 'field_name',
  type: 'text',
  label: 'Field Label',
  required: true,
  placeholder: 'Enter value...',
  description: 'Field description',
  validation: {
    minLength: 1,
    maxLength: 255,
    pattern: '^[a-zA-Z0-9]+$', // regex pattern
  }
}

// Number input
{
  name: 'numeric_field',
  type: 'number',
  label: 'Numeric Field',
  required: false,
  default: 0,
  validation: {
    min: 0,
    max: 100,
  }
}

// Select dropdown
{
  name: 'status',
  type: 'select',
  label: 'Status',
  required: true,
  options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
  default: 'active',
}

// Multi-select
{
  name: 'categories',
  type: 'multiselect',
  label: 'Categories',
  required: false,
  options: [
    { value: 'cat1', label: 'Category 1' },
    { value: 'cat2', label: 'Category 2' },
  ],
}

// Boolean checkbox
{
  name: 'enabled',
  type: 'boolean',
  label: 'Enabled',
  required: false,
  default: true,
}

// Date/time picker
{
  name: 'schedule_time',
  type: 'datetime',
  label: 'Schedule Time',
  required: false,
}

// Password field
{
  name: 'api_key',
  type: 'password',
  label: 'API Key',
  required: true,
  description: 'Your service API key',
}

// Textarea
{
  name: 'description',
  type: 'textarea',
  label: 'Description',
  required: false,
  placeholder: 'Enter description...',
  validation: {
    maxLength: 1000,
  }
}
```

### 4. Action Metadata Properties

```typescript
interface ActionMetadata {
  category: string;           // UI category grouping
  tags: string[];            // Searchable tags
  requiresAuth: boolean;     // Requires user authentication
  supportsWebhooks: boolean; // Can receive webhooks
  supportsPolling: boolean;  // Can be polled periodically
  estimatedFrequency: 'low' | 'medium' | 'high'; // Expected trigger frequency
  documentation?: string;    // Link to external documentation
  limitations?: string[];    // Known limitations
  examples?: Array<{        // Usage examples
    title: string;
    description: string;
    config: Record<string, any>;
  }>;
}
```

### 5. Input Schema Best Practices

```typescript
// Well-structured input schema
inputSchema: {
  type: 'object',
  properties: {
    // Main event data
    event: {
      type: 'object',
      properties: {
        // Always include these base fields
        id: { type: 'string', description: 'Unique event identifier' },
        timestamp: { type: 'string', format: 'date-time' },
        type: { type: 'string', description: 'Event type' },

        // Service-specific fields
        title: { type: 'string' },
        description: { type: 'string' },
        url: { type: 'string', format: 'uri' },

        // Nested objects for complex data
        author: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },

        // Arrays for lists
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Associated tags',
        },

        // Flexible metadata object
        metadata: {
          type: 'object',
          additionalProperties: true,
          description: 'Additional event data',
        },
      },
      required: ['id', 'timestamp', 'type'],
    },

    // Context information
    context: {
      type: 'object',
      properties: {
        service_name: { type: 'string' },
        api_version: { type: 'string' },
        webhook_id: { type: 'string' },
      },
    },
  },
  required: ['event'],
}
```

## Example: Complete Action Implementation

Here's a complete example of implementing a Discord message action:

### Schema Definition

```typescript
// backend/src/services/services/discord/schemas.ts
export const discordNewMessageSchema: ActionReactionSchema = {
  name: 'Discord New Message',
  description: 'Triggers when a new message is posted in a Discord channel',
  fields: [
    {
      name: 'channel_id',
      type: 'text',
      label: 'Channel ID',
      required: true,
      placeholder: '123456789012345678',
      description: 'Discord channel ID to monitor',
    },
    {
      name: 'user_filter',
      type: 'text',
      label: 'User Filter (optional)',
      required: false,
      placeholder: '@username or user ID',
      description: 'Only trigger for messages from specific user',
    },
    {
      name: 'content_contains',
      type: 'text',
      label: 'Content Contains (optional)',
      required: false,
      placeholder: 'keyword',
      description: 'Only trigger if message contains this text',
    },
    {
      name: 'ignore_bots',
      type: 'boolean',
      label: 'Ignore Bot Messages',
      required: false,
      default: true,
      description: 'Ignore messages from bot users',
    },
  ],
};
```

### Action Definition

```typescript
// backend/src/services/services/discord/actions.ts
export const discordActions: ActionDefinition[] = [
  {
    id: 'discord.new_message',
    name: 'New Message',
    description: 'Triggers when a new message is posted in a Discord channel',
    configSchema: discordNewMessageSchema,
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Message ID' },
            content: { type: 'string', description: 'Message content' },
            channel_id: { type: 'string', description: 'Channel ID' },
            guild_id: { type: 'string', description: 'Server ID' },
            timestamp: { type: 'string', format: 'date-time' },
            author: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                discriminator: { type: 'string' },
                avatar: { type: 'string' },
                bot: { type: 'boolean' },
              },
            },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  filename: { type: 'string' },
                  url: { type: 'string' },
                  size: { type: 'number' },
                },
              },
            },
            embeds: {
              type: 'array',
              items: { type: 'object' },
            },
          },
          required: ['id', 'content', 'channel_id', 'author', 'timestamp'],
        },
        channel: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'number' },
          },
        },
        guild: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
      required: ['message'],
    },
    metadata: {
      category: 'Discord',
      tags: ['chat', 'messages', 'communication'],
      requiresAuth: true,
      supportsWebhooks: true,
      supportsPolling: false,
      estimatedFrequency: 'high',
      examples: [
        {
          title: 'Monitor support channel',
          description: 'Trigger when messages are posted in #support',
          config: {
            channel_id: '123456789012345678',
            ignore_bots: true,
          },
        },
        {
          title: 'Alert on urgent messages',
          description: 'Trigger when messages contain "urgent" or "emergency"',
          config: {
            channel_id: '123456789012345678',
            content_contains: 'urgent',
            ignore_bots: true,
          },
        },
      ],
    },
  },
];
```

## Integration with Service

### Register Actions in Service

```typescript
// backend/src/services/services/discord/index.ts
import type { Service } from '../../../types/service';
import { discordActions } from './actions';
import { discordReactions } from './reactions';

const discordService: Service = {
  id: 'discord',
  name: 'Discord',
  description: 'Discord chat and communication service',
  version: '1.0.0',
  actions: discordActions,
  reactions: discordReactions,
};

export default discordService;
```

### Webhook Handler Integration

When using webhooks, your webhook handler should transform the incoming data to match your action's input schema:

```typescript
// backend/src/webhooks/discord/index.ts
import { executionService } from '../../services/ExecutionService';

export class DiscordWebhookHandler {
  async handle(req: Request, res: Response): Promise<void> {
    const payload = req.body;

    // Transform Discord webhook payload to action input format
    const actionInput = {
      message: {
        id: payload.id,
        content: payload.content,
        channel_id: payload.channel_id,
        guild_id: payload.guild_id,
        timestamp: payload.timestamp,
        author: payload.author,
        attachments: payload.attachments || [],
        embeds: payload.embeds || [],
      },
      channel: payload.channel,
      guild: payload.guild,
    };

    // Trigger action processing
    await executionService.processAction('discord.new_message', actionInput);

    res.status(200).json({ received: true });
  }
}
```

## Testing Actions

### Unit Tests

```typescript
// backend/tests/services/discord/actions.test.ts
import { discordActions } from '../../../src/services/services/discord/actions';

describe('Discord Actions', () => {
  describe('new_message action', () => {
    it('should have correct structure', () => {
      const action = discordActions.find(a => a.id === 'discord.new_message');

      expect(action).toBeDefined();
      expect(action?.name).toBe('New Message');
      expect(action?.configSchema.fields).toHaveLength(4);
      expect(action?.metadata.requiresAuth).toBe(true);
    });

    it('should validate input schema', () => {
      const action = discordActions.find(a => a.id === 'discord.new_message');
      const validInput = {
        message: {
          id: '123',
          content: 'Test message',
          channel_id: '456',
          author: { id: '789', username: 'test' },
          timestamp: '2023-01-01T00:00:00Z',
        },
      };

      // Test input validation using a JSON schema validator
      // expect(validateSchema(action.inputSchema, validInput)).toBe(true);
    });
  });
});
```

### Integration Tests

```typescript
// Test action execution
describe('Action Execution', () => {
  it('should process action correctly', async () => {
    const actionInput = {
      message: {
        id: '123456',
        content: 'Hello world!',
        channel_id: '789012',
        author: { id: '345678', username: 'testuser' },
        timestamp: new Date().toISOString(),
      },
    };

    const result = await executionService.processAction(
      'discord.new_message',
      actionInput
    );

    expect(result.success).toBe(true);
  });
});
```

## Best Practices

:::tip Action Development Best Practices

1. **Clear Naming**: Use descriptive action IDs and names
2. **Comprehensive Schemas**: Define complete input/output schemas
3. **Proper Validation**: Validate all configuration inputs
4. **Good Documentation**: Provide clear descriptions and examples
5. **Error Handling**: Handle edge cases gracefully
6. **Testing**: Write comprehensive tests for all scenarios
7. **Webhook Security**: Verify webhook signatures when applicable
8. **Rate Limiting**: Consider API rate limits for polling actions
9. **Data Privacy**: Only capture necessary data in input schemas
10. **Backwards Compatibility**: Version your schemas appropriately

:::

### Schema Design Guidelines

```typescript
// Good: Structured, typed, documented
{
  type: 'object',
  properties: {
    user: {
      type: 'object',
      description: 'User information',
      properties: {
        id: { type: 'string', description: 'Unique user ID' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string' },
      },
      required: ['id', 'email'],
    },
  },
  required: ['user'],
}

// Avoid: Overly generic, unstructured
{
  type: 'object',
  properties: {
    data: { type: 'object', additionalProperties: true },
  },
}
```

## Common Action Patterns

### Polling-Based Actions

```typescript
// For services that don't support webhooks
{
  id: 'service.poll_updates',
  name: 'Poll for Updates',
  // ... other properties
  metadata: {
    // ...
    supportsWebhooks: false,
    supportsPolling: true,
    estimatedFrequency: 'medium',
    pollingInterval: 300000, // 5 minutes in milliseconds
  },
}
```

### Webhook-Based Actions

```typescript
// For real-time webhook events
{
  id: 'service.webhook_event',
  name: 'Webhook Event',
  // ... other properties
  metadata: {
    // ...
    supportsWebhooks: true,
    supportsPolling: false,
    estimatedFrequency: 'high',
    webhookEvents: ['created', 'updated', 'deleted'],
  },
}
```

### Conditional Actions

```typescript
// Actions with complex filtering
configSchema: {
  name: 'Conditional Event',
  description: 'Triggers based on conditions',
  fields: [
    {
      name: 'conditions',
      type: 'json',
      label: 'Trigger Conditions',
      required: true,
      description: 'JSON object defining trigger conditions',
      validation: {
        schema: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            operator: { type: 'string', enum: ['equals', 'contains', 'greater_than'] },
            value: { type: 'string' },
          },
        },
      },
    },
  ],
}
```

## Troubleshooting

### Common Issues

1. **Schema Validation Errors**: Check field types and requirements
2. **Input Schema Mismatches**: Ensure webhook data matches input schema
3. **Missing Authentication**: Verify action metadata includes `requiresAuth: true`
4. **Webhook Registration**: Ensure webhook endpoints are properly registered
5. **Data Transformation**: Check webhook payload transformation logic

### Debugging Tips

```typescript
// Add logging to webhook handlers
console.log('Raw webhook payload:', JSON.stringify(req.body, null, 2));
console.log('Transformed action input:', JSON.stringify(actionInput, null, 2));

// Validate input against schema
import Ajv from 'ajv';
const ajv = new Ajv();
const validate = ajv.compile(action.inputSchema);
const valid = validate(actionInput);
if (!valid) {
  console.log('Schema validation errors:', validate.errors);
}
```

## Next Steps

After creating your action:

1. Test with various input scenarios
2. Implement corresponding webhook handler (if needed)
3. Add comprehensive error handling
4. Create frontend UI components for configuration
5. Write user documentation and examples
6. Consider rate limiting and performance implications

For implementing the execution logic for reactions triggered by your actions, see [Create a Reaction](./create-a-reaction.md).
