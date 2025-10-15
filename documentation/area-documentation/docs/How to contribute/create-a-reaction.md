---
sidebar_position: 6
---

# Create a Reaction

This guide explains how to create reactions (response actions) for services in the AREA platform. Reactions are executed in response to triggered actions and perform specific operations in external services.

:::tip 🎯 Modular Architecture

Reactions should be defined **inside your service folder**:
- ✅ Place reactions in: `/backend/src/services/services/your-service/reactions.ts`
- ✅ Place schemas in: `/backend/src/services/services/your-service/schemas.ts`
- ✅ Place executor in: `/backend/src/services/services/your-service/executor.ts`
- ❌ Don't modify central files to register reactions

Reactions are **automatically registered** by the ServiceRegistry. No need to edit central files!

:::

## Overview

Reactions in AREA represent the response actions that are executed when an automation workflow is triggered. They receive data from actions and perform operations like creating issues, sending messages, updating records, or calling external APIs. Each reaction requires both a definition (schema and metadata) and an executor (implementation logic).

## Prerequisites

- Understanding of the service architecture and action/reaction flow
- Knowledge of TypeScript and JSON Schema
- API documentation for the external service
- Understanding of the executor pattern

## Reaction Implementation Structure

### 1. Define Reaction Schema

Create the configuration schema for your reaction:

**File**: `backend/src/services/services/your-service/schemas.ts`

```typescript
import type { ActionReactionSchema } from '../../../types/mapping';

export const yourServiceCreateItemSchema: ActionReactionSchema = {
  name: 'Create Item',
  description: 'Creates a new item in Your Service',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Item Title',
      required: true,
      placeholder: 'Enter item title...',
      description: 'The title of the item to create',
      validation: {
        minLength: 1,
        maxLength: 255,
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Item Description',
      required: false,
      placeholder: 'Enter item description...',
      description: 'Detailed description of the item',
      validation: {
        maxLength: 2000,
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      required: true,
      options: [
        { value: 'bug', label: 'Bug Report' },
        { value: 'feature', label: 'Feature Request' },
        { value: 'task', label: 'Task' },
        { value: 'improvement', label: 'Improvement' },
      ],
      default: 'task',
      description: 'Item category',
    },
    {
      name: 'priority',
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
    },
    {
      name: 'assignees',
      type: 'multiselect',
      label: 'Assignees',
      required: false,
      options: [], // Will be populated dynamically from API
      description: 'Users to assign this item to',
    },
    {
      name: 'labels',
      type: 'text',
      label: 'Labels',
      required: false,
      placeholder: 'label1,label2,label3',
      description: 'Comma-separated list of labels',
    },
    {
      name: 'due_date',
      type: 'datetime',
      label: 'Due Date',
      required: false,
      description: 'When this item should be completed',
    },
    {
      name: 'use_template',
      type: 'boolean',
      label: 'Use Template',
      required: false,
      default: false,
      description: 'Apply predefined template formatting',
    },
  ],
};

export const yourServiceSendNotificationSchema: ActionReactionSchema = {
  name: 'Send Notification',
  description: 'Sends a notification message',
  fields: [
    {
      name: 'recipient',
      type: 'text',
      label: 'Recipient',
      required: true,
      placeholder: 'user@example.com or @username',
      description: 'Who should receive the notification',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      required: true,
      placeholder: 'Your notification message...',
      description: 'The message content to send',
      validation: {
        minLength: 1,
        maxLength: 1000,
      },
    },
    {
      name: 'notification_type',
      type: 'select',
      label: 'Notification Type',
      required: false,
      options: [
        { value: 'info', label: 'Information' },
        { value: 'warning', label: 'Warning' },
        { value: 'error', label: 'Error' },
        { value: 'success', label: 'Success' },
      ],
      default: 'info',
    },
    {
      name: 'include_attachments',
      type: 'boolean',
      label: 'Include Attachments',
      required: false,
      default: false,
      description: 'Include any available attachments from the trigger',
    },
  ],
};
```

### 2. Create Reaction Definitions

Define your reactions with their output schemas and metadata:

**File**: `backend/src/services/services/your-service/reactions.ts`

