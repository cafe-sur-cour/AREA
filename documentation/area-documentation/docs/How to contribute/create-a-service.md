# Implementing a Complete Service

This comprehensive guide details how to implement a new service in AREA, including OAuth integration, actions, reactions, webhooks, and unified subscription system integration.

## Architecture Overview

AREA uses a modular architecture where each service provides **actions** (triggers) and **reactions** (responses). Services are integrated through:

- **OAuth 2.0** for authentication
- **Unified subscription routes** (`/auth/{service}/subscribe`)
- **Actions and reactions** with configuration schemas
- **Webhooks** for external events (optional)
- **Centralized management** via ServiceRegistry and ServiceSubscriptionManager

## Prerequisites

- Understanding of OAuth 2.0
- TypeScript and Express.js knowledge
- OAuth application configured with the provider
- Properly configured environment variables

## Step 1: Service Structure

Create the following folder structure:

```
backend/src/services/services/
└── your-service/
    ├── index.ts           # Main service definition
    ├── oauth.ts           # OAuth management
    ├── actions.ts         # Action definitions
    ├── reactions.ts       # Reaction definitions
    ├── schemas.ts         # Configuration schemas
    └── executor.ts        # Reaction execution logic
```

## Step 2: OAuth Implementation

### OAuth Class (`oauth.ts`)

```typescript
import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

export interface YourServiceTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in?: number;
  refresh_token?: string;
}

export class YourServiceOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.SERVICE_YOURSERVICE_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_YOURSERVICE_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_YOURSERVICE_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('YourService OAuth configuration missing');
    }
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'read,write',
      state: state,
      response_type: 'code',
    });
    return `https://yourservice.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<YourServiceTokenResponse> {
    const response = await fetch('https://yourservice.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json() as YourServiceTokenResponse;
  }

  async getUserToken(userId: number): Promise<any | null> {
    const userTokenRepo = AppDataSource.getRepository(UserToken);
    return await userTokenRepo.findOne({
      where: { user_id: userId, service: 'yourservice' }
    });
  }

  async saveUserToken(userId: number, tokenData: YourServiceTokenResponse): Promise<void> {
    const userTokenRepo = AppDataSource.getRepository(UserToken);

    let userToken = await userTokenRepo.findOne({
      where: { user_id: userId, service: 'yourservice' }
    });

    if (!userToken) {
      userToken = new UserToken();
      userToken.user_id = userId;
      userToken.service = 'yourservice';
    }

    userToken.access_token = tokenData.access_token;
    userToken.token_type = tokenData.token_type;
    userToken.scope = tokenData.scope;
    userToken.refresh_token = tokenData.refresh_token || null;

    if (tokenData.expires_in) {
      userToken.expires_at = new Date(Date.now() + tokenData.expires_in * 1000);
    }

    await userTokenRepo.save(userToken);
  }
}

export const yourServiceOAuth = new YourServiceOAuth();
```

### Passport.js Integration

AREA uses **Passport.js** for OAuth flow management. The unified subscription system automatically handles Passport strategies:

```typescript
// In subscription.ts, Passport strategies are loaded dynamically:
const strategyName = `${service}-subscribe`;
return passport.authenticate(strategyName, { session: false })(req, res, next);
```

**You don't need to configure Passport strategies manually** - the system detects your OAuth class and creates the appropriate strategy. Just ensure your OAuth class follows the standard interface with `getAuthorizationUrl()` and `exchangeCodeForToken()` methods.

For advanced OAuth flows, you can create custom Passport strategies in `backend/src/passport/{service}.ts` if needed.

### Environment Variables

Add to your `.env`:

```env
SERVICE_YOURSERVICE_CLIENT_ID=your-client-id
SERVICE_YOURSERVICE_CLIENT_SECRET=your-client-secret
SERVICE_YOURSERVICE_REDIRECT_URI=http://localhost:3000/auth/yourservice/callback
```

## Step 3: Schema Definitions (`schemas.ts`)

```typescript
import { ConfigSchema, InputSchema, OutputSchema } from '../../../types/service';

