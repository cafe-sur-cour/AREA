---
sidebar_position: 3
---

# Create a Webhook

This guide explains how to implement webhook handlers for external services in the AREA platform. Webhooks enable real-time event processing from external services.

:::tip 🎯 Modular Architecture

Webhook handlers should be placed **inside your service folder**:
- ✅ Place webhooks in: `/backend/src/services/services/your-service/webhooks/`
- ❌ Don't create webhooks in central `/backend/src/webhooks/` folder

This keeps all service-specific code modular and maintainable.

:::

## Overview

Webhooks in AREA allow external services to notify the platform about events in real-time. When an event occurs (like a GitHub push or Discord message), the external service sends an HTTP POST request to your webhook endpoint, triggering automation workflows.

## Prerequisites

- Understanding of HTTP webhooks and event-driven architecture
- Knowledge of TypeScript and Express.js
- Familiarity with the service you're integrating
- Basic understanding of AREA's service architecture

## Webhook URL Configuration

### URL Format

When configuring webhooks on external services, you need to provide the webhook URL that the external service will call. AREA uses a standardized URL format for all webhook endpoints:

**Production URL Format:**
```
https://your-domain.com/api/webhooks/{service-name}
```

### Environment Configuration

Set the `WEBHOOK_BASE_URL` environment variable to match your production deployment:

```env
# Production
WEBHOOK_BASE_URL=https://your-domain.com
```

:::warning ⚠️ HTTPS Required

External services require HTTPS URLs for webhook endpoints. Ensure your production domain uses HTTPS.

:::

### Service-Specific URL Examples

For any service, use this pattern:
```
https://your-domain.com/api/webhooks/your-service-name
```

Replace `your-service-name` with your actual service identifier (lowercase, no spaces).

### URL Construction in Code

The webhook URL is automatically constructed in your webhook handler:

```typescript
getWebhookConfig(): WebhookConfig {
  return {
    url: `${process.env.WEBHOOK_BASE_URL}/api/webhooks/${this.id}`,
    secret: process.env.YOURSERVICE_WEBHOOK_SECRET || '',
    events: ['push', 'issue.opened'],
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AREA-Platform/1.0'
    }
  };
}
```

## Webhook Implementation Structure

### 1. Webhook Handler Class

Create a webhook handler for your service:

**File**: `backend/src/services/services/your-service/webhooks/index.ts` *(Modular approach)*

:::info ℹ️ Folder Location Update

In the new modular architecture, webhooks should be placed **inside the service folder**, not in a central webhooks directory. This ensures all service code is self-contained.

:::

**Old location** ❌: `backend/src/webhooks/your-service/index.ts`
**New location** ✅: `backend/src/services/services/your-service/webhooks/index.ts`

```typescript
import { Request, Response } from 'express';
import type { WebhookHandler, WebhookConfig } from '../../types/webhook';
import { executionService } from '../../services/ExecutionService';
import crypto from 'crypto';

export interface YourServiceWebhookPayload {
  event_type: string;
  timestamp: string;
  data: {
    // Define your service-specific data structure
    id: string;
    action: string;
    object: any;
  };
}

export class YourServiceWebhookHandler implements WebhookHandler {
  id = 'yourservice';
  name = 'YourService Webhook Handler';
  description = 'Handles webhooks from YourService';

  /**
   * Verify webhook signature for security
   */
  private verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    );
  }

  /**
   * Handle incoming webhook request
   */
  async handle(req: Request, res: Response): Promise<void> {
    try {
      // Extract signature from headers
      const signature = req.headers['x-yourservice-signature'] as string;
      const eventType = req.headers['x-yourservice-event'] as string;

      if (!signature || !eventType) {
        res.status(400).json({ error: 'Missing required headers' });
        return;
      }

      // Verify webhook signature
      const secret = process.env.YOURSERVICE_WEBHOOK_SECRET || '';
      const payload = JSON.stringify(req.body);

      if (!this.verifySignature(payload, signature, secret)) {
        console.warn('Invalid webhook signature from YourService');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Parse webhook payload
      const webhookPayload: YourServiceWebhookPayload = req.body;

      // Process the webhook based on event type
      await this.processWebhook(eventType, webhookPayload);

      // Acknowledge receipt
      res.status(200).json({ received: true });

    } catch (error) {
      console.error('YourService webhook processing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Process webhook payload and trigger automations
   */
  private async processWebhook(eventType: string, payload: YourServiceWebhookPayload): Promise<void> {
    // Map webhook event to AREA action type
    const actionType = this.mapEventToAction(eventType);

    if (!actionType) {
      console.log(`Unhandled YourService event type: ${eventType}`);
      return;
    }

    // Transform webhook payload to action input format
    const actionInput = this.transformPayload(eventType, payload);

    // Trigger execution service
    await executionService.processAction(actionType, actionInput);
  }

  /**
   * Map webhook event types to AREA action types
   */
  private mapEventToAction(eventType: string): string | null {
    const eventMap: Record<string, string> = {
      'push': 'yourservice.push',
      'issue.opened': 'yourservice.issue_opened',
      'pull_request.opened': 'yourservice.pull_request_opened',
      // Add more event mappings as needed
    };

    return eventMap[eventType] || null;
  }

  /**
   * Transform webhook payload to action input format
   */
  private transformPayload(eventType: string, payload: YourServiceWebhookPayload): any {
    // Transform the webhook payload to match your action's input schema
    switch (eventType) {
      case 'push':
        return {
          repository: payload.data.repository,
          commits: payload.data.commits,
          pusher: payload.data.pusher,
          timestamp: payload.timestamp
        };

      case 'issue.opened':
        return {
          issue: payload.data.issue,
          repository: payload.data.repository,
          action: 'opened',
          timestamp: payload.timestamp
        };

      default:
        return payload.data;
    }
  }

  /**
   * Get webhook configuration for external service
   */
  getWebhookConfig(): WebhookConfig {
    return {
      url: `${process.env.WEBHOOK_BASE_URL}/api/webhooks/yourservice`,
      secret: process.env.YOURSERVICE_WEBHOOK_SECRET || '',
      events: [
        'push',
        'issue.opened',
        'pull_request.opened',
        // List all events you want to subscribe to
      ],
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AREA-Platform/1.0'
      }
    };
  }
}

// Export the handler instance
export default new YourServiceWebhookHandler();
```