```typescript
import type { ReactionDefinition } from '../../../types/service';
import {
  yourServiceCreateItemSchema,
  yourServiceSendNotificationSchema,
} from './schemas';

export const yourServiceReactions: ReactionDefinition[] = [
  {
    id: 'yourservice.create_item',
    name: 'Create Item',
    description: 'Creates a new item in Your Service',
    configSchema: yourServiceCreateItemSchema,
    outputSchema: {
      type: 'object',
      properties: {
        item: {
          type: 'object',
          description: 'The created item details',
          properties: {
            id: { type: 'string', description: 'Item ID' },
            title: { type: 'string', description: 'Item title' },
            description: { type: 'string', description: 'Item description' },
            category: { type: 'string', description: 'Item category' },
            priority: { type: 'string', description: 'Priority level' },
            status: { type: 'string', description: 'Current status' },
            url: { type: 'string', format: 'uri', description: 'Item URL' },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            assignees: {
              type: 'array',
              description: 'Assigned users',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
            labels: {
              type: 'array',
              description: 'Applied labels',
              items: { type: 'string' },
            },
          },
          required: ['id', 'title', 'category', 'status', 'url', 'created_at'],
        },
        success: {
          type: 'boolean',
          description: 'Whether the creation was successful',
        },
        message: {
          type: 'string',
          description: 'Success or error message',
        },
      },
      required: ['item', 'success'],
    },
    metadata: {
      category: 'Your Service',
      tags: ['create', 'item', 'management'],
      requiresAuth: true,
      estimatedDuration: 3000, // milliseconds
      rateLimits: {
        perMinute: 60,
        perHour: 1000,
      },
      examples: [
        {
          title: 'Create bug report',
          description: 'Create a bug report from GitHub issue',
          config: {
            title: 'Bug: {{action.issue.title}}',
            description: '{{action.issue.body}}',
            category: 'bug',
            priority: 'high',
            labels: 'github,bug,imported',
          },
        },
      ],
    },
  },
  {
    id: 'yourservice.send_notification',
    name: 'Send Notification',
    description: 'Sends a notification message to a user or channel',
    configSchema: yourServiceSendNotificationSchema,
    outputSchema: {
      type: 'object',
      properties: {
        notification: {
          type: 'object',
          description: 'Sent notification details',
          properties: {
            id: { type: 'string', description: 'Notification ID' },
            recipient: { type: 'string', description: 'Message recipient' },
            message: { type: 'string', description: 'Sent message content' },
            type: { type: 'string', description: 'Notification type' },
            sent_at: {
              type: 'string',
              format: 'date-time',
              description: 'Sent timestamp',
            },
            delivery_status: {
              type: 'string',
              enum: ['sent', 'delivered', 'failed'],
              description: 'Delivery status',
            },
          },
          required: ['id', 'recipient', 'message', 'sent_at', 'delivery_status'],
        },
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
      required: ['notification', 'success'],
    },
    metadata: {
      category: 'Your Service',
      tags: ['notification', 'messaging', 'communication'],
      requiresAuth: true,
      estimatedDuration: 1500,
      rateLimits: {
        perMinute: 100,
        perHour: 5000,
      },
    },
  },
];
```

### 3. Implement Reaction Executor

Create the executor that handles the actual API calls and logic:

**File**: `backend/src/services/services/your-service/executor.ts`