// Schema for webhook actions
export const webhookConfigSchema: ConfigSchema = {
  name: 'Webhook Configuration',
  description: 'Configuration for YourService webhooks',
  fields: [
    {
      name: 'repository',
      type: 'text',
      label: 'Repository',
      required: true,
      placeholder: 'owner/repo',
    },
    {
      name: 'events',
      type: 'select',
      label: 'Events to monitor',
      required: true,
      options: [
        { value: 'push', label: 'Push' },
        { value: 'pull_request', label: 'Pull Request' },
        { value: 'issues', label: 'Issues' },
      ],
    },
  ],
};

// Schema for reactions
export const reactionConfigSchema: ConfigSchema = {
  name: 'Reaction Configuration',
  description: 'Configuration for YourService reactions',
  fields: [
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      required: true,
      placeholder: 'Message to send',
    },
  ],
};
```

## Step 4: Action Definitions (`actions.ts`)

```typescript
import { ActionDefinition } from '../../../types/service';
import { webhookConfigSchema } from './schemas';

export const actions: ActionDefinition[] = [
  {
    id: 'yourservice.push',
    name: 'Repository Push',
    description: 'Triggers when code is pushed to a repository',
    configSchema: webhookConfigSchema,
    inputSchema: {
      type: 'object',
      properties: {
        repository: { type: 'string' },
        branch: { type: 'string' },
        commits: { type: 'array' },
      },
      required: ['repository'],
    },
    metadata: {
      category: 'Code',
      tags: ['git', 'push', 'repository'],
      requiresAuth: true,
      webhookPattern: 'push',
      icon: 'git-branch',
      color: '#f05032',
    },
  },
  {
    id: 'yourservice.issue_created',
    name: 'Issue Created',
    description: 'Triggers when a new issue is created',
    configSchema: webhookConfigSchema,
    inputSchema: {
      type: 'object',
      properties: {
        repository: { type: 'string' },
        issue: { type: 'object' },
        user: { type: 'string' },
      },
      required: ['repository', 'issue'],
    },
    metadata: {
      category: 'Issues',
      tags: ['issue', 'created'],
      requiresAuth: true,
      webhookPattern: 'issues',
      icon: 'issue-opened',
      color: '#28a745',
    },
  },
];
```

## Step 5: Reaction Definitions (`reactions.ts`)

```typescript
import { ReactionDefinition } from '../../../types/service';
import { reactionConfigSchema } from './schemas';

export const reactions: ReactionDefinition[] = [
  {
    id: 'yourservice.create_issue',
    name: 'Create Issue',
    description: 'Creates a new issue in a repository',
    configSchema: reactionConfigSchema,
    outputSchema: {
      type: 'object',
      properties: {
        issue_url: { type: 'string' },
        issue_number: { type: 'number' },
      },
      required: ['issue_url', 'issue_number'],
    },
    metadata: {
      category: 'Issues',
      tags: ['issue', 'create'],
      requiresAuth: true,
      estimatedDuration: 2,
      icon: 'plus',
      color: '#28a745',
    },
  },
  {
    id: 'yourservice.send_notification',
    name: 'Send Notification',
    description: 'Sends a notification to the user',
    configSchema: reactionConfigSchema,
    outputSchema: {
      type: 'object',
      properties: {
        notification_id: { type: 'string' },
        sent_at: { type: 'string' },
      },
      required: ['notification_id'],
    },
    metadata: {
      category: 'Communication',
      tags: ['notification', 'alert'],
      requiresAuth: false,
      estimatedDuration: 1,
      icon: 'bell',
      color: '#007acc',
    },
  },
];
```

## Step 6: Reaction Executor (`executor.ts`)

```typescript
import { ReactionExecutor, ReactionExecutionResult } from '../../../types/service';
import { yourServiceOAuth } from './oauth';

export class YourServiceExecutor implements ReactionExecutor {
  serviceId = 'yourservice';

