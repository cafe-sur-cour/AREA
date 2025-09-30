# AREA Services Architecture

This document describes the modular architecture for implementing services with
actions and reactions in the AREA backend.

## Overview

The AREA platform allows users to create automation workflows by connecting
actions (triggers) to reactions (responses). Services are the building blocks
that provide these actions and reactions.

## Architecture Components

### 1. Service Interface

Each service implements the `Service` interface defined in
`src/types/service.ts`. A service represents an external platform or system.

### 2. Service Registry

The `ServiceRegistry` manages all registered services and provides methods to:

- Register/unregister services
- Find actions and reactions by type
- Validate action/reaction types

### 3. Service Loader

The `ServiceLoader` dynamically loads services from the `src/services/services/`
directory at startup.

### 4. Reaction Executor Registry

The `ReactionExecutorRegistry` manages reaction executors that implement the
actual execution logic for reactions.

## How to Add a New Service

### 1. Create Service Directory

Create a new directory under `src/services/services/` with your service name:

```
src/services/services/
└── your-service/
    └── index.ts
```

### 2. Implement the Service

Create `index.ts` that exports a `Service` object as default with actions and
reactions definitions.

### 3. Define Actions and Reactions

Actions define triggers with input schemas, reactions define responses with
output schemas. Both include configuration schemas and metadata.

For better modularity, consider separating schema definitions into a dedicated
file (e.g., `schemas.ts`) and actions/reactions into their own files (e.g.,
`actions.ts`, `reactions.ts`) within the service directory. This keeps
configuration data and definitions separate from the main service logic.

### 4. Implement Reaction Execution Logic

Each service that provides reactions must also provide an executor that
implements `ReactionExecutor`. The executor handles the actual API calls and
logic for each reaction type.

### 5. Export Both Service and Executor

```typescript
export default myService;
export { myExecutor as executor };
```

## Type Validation

The architecture enforces type validation:

- Action types must follow `service.action` format
- Reaction types must follow `service.reaction` format
- Unknown action/reaction types are logged as warnings

## Best Practices

1. **Modularity**: Keep each service in its own directory
2. **Schema Separation**: Separate action/reaction schemas into dedicated files (e.g., `schemas.ts`) for better organization
3. **Action/Reaction Separation**: For complex services, separate actions and reactions into `actions.ts` and `reactions.ts` files
4. **Validation**: Always validate input/output schemas
5. **Error Handling**: Implement proper error handling in execution logic
6. **Documentation**: Document all fields and their purposes
7. **Testing**: Test services independently before integration
8. **Security**: Never log sensitive configuration data

## Internationalization and Translation

The AREA platform supports multiple languages for service descriptions and user interfaces.

### Translation Files

Service names, descriptions, action names, and descriptions are stored in JSON files:
- `backend/locales/en.json` - English translations (default)
- `backend/locales/fr.json` - French translations

### Language Detection

The system automatically detects language from:
- `Accept-Language` HTTP header
- `?lang=` query parameter
- Falls back to English if translation missing

### Adding Translations

Add your service translations to both language files:

```json
{
  "services": {
    "your-service": {
      "name": "Your Service",
      "description": "Service description",
      "actions": {
        "your-service.action1": {
          "name": "Action Name",
          "description": "Action description"
        }
      },
      "reactions": {
        "your-service.reaction1": {
          "name": "Reaction Name",
          "description": "Reaction description"
        }
      }
    }
  }
}
```

## Integration with Execution Service

The `ExecutionService` automatically validates action and reaction types against
registered services and uses the appropriate executor for reaction execution.

## Webhook Integration

### Overview

Services can implement webhook-based actions that trigger when external events occur. The AREA platform provides a modular webhook system for receiving, validating, and processing webhook events from external services. Webhooks are loaded dynamically at startup using the `WebhookLoader`.

### How to Add Webhook Support to a Service

#### 1. Create Webhook Handler Directory

Create a new directory under `src/webhooks/` with your service name:

```
src/webhooks/
└── your-service/
    └── index.ts
```

#### 2. Implement the Webhook Handler

Create `index.ts` that exports a `WebhookHandler` instance as default:

```typescript
import { WebhookHandler } from '../../types/webhook';
import { AppDataSource } from '../../config/db';
import { WebhookEvents } from '../../config/entity/WebhookEvents';
import { ExternalWebhooks } from '../../config/entity/ExternalWebhooks';

class YourServiceWebhookHandler implements WebhookHandler {
  service = 'your-service';

  async handle(req: Request, res: Response): Promise<Response> {
    try {
      // Validate required headers
      const signature = req.headers['x-your-service-signature'] as string;
      const event = req.headers['x-your-service-event'] as string;

      if (!signature || !event) {
        return res.status(400).json({ error: 'Missing required headers' });
      }

      // Find webhook configuration
      const webhookUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const externalWebhook = await AppDataSource.getRepository(ExternalWebhooks).findOne({
        where: {
          url: webhookUrl,
          service: this.service,
          is_active: true,
        },
      });

      if (!externalWebhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      // Verify signature if secret configured
      if (externalWebhook.secret) {
        const expectedSignature = this.generateSignature(req.body, externalWebhook.secret);
        if (!this.verifySignature(signature, expectedSignature)) {
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }

      // Determine action type from event
      const actionType = this.getActionTypeFromEvent(event, req.body);
      if (!actionType) {
        console.log(`⚠️  [${this.service.toUpperCase()} Webhook] Unsupported event: ${event}`);
        return res.status(200).json({ message: 'Event not supported' });
      }

      // Store webhook event
      const webhookEvent = new WebhookEvents();
      webhookEvent.action_type = actionType;
      webhookEvent.user_id = externalWebhook.user_id;
      webhookEvent.source = this.service;
      webhookEvent.payload = req.body;
      webhookEvent.status = 'received';
      webhookEvent.signature_verified = !!externalWebhook.secret;

      await AppDataSource.getRepository(WebhookEvents).save(webhookEvent);

      // Update last triggered
      externalWebhook.last_triggered_at = new Date();
      await AppDataSource.getRepository(ExternalWebhooks).save(externalWebhook);

      console.log(`✅ [${this.service.toUpperCase()} Webhook] Event processed: ${actionType}`);

      return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error(`Error processing ${this.service} webhook:`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  private generateSignature(payload: any, secret: string): string {
    // Implement signature generation logic for your service
    return 'signature';
  }

  private verifySignature(received: string, expected: string): boolean {
    // Implement signature verification logic
    return received === expected;
  }

  private getActionTypeFromEvent(event: string, payload: Record<string, unknown>): string | null {
    // Map events to action types
    switch (event) {
      case 'event1':
        return `${this.service}.event1`;
      case 'event2':
        return `${this.service}.event2`;
      default:
        return null;
    }
  }
}

export default new YourServiceWebhookHandler();
```

#### 3. Define Webhook Actions

Create actions that correspond to webhook events in your service's `actions.ts`:

```typescript
export const webhookActions: ActionDefinition[] = [
  {
    id: 'your-service.event1',
    name: 'Event 1 Trigger',
    description: 'Triggers when event1 occurs',
    configSchema: webhookConfigSchema,
    inputSchema: event1InputSchema,
    metadata: {
      category: 'Webhooks',
      tags: ['automation', 'events'],
      requiresAuth: true,
      webhookPattern: 'your-service.event1'
    }
  }
];
```

#### 4. Optional: Initialize/Cleanup Logic

If your webhook handler needs initialization (e.g., setting up connections) or cleanup:

```typescript
export const initialize = async (config: WebhookConfig): Promise<void> => {
  // Initialization logic
  console.log(`Initializing ${config.credentials?.service_name} webhook handler`);
};

export const cleanup = async (): Promise<void> => {
  // Cleanup logic
  console.log('Cleaning up webhook handler');
};
```

### Webhook Configuration API

#### Create a Webhook

```bash
POST /api/your-service/webhooks
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "config": {
    "target": "resource-identifier",
    "events": ["event1", "event2"]
  },
  "secret": "optional-custom-secret"
}
```

#### List User Webhooks

```bash
GET /api/your-service/webhooks
Authorization: Bearer <user_token>
```

#### Delete a Webhook

```bash
DELETE /api/your-service/webhooks/{webhook_id}
Authorization: Bearer <user_token>
```

### Webhook Event Processing Flow

```
1. External service sends webhook to /webhooks/your-service
   ↓
2. WebhookLoader routes to YourServiceWebhookHandler.handle()
   ↓
3. Handler validates signature and processes event
   ↓
4. Event stored as WebhookEvent in database
   ↓
5. ExecutionService processes event
   ↓
6. Matching action-reaction mappings are triggered
   ↓
7. Reactions execute with event data
```

### Automatic Loading

The `WebhookLoader` automatically discovers and loads all webhook handlers from `src/webhooks/` at startup. No manual registration required.