```typescript
import fetch from 'node-fetch';
import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

interface YourServiceItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  url: string;
  created_at: string;
  assignees: Array<{
    id: string;
    username: string;
    email: string;
  }>;
  labels: string[];
}

interface YourServiceNotification {
  id: string;
  recipient: string;
  message: string;
  type: string;
  sent_at: string;
  delivery_status: 'sent' | 'delivered' | 'failed';
}

export class YourServiceReactionExecutor implements ReactionExecutor {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.SERVICE_YOURSERVICE_API_BASE_URL || 'https://api.yourservice.com';
  }

  async execute(context: ReactionExecutionContext): Promise<ReactionExecutionResult> {
    const { reaction, serviceConfig, actionData } = context;

    try {
      // Get user's access token
      const accessToken = await this.getUserAccessToken(serviceConfig.user_id);

      if (!accessToken) {
        return {
          success: false,
          error: 'No access token found for Your Service',
          data: null,
        };
      }

      // Route to appropriate handler based on reaction type
      switch (reaction.type) {
        case 'yourservice.create_item':
          return await this.createItem(reaction.config, actionData, accessToken);

        case 'yourservice.send_notification':
          return await this.sendNotification(reaction.config, actionData, accessToken);

        default:
          return {
            success: false,
            error: `Unknown reaction type: ${reaction.type}`,
            data: null,
          };
      }
    } catch (error) {
      console.error('YourService reaction execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  }

  private async createItem(
    config: Record<string, any>,
    actionData: any,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    try {
      // Process template variables in configuration
      const processedConfig = this.processTemplateVariables(config, actionData);

      // Prepare item data
      const itemData = {
        title: processedConfig.title,
        description: processedConfig.description || '',
        category: processedConfig.category,
        priority: processedConfig.priority || 'medium',
        labels: processedConfig.labels
          ? processedConfig.labels.split(',').map((l: string) => l.trim())
          : [],
        assignees: processedConfig.assignees || [],
        due_date: processedConfig.due_date || null,
        use_template: processedConfig.use_template || false,
      };

      // Make API request to create item
      const response = await fetch(`${this.apiBaseUrl}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AREA-Platform/1.0',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorData}`);
      }

      const createdItem: YourServiceItem = await response.json();

      return {
        success: true,
        data: {
          item: createdItem,
          success: true,
          message: 'Item created successfully',
        },
        metadata: {
          executionTime: Date.now(),
          apiResponse: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create item',
        data: null,
      };
    }
  }

  private async sendNotification(
    config: Record<string, any>,
    actionData: any,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    try {
      const processedConfig = this.processTemplateVariables(config, actionData);

      const notificationData = {
        recipient: processedConfig.recipient,
        message: processedConfig.message,
        type: processedConfig.notification_type || 'info',
        include_attachments: processedConfig.include_attachments || false,
        // Include attachments from action data if requested
        attachments: processedConfig.include_attachments
          ? this.extractAttachments(actionData)
          : [],
      };

      const response = await fetch(`${this.apiBaseUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Notification API failed: ${response.status} ${errorData}`);
      }

      const sentNotification: YourServiceNotification = await response.json();

      return {
        success: true,
        data: {
          notification: sentNotification,
          success: true,
          message: 'Notification sent successfully',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
        data: null,
      };
    }
  }

  /**
   * Process template variables in configuration values
   * Supports syntax like {{action.field.subfield}}
   */
  private processTemplateVariables(config: Record<string, any>, actionData: any): Record<string, any> {
    const processed = { ...config };

    for (const [key, value] of Object.entries(processed)) {
      if (typeof value === 'string') {
        processed[key] = this.interpolateTemplate(value, actionData);
      }
    }

    return processed;
  }

  private interpolateTemplate(template: string, data: any): string {
    return template.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private extractAttachments(actionData: any): any[] {
    // Extract attachments from action data
    if (actionData.attachments && Array.isArray(actionData.attachments)) {
      return actionData.attachments;
    }

    if (actionData.message && actionData.message.attachments) {
      return actionData.message.attachments;
    }

    return [];
  }

  private async getUserAccessToken(userId: number): Promise<string | null> {
    const tokenRepo = AppDataSource.getRepository(UserToken);
    const userToken = await tokenRepo.findOne({
      where: { user_id: userId, service: 'yourservice' },
    });

    if (!userToken || !userToken.access_token) {
      return null;
    }

    // Check if token is expired and refresh if needed
    if (userToken.expires_at && userToken.expires_at < new Date()) {
      try {
        await this.refreshAccessToken(userToken);
        return userToken.access_token;
      } catch (error) {
        console.error('Failed to refresh access token:', error);
        return null;
      }
    }

    return userToken.access_token;
  }

  private async refreshAccessToken(userToken: UserToken): Promise<void> {
    if (!userToken.refresh_token) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.apiBaseUrl}/oauth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: userToken.refresh_token,
        client_id: process.env.SERVICE_YOURSERVICE_CLIENT_ID,
        client_secret: process.env.SERVICE_YOURSERVICE_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const tokenData = await response.json();

    // Update token in database
    const tokenRepo = AppDataSource.getRepository(UserToken);
    userToken.access_token = tokenData.access_token;
    userToken.refresh_token = tokenData.refresh_token || userToken.refresh_token;
    userToken.expires_at = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    await tokenRepo.save(userToken);
  }
}

export const yourServiceReactionExecutor = new YourServiceReactionExecutor();
```

### 4. Register Executor

Register the executor in the reaction executor registry:

**File**: `backend/src/services/services/your-service/index.ts`

```typescript
import type { Service } from '../../../types/service';
import { yourServiceActions } from './actions';
import { yourServiceReactions } from './reactions';
import { yourServiceReactionExecutor } from './executor';

const yourService: Service = {
  id: 'yourservice',
  name: 'Your Service',
  description: 'Integration with Your Service platform',
  version: '1.0.0',
  actions: yourServiceActions,
  reactions: yourServiceReactions,
};

export default yourService;