  async execute(
    reactionType: string,
    config: Record<string, unknown>,
    input: Record<string, unknown>,
    userId: number
  ): Promise<ReactionExecutionResult> {
    try {
      switch (reactionType) {
        case 'yourservice.create_issue':
          return await this.createIssue(config, input, userId);

        case 'yourservice.send_notification':
          return await this.sendNotification(config, input, userId);

        default:
          throw new Error(`Unsupported reaction type: ${reactionType}`);
      }
    } catch (error) {
      console.error(`Error executing reaction ${reactionType}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async createIssue(
    config: Record<string, unknown>,
    input: Record<string, unknown>,
    userId: number
  ): Promise<ReactionExecutionResult> {
    const token = await yourServiceOAuth.getUserToken(userId);
    if (!token) {
      throw new Error('OAuth token missing');
    }

    const repository = config.repository as string;
    const title = config.title as string || 'Issue created by AREA';
    const body = config.message as string || 'Issue created automatically';

    const response = await fetch(`https://api.github.com/repos/${repository}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body }),
    });

    if (!response.ok) {
      throw new Error(`Issue creation failed: ${response.statusText}`);
    }

    const issue = await response.json();

    return {
      success: true,
      output: {
        issue_url: issue.html_url,
        issue_number: issue.number,
      },
    };
  }

  private async sendNotification(
    config: Record<string, unknown>,
    input: Record<string, unknown>,
    userId: number
  ): Promise<ReactionExecutionResult> {
    const message = config.message as string;

    console.log(`📧 Notification for user ${userId}: ${message}`);

    return {
      success: true,
      output: {
        notification_id: `notif_${Date.now()}`,
        sent_at: new Date().toISOString(),
      },
    };
  }
}

export const yourServiceExecutor = new YourServiceExecutor();
```

## Step 7: Main Service Definition (`index.ts`)

```typescript
import { Service } from '../../types/service';
import { actions } from './actions';
import { reactions } from './reactions';
import { yourServiceExecutor } from './executor';

const yourService: Service = {
  id: 'yourservice',
  name: 'Your Service',
  description: 'Complete integration with YourService for automation',
  version: '1.0.0',
  icon: '<add your SVG icon here>',
  actions: actions,
  reactions: reactions,
};

export default yourService;
export { yourServiceExecutor as executor };
```

## Step 8: Unified Subscription Integration

With the unified subscription system, your service is automatically supported by the centralized subscription routes. No additional route implementation is required!

### How It Works

The system uses parameterized routes in `backend/src/routes/services/subscription.ts`:

```typescript
// Single route handles all services
router.get('/:service/subscribe', token, async (req, res, next) => {
  const service = req.params.service.toLowerCase();
  // Service-specific logic handled here
});
```

### Automatic Service Detection

When you create your service following Steps 1-7, the subscription system will:

1. **Detect your service** by attempting to load `../../services/services/{service}/oauth`
2. **Handle OAuth flow** using your `YourServiceOAuth` class
3. **Perform subscription** using the `ServiceSubscriptionManager`
4. **Support dynamic loading** for future services

### Legacy Route Compatibility

For backward compatibility, legacy routes redirect to the unified endpoint:

```typescript
// These routes automatically redirect to /auth/{service}/subscribe
router.get('/github/subscribe', (req, res) => res.redirect('/auth/github/subscribe'));
router.get('/google/subscribe', (req, res) => res.redirect('/auth/google/subscribe'));
// ... etc
```

### Service-Specific Routes (Optional)

You may still want to add service-specific routes for advanced functionality. Create `backend/src/routes/{service}/{service}.ts` for:

- Custom OAuth callbacks
- Service-specific API endpoints
- Advanced configuration options

Example service-specific routes:

```typescript
import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { yourServiceOAuth } from '../../services/services/yourservice/oauth';

const router = express.Router();

// Service-specific status endpoints
router.get('/login/status', token, async (req: Request, res: Response) => {
  const userId = (req.auth as { id: number }).id;
  const token = await yourServiceOAuth.getUserToken(userId);
  return res.json({ connected: !!token });
});

export default router;
```

## Step 9: Configuration and Integration

### Automatic Route Registration

With the unified subscription system, your service routes are **automatically available** at:

- **Subscription**: `/auth/yourservice/subscribe` (handled by unified route)
- **Status**: `/yourservice/subscribe/status` (if you create service-specific routes)
- **OAuth Status**: `/yourservice/login/status` (if you create service-specific routes)
- **Unsubscribe**: `/yourservice/unsubscribe` (if you create service-specific routes)

### Service Registry Integration

Your service is automatically registered when you create the service files. The system will:

1. **Load your service** from `backend/src/services/services/yourservice/index.ts`
2. **Register actions/reactions** in the ServiceRegistry
3. **Enable subscription routes** through the unified system
4. **Mount service-specific routes** if you create them

### Optional: Service-Specific Routes

If you need custom endpoints beyond basic subscription, create `backend/src/routes/yourservice/yourservice.ts`:

```typescript
import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { yourServiceOAuth } from '../../services/services/yourservice/oauth';
import { serviceSubscriptionManager } from '../../services/ServiceSubscriptionManager';