### 2. Webhook Route Registration

Register your webhook handler in the main webhook router:

**File**: `backend/src/webhooks/index.ts`

```typescript
import express, { Request, Response } from 'express';
import yourServiceWebhook from './yourservice';

const router = express.Router();

router.post('/yourservice', async (req: Request, res: Response) => {
  await yourServiceWebhook.handle(req, res);
});

export default router;
```

### 3. Webhook Management Service

Create a service to manage webhook registrations with external services:

**File**: `backend/src/services/services/yourservice/webhookManager.ts`

```typescript
import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { ExternalWebhooks } from '../../../config/entity/ExternalWebhooks';

export class YourServiceWebhookManager {
  private apiBaseUrl: string;
  private accessToken: string;

  constructor(accessToken: string) {
    this.apiBaseUrl = process.env.SERVICE_YOURSERVICE_API_BASE_URL || 'https://api.yourservice.com';
    this.accessToken = accessToken;
  }

  /**
   * Register webhook with external service
   */
  async registerWebhook(config: {
    resource_id: string; // e.g., repository ID
    events: string[];
    user_id: number;
  }): Promise<string> {
    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/yourservice`;
    const secret = process.env.YOURSERVICE_WEBHOOK_SECRET || '';

    const response = await fetch(`${this.apiBaseUrl}/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: config.events,
        secret: secret,
        resource_id: config.resource_id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register webhook: ${response.statusText}`);
    }

    const result = await response.json() as { id: string };

    // Store webhook registration in database
    await this.saveWebhookRegistration({
      user_id: config.user_id,
      service: 'yourservice',
      external_webhook_id: result.id,
      resource_id: config.resource_id,
      events: config.events,
      webhook_url: webhookUrl,
      is_active: true,
    });

    return result.id;
  }

  /**
   * Unregister webhook from external service
   */
  async unregisterWebhook(webhookId: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to unregister webhook: ${response.statusText}`);
    }

    // Update database record
    const webhookRepo = AppDataSource.getRepository(ExternalWebhooks);
    await webhookRepo.update(
      { external_webhook_id: webhookId },
      { is_active: false, deleted_at: new Date() }
    );
  }

  /**
   * List registered webhooks
   */
  async listWebhooks(): Promise<any[]> {
    const response = await fetch(`${this.apiBaseUrl}/webhooks`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list webhooks: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Save webhook registration to database
   */
  private async saveWebhookRegistration(data: {
    user_id: number;
    service: string;
    external_webhook_id: string;
    resource_id: string;
    events: string[];
    webhook_url: string;
    is_active: boolean;
  }): Promise<void> {
    const webhookRepo = AppDataSource.getRepository(ExternalWebhooks);

    const externalWebhook = new ExternalWebhooks();
    externalWebhook.user_id = data.user_id;
    externalWebhook.service = data.service;
    externalWebhook.external_webhook_id = data.external_webhook_id;
    externalWebhook.resource_id = data.resource_id;
    externalWebhook.events = data.events;
    externalWebhook.webhook_url = data.webhook_url;
    externalWebhook.is_active = data.is_active;

    await webhookRepo.save(externalWebhook);
  }
}
```

### 4. Environment Variables

Add webhook-related environment variables:

```env
# Webhook Configuration
WEBHOOK_BASE_URL=https://your-domain.com
YOURSERVICE_WEBHOOK_SECRET=your-webhook-secret-key

# YourService API Configuration
SERVICE_YOURSERVICE_API_BASE_URL=https://api.yourservice.com
```

### 5. Webhook Types Definition

Define TypeScript types for webhook handling:

**File**: `backend/src/types/webhook.ts`

```typescript
import { Request, Response } from 'express';

export interface WebhookHandler {
  id: string;
  name: string;
  description: string;
  handle(req: Request, res: Response): Promise<void>;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
  headers?: Record<string, string>;
}

export interface WebhookRegistration {
  id: string;
  service: string;
  resource_id: string;
  events: string[];
  is_active: boolean;
  created_at: Date;
}
```

## Example: GitHub Webhook Implementation

The project includes a complete GitHub webhook implementation as reference:

**Files to examine:**
- `backend/src/webhooks/github/` - GitHub webhook handler
- `backend/src/services/services/github/webhookManager.ts` - Webhook management
- `backend/src/config/entity/ExternalWebhooks.ts` - Database entity

## Testing Webhooks

### 1. Local Development Testing

Use tools like ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Update WEBHOOK_BASE_URL in .env
WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io
```

### 2. Webhook Testing Tools

```typescript
// Test webhook handler
describe('YourService Webhook Handler', () => {
  it('should process webhook payload correctly', async () => {
    const mockPayload = {
      event_type: 'push',
      timestamp: '2023-01-01T00:00:00Z',
      data: {
        id: 'test-id',
        action: 'push',
        object: { /* mock data */ }
      }
    };

    const req = {
      headers: {
        'x-yourservice-signature': 'valid-signature',
        'x-yourservice-event': 'push'
      },
      body: mockPayload
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;

    await webhookHandler.handle(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

### 3. Manual Testing with curl

```bash
# Test webhook endpoint manually
curl -X POST http://localhost:3000/api/webhooks/yourservice \
  -H "Content-Type: application/json" \
  -H "X-YourService-Signature: sha256=your-signature" \
  -H "X-YourService-Event: push" \
  -d '{
    "event_type": "push",
    "timestamp": "2023-01-01T00:00:00Z",
    "data": {
      "id": "test-id",
      "action": "push",
      "object": {}
    }
  }'
```

## Security Best Practices

:::danger Security Considerations

**Critical Security Requirements:**

1. **Signature Verification**: Always verify webhook signatures
2. **HTTPS Only**: Use HTTPS for all webhook endpoints
3. **Rate Limiting**: Implement rate limiting for webhook endpoints
4. **Input Validation**: Validate all incoming webhook data
5. **Secret Management**: Store webhook secrets securely
6. **IP Whitelisting**: Consider IP whitelisting for known services

:::

### Signature Verification

```typescript
// Secure signature verification
private verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    const providedSignature = signature.replace(/^sha256=/, '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Apply rate limiting to webhook endpoints
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many webhook requests from this IP',
});

router.use('/webhooks', webhookLimiter);
```

## Webhook Management API

Create API endpoints for managing webhooks:

**File**: `backend/src/routes/webhooks/management.ts`

```typescript
import express, { Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { YourServiceWebhookManager } from '../../services/services/yourservice/webhookManager';

const router = express.Router();


router.post('/register', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { service, resource_id, events } = req.body;
    const userId = (req as any).user.id;

    // Get user's access token for the service
    const accessToken = await getUserServiceToken(userId, service);

    const webhookManager = new YourServiceWebhookManager(accessToken);
    const webhookId = await webhookManager.registerWebhook({
      resource_id,
      events,
      user_id: userId
    });

    res.status(201).json({ webhook_id: webhookId });
  } catch (error) {
    console.error('Webhook registration error:', error);
    res.status(500).json({ error: 'Failed to register webhook' });
  }
});
```

## Troubleshooting Common Issues

### Webhook Not Receiving Events
1. Verify webhook URL is accessible from the internet
2. Check webhook registration with external service
3. Verify webhook secret configuration
4. Check firewall and network configuration

### Signature Verification Failures
1. Ensure webhook secret matches between service and AREA
2. Verify signature algorithm (SHA256, SHA1, etc.)
3. Check payload encoding (UTF-8, etc.)
4. Test with known good signatures

### Event Processing Failures
1. Check action mapping configuration
2. Verify payload transformation logic
3. Review execution service logs
4. Test with simplified payloads

:::tip Best Practices

1. **Idempotency**: Make webhook processing idempotent
2. **Async Processing**: Use queues for heavy webhook processing
3. **Monitoring**: Monitor webhook success/failure rates
4. **Documentation**: Document expected webhook payloads
5. **Versioning**: Version your webhook handlers for compatibility

:::

## Next Steps

After implementing webhooks:

1. Test webhook registration and deregistration
2. Implement webhook event logging and monitoring
3. Add webhook management UI to frontend
4. Create webhook retry mechanisms for failures
5. Implement webhook payload validation schemas

For more details about service integration, see [Create an Action](./create-an-action.md) and [Create a Reaction](./create-a-reaction.md).