// Export the executor for registration
export { yourServiceReactionExecutor as executor };

export async function initialize(): Promise<void> {
  console.log('Initializing Your Service...');
  // Any initialization logic here
  console.log('Your Service initialized');
}

export async function cleanup(): Promise<void> {
  console.log('Cleaning up Your Service...');
  // Any cleanup logic here
  console.log('Your Service cleaned up');
}
```

## Template Variable System

### Supported Template Syntax

```typescript
// Basic field access
"{{action.field}}" // Access action data field

// Nested object access
"{{action.user.name}}" // Access nested properties

// Array access
"{{action.commits.0.message}}" // Access first commit message

// Date formatting (if implemented)
"{{action.timestamp | date:YYYY-MM-DD}}" // Format date

// Conditional values (if implemented)
"{{action.priority || 'medium'}}" // Default value if empty
```

### Example Template Usage

```typescript
// In reaction configuration
{
  title: "New issue: {{action.issue.title}}",
  description: `
    Issue created by {{action.issue.author.name}}

    Original content:
    {{action.issue.body}}

    Labels: {{action.issue.labels}}
    Created: {{action.issue.created_at}}
  `,
  labels: "github,automated,{{action.issue.priority}}",
  assignees: ["{{action.issue.author.login}}"],
}
```

## Error Handling and Retry Logic

### Robust Error Handling

```typescript
async execute(context: ReactionExecutionContext): Promise<ReactionExecutionResult> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await this.executeWithRetry(context);
    } catch (error) {
      attempt++;

      if (this.isRetryableError(error)) {
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          continue;
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        metadata: {
          attempts: attempt,
          retryable: this.isRetryableError(error),
        },
      };
    }
  }
}

private isRetryableError(error: any): boolean {
  // Network errors, rate limits, temporary service errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  if (error.status === 429 || error.status === 502 || error.status === 503) {
    return true;
  }

  return false;
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Rate Limiting Handling

```typescript
private async handleRateLimit(response: any): Promise<void> {
  const retryAfter = response.headers.get('retry-after');
  const resetTime = response.headers.get('x-ratelimit-reset');

  if (retryAfter) {
    const delay = parseInt(retryAfter) * 1000;
    await this.delay(delay);
  } else if (resetTime) {
    const resetTimestamp = parseInt(resetTime) * 1000;
    const delay = resetTimestamp - Date.now();
    if (delay > 0) {
      await this.delay(delay);
    }
  } else {
    // Default delay
    await this.delay(60000); // 1 minute
  }
}
```

## Testing Reactions

### Unit Tests

```typescript
// backend/tests/services/yourservice/executor.test.ts
import { YourServiceReactionExecutor } from '../../../src/services/services/yourservice/executor';

describe('YourService Reaction Executor', () => {
  let executor: YourServiceReactionExecutor;

  beforeEach(() => {
    executor = new YourServiceReactionExecutor();
  });

  describe('createItem', () => {
    it('should create item successfully', async () => {
      const context = {
        reaction: {
          type: 'yourservice.create_item',
          config: {
            title: 'Test Item',
            description: 'Test description',
            category: 'task',
          },
        },
        serviceConfig: { user_id: 1 },
        actionData: {},
      };

      // Mock API response
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: '123',
          title: 'Test Item',
          category: 'task',
          status: 'open',
          url: 'https://service.com/items/123',
          created_at: '2023-01-01T00:00:00Z',
          assignees: [],
          labels: [],
        }),
      });

      global.fetch = mockFetch;

      const result = await executor.execute(context);

      expect(result.success).toBe(true);
      expect(result.data?.item.id).toBe('123');
    });

    it('should handle template variables', async () => {
      const context = {
        reaction: {
          type: 'yourservice.create_item',
          config: {
            title: 'Issue: {{action.issue.title}}',
            description: '{{action.issue.body}}',
          },
        },
        serviceConfig: { user_id: 1 },
        actionData: {
          issue: {
            title: 'Bug Report',
            body: 'Something is broken',
          },
        },
      };

      // Mock successful response
      // ... test implementation
    });
  });
});
```

### Integration Tests

```typescript
// Test full reaction execution flow
describe('Reaction Integration', () => {
  it('should execute reaction end-to-end', async () => {
    // Set up test data
    const actionInput = { /* action data */ };
    const reactionConfig = { /* reaction config */ };

    // Trigger action
    await executionService.processAction('github.push', actionInput);

    // Verify reaction was executed
    // Check external service for created items
  });
});
```

## Best Practices

:::tip Reaction Development Best Practices