const router = express.Router();

// OAuth status check
router.get('/login/status', token, async (req: Request, res: Response) => {
  const userId = (req.auth as { id: number }).id;
  const token = await yourServiceOAuth.getUserToken(userId);
  return res.json({
    connected: !!token,
    expires_at: token?.expires_at
  });
});

// Subscription status
router.get('/subscribe/status', token, async (req: Request, res: Response) => {
  const userId = (req.auth as { id: number }).id;
  const subscription = await serviceSubscriptionManager.getUserSubscription(userId, 'yourservice');
  return res.json({
    subscribed: subscription?.subscribed || false,
    subscribed_at: subscription?.subscribed_at
  });
});

// Unsubscribe
router.post('/unsubscribe', token, async (req: Request, res: Response) => {
  const userId = (req.auth as { id: number }).id;
  const subscription = await serviceSubscriptionManager.unsubscribeUser(userId, 'yourservice');
  return res.json({ message: 'Unsubscribed successfully' });
});

export default router;
```

### Mount Service Routes (if created)

If you create service-specific routes, mount them in `backend/src/app.ts`:

```typescript
import yourserviceRoutes from './routes/yourservice/yourservice';

// Add to your routes section:
app.use('/api/yourservice', yourserviceRoutes);
```

## Step 10: Translations

Add to `backend/locales/en.json` and `backend/locales/fr.json`:

```json
{
  "services": {
    "yourservice": {
      "name": "Your Service",
      "description": "Complete integration with YourService for automation",
      "actions": {
        "yourservice.push": {
          "name": "Repository Push",
          "description": "Triggers when code is pushed to a repository"
        }
      },
      "reactions": {
        "yourservice.create_issue": {
          "name": "Create Issue",
          "description": "Creates a new issue in a repository"
        }
      }
    }
  }
}
```

## Step 11: Webhooks (Optional)

If your service supports webhooks, create `backend/src/webhooks/yourservice/index.ts`:

```typescript
import { WebhookHandler } from '../../types/webhook';
import { AppDataSource } from '../../config/db';
import { WebhookEvents } from '../../config/entity/WebhookEvents';

class YourServiceWebhookHandler implements WebhookHandler {
  service = 'yourservice';

  async handle(req: Request, res: Response): Promise<Response> {
    // Webhook processing logic
    // See existing webhook documentation for details
    return res.status(200).json({ message: 'Webhook processed' });
  }
}

export default new YourServiceWebhookHandler();
```

## Step 12: Testing and Validation

### Unit Tests

```typescript
describe('YourService OAuth', () => {
  it('should generate valid authorization URL', () => {
    const oauth = new YourServiceOAuth();
    const url = oauth.getAuthorizationUrl('test-state');
    expect(url).toContain('client_id=');
  });

  it('should save and retrieve user tokens', async () => {
    // Token management tests
  });
});

describe('YourService Executor', () => {
  it('should execute create_issue reaction', async () => {
    // Reaction execution tests
  });
});
```

### Integration Tests

```typescript
describe('YourService Integration', () => {
  it('should be supported by unified subscription route', async () => {
    // Test that /auth/yourservice/subscribe works
    const response = await request(app)
      .get('/api/auth/yourservice/subscribe')
      .set('Authorization', `Bearer ${testToken}`);
    expect(response.status).toBe(302); // Redirect to OAuth
  });

  it('should handle service-specific routes if implemented', async () => {
    // Test service-specific routes if you created them
    const response = await request(app)
      .get('/api/yourservice/login/status')
      .set('Authorization', `Bearer ${testToken}`);
    expect(response.status).toBe(200);
  });
});
```

## Additional Resources

- [OAuth 2.0 Documentation](https://oauth.net/2/)
- [TypeScript Types](../types/service.ts)
- [Existing Examples](../services/services/github/)

---