1. **Idempotency**: Make reactions idempotent when possible
2. **Error Handling**: Implement comprehensive error handling and retries
3. **Rate Limiting**: Respect API rate limits and implement backoff
4. **Template Processing**: Support flexible template variables
5. **Validation**: Validate all configuration and input data
6. **Logging**: Log execution details for debugging
7. **Testing**: Write comprehensive unit and integration tests
8. **Documentation**: Provide clear examples and use cases
9. **Security**: Secure API credentials and validate inputs
10. **Performance**: Optimize for execution speed and reliability

:::

### Configuration Validation

```typescript
private validateConfig(config: Record<string, any>, schema: ActionReactionSchema): boolean {
  for (const field of schema.fields) {
    if (field.required && !config[field.name]) {
      throw new Error(`Required field missing: ${field.name}`);
    }

    if (field.validation) {
      if (field.validation.minLength && config[field.name].length < field.validation.minLength) {
        throw new Error(`Field ${field.name} is too short`);
      }

      if (field.validation.maxLength && config[field.name].length > field.validation.maxLength) {
        throw new Error(`Field ${field.name} is too long`);
      }
    }
  }

  return true;
}
```

## Advanced Features

### Batch Operations

```typescript
// Support for batch reactions
async executeBatch(contexts: ReactionExecutionContext[]): Promise<ReactionExecutionResult[]> {
  const results: ReactionExecutionResult[] = [];

  // Group by reaction type for optimization
  const grouped = this.groupByReactionType(contexts);

  for (const [reactionType, typeContexts] of grouped) {
    if (this.supportsBatchOperation(reactionType)) {
      const batchResult = await this.executeBatchOperation(reactionType, typeContexts);
      results.push(...batchResult);
    } else {
      // Execute individually
      for (const context of typeContexts) {
        const result = await this.execute(context);
        results.push(result);
      }
    }
  }

  return results;
}
```

### Webhook Response Actions

```typescript
// Reactions that respond to webhook events
async executeWebhookResponse(
  webhookPayload: any,
  responseConfig: Record<string, any>
): Promise<ReactionExecutionResult> {
  // Process webhook-specific logic
  const processedData = this.processWebhookData(webhookPayload);

  // Execute reaction with webhook context
  return await this.execute({
    reaction: { type: 'yourservice.webhook_response', config: responseConfig },
    serviceConfig: { user_id: processedData.user_id },
    actionData: processedData,
  });
}
```

## Common Reaction Patterns

### Create/Update Operations

```typescript
// CRUD operations
{
  id: 'service.create_record',
  name: 'Create Record',
  // ... schema and metadata
}

{
  id: 'service.update_record',
  name: 'Update Record',
  // ... schema and metadata
}
```

### Notification/Communication

```typescript
// Communication reactions
{
  id: 'service.send_message',
  name: 'Send Message',
  // ... schema and metadata
}

{
  id: 'service.post_update',
  name: 'Post Update',
  // ... schema and metadata
}
```

### Data Processing

```typescript
// Data transformation reactions
{
  id: 'service.transform_data',
  name: 'Transform Data',
  // ... schema and metadata
}

{
  id: 'service.aggregate_metrics',
  name: 'Aggregate Metrics',
  // ... schema and metadata
}
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**: Check token validity and refresh logic
2. **API Rate Limits**: Implement proper rate limiting and backoff
3. **Template Variable Errors**: Validate template syntax and data availability
4. **Network Timeouts**: Implement retry logic with exponential backoff
5. **Data Validation Errors**: Validate configuration and input data

### Debugging Tools

```typescript
// Add comprehensive logging
console.log('Executing reaction:', {
  type: reaction.type,
  config: reaction.config,
  actionData: JSON.stringify(actionData, null, 2),
  timestamp: new Date().toISOString(),
});

// Log API requests
console.log('API Request:', {
  url: apiUrl,
  method: 'POST',
  headers: headers,
  body: JSON.stringify(requestBody, null, 2),
});

// Log API responses
console.log('API Response:', {
  status: response.status,
  statusText: response.statusText,
  headers: Object.fromEntries(response.headers.entries()),
  body: responseBody,
});
```

## Next Steps

After implementing your reaction:

1. Test with various configuration scenarios
2. Implement comprehensive error handling
3. Add rate limiting and retry logic
4. Create frontend UI components for configuration
5. Write user documentation and examples
6. Monitor execution performance and reliability

For implementing the triggers that activate your reactions, see [Create an Action](./create-an-action.md).
