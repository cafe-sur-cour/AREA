# Implementing a Complete Service

This comprehensive guide details how to implement a new service in AREA, including OAuth integration, actions, reactions, webhooks, and unified subscription system integration.

:::tip 🎯 100% Modular Architecture

Since the modularization update, AREA follows a **strict modularity principle**:

**The ONLY place where service-specific code should exist is in the service's own folder.**

✅ **You write code in**: `/backend/src/services/services/your-service/`
✅ **Everything else is automatic**: Routes, Swagger docs, ServiceRegistry integration

:::

## Architecture Overview

AREA uses a modular architecture where each service provides **actions** (triggers) and **reactions** (responses). Services are integrated through:

- **OAuth 2.0** for authentication (automatic route generation)
- **Unified subscription routes** (`/auth/{service}/subscribe`)
- **Actions and reactions** with configuration schemas
- **Webhooks** for external events (optional)
- **Centralized management** via ServiceRegistry and ServiceSubscriptionManager
- **Dynamic routing** - No need to modify central route files

## Prerequisites

- Understanding of OAuth 2.0
- TypeScript and Express.js knowledge
- OAuth application configured with the provider
- Properly configured environment variables

## Step 1: Create Service Folder

:::info ℹ️ No Central File Modifications Required

**You do NOT need to modify any central files** to add a new service!

- ❌ No need to edit `oauth.router.ts` - routes are generated automatically
- ❌ No need to edit `ServiceRegistry` - services are loaded automatically
- ❌ No need to edit `swagger.ts` - API docs are generated automatically
- ❌ No need to add service to type unions - all types are now generic

**Just create your service folder and everything works automatically!**

:::

Create a new folder structure under `/backend/src/services/services/`:

```
services/
└── your-service/
    ├── index.ts          # Service definition
    ├── actions.ts        # Available triggers
    ├── reactions.ts      # Available responses
    ├── schemas.ts        # Configuration schemas
    ├── oauth.ts          # OAuth implementation
    ├── executor.ts       # Reaction execution logic
    ├── locales/          # Translation files
    │   ├── en.json       # English translations
    │   └── fr.json       # French translations
    └── webhooks/         # Optional: webhook handlers
        ├── index.ts
        └── handlers.ts
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
      sharedEvents: true,  // ← Events from this action trigger mappings for ALL users
      sharedEventFilter: (event, mapping) => {  // ← Optional filter for shared events
        const repository = (event.payload as { repository?: { full_name?: string } })?.repository?.full_name;
        return repository ? mapping.action.config?.repository === repository : true;
      },
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
      sharedEvents: true,  // ← Shared between users
      sharedEventFilter: (event, mapping) => {
        const repository = (event.payload as { repository?: { full_name?: string } })?.repository?.full_name;
        return repository ? mapping.action.config?.repository === repository : true;
      },
      icon: 'issue-opened',
      color: '#28a745',
    },
  },
  {
    id: 'yourservice.personal_notification',
    name: 'Personal Notification',
    description: 'Triggers for personal user events',
    configSchema: personalConfigSchema,
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['user_id'],
    },
    metadata: {
      category: 'Personal',
      tags: ['notification', 'personal'],
      requiresAuth: true,
      sharedEvents: false,  // ← Personal (default) - only the owner user sees their reactions
      icon: 'bell',
      color: '#007acc',
    },
  },
];
```

### Shared Events Configuration

AREA supports two types of events:

#### Shared Events (`sharedEvents: true`)
- **Trigger** : Events trigger reactions for **ALL** users who have configured this action
- **Usage** : Ideal for external webhooks (GitHub, Discord, etc.) where multiple users may want to react to the same event
- **Example** : A push on a GitHub repo triggers notifications for all users watching that repo

#### Personal Events (`sharedEvents: false` or undefined)
- **Trigger** : Events only trigger reactions for the **owner user**
- **Usage** : Ideal for personal events (timers, individual notifications, etc.)
- **Example** : A personal timer only triggers the owner's actions

#### Shared Events Filtering (`sharedEventFilter`)
For shared events, you can add a custom filter:

```typescript
sharedEventFilter: (event, mapping) => {
  // event: { source: string, payload: Record<string, unknown> }
  // mapping: { action: { config?: Record<string, unknown> } }

  // Example: filter by repository for GitHub
  const repository = (event.payload as { repository?: { full_name?: string } })?.repository?.full_name;
  return repository ? mapping.action.config?.repository === repository : true;
}
```

This filter ensures that only users who have configured the action for the correct context (repository, channel, etc.) see their reactions triggered.

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
  icon: `<svg stroke="currentColor" fill="#FF6B35" stroke-width="0" viewBox="0 0 496 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="..."></path></svg>`,
  actions: actions,
  reactions: reactions,
};

export default yourService;
export { yourServiceExecutor as executor };
```

:::tip Icon SVG with Brand Colors
The icon should be a complete SVG string (inline) with your service's brand color. You can get SVG icons from libraries like [React Icons](https://react-icons.github.io/react-icons/) or [Font Awesome](https://fontawesome.com/).

**Important:** Replace `fill="currentColor"` with your service's brand color (e.g., `fill="#FF6B35"`). This ensures the icon is immediately recognizable with the correct branding.

Examples of brand colors used in AREA:
- GitHub: `#181717` (dark gray/black)
- Google: `#4285F4` (blue)
- Spotify: `#1DB954` (green)
- Facebook: `#1877F2` (blue)
- Twitch: `#9146FF` (purple)
- Reddit: `#FF4500` (orange-red)
- Slack: `#4A154B` (aubergine)
:::

### Complete Service Interface Reference

The `Service` interface supports the following properties:

#### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the service (lowercase, no spaces) |
| `name` | `string` | Display name shown to users |
| `description` | `string` | Brief description of the service functionality |
| `version` | `string` | Semantic version (e.g., "1.0.0") |
| `actions` | `ActionDefinition[]` | Array of available triggers/events |
| `reactions` | `ReactionDefinition[]` | Array of available responses/actions |

#### Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| `icon` | `string` | SVG string representation of the service icon |
| `alwaysSubscribed` | `boolean` | If `true`, service is always available without subscription (e.g., Timer service) |
| `authOnly` | `boolean` | If `true`, service is used only for authentication/login and won't appear in the services list |
| `oauth` | `object` | OAuth configuration (see below) |
| `getCredentials` | `(userId: number) => Promise<Record<string, string>>` | Function to retrieve user credentials/tokens |
| `deleteWebhook` | `(userId: number, webhookId: number) => Promise<void>` | Function to clean up webhooks when mappings are deleted |
| `ensureWebhookForMapping` | `(mapping, userId, actionDefinition?) => Promise<void>` | Function to create/verify webhooks for mappings |

#### OAuth Configuration

The `oauth` property is an object with the following structure:

```typescript
oauth?: {
  enabled: boolean;                              // Enable OAuth for this service
  supportsLogin?: boolean;                       // Allow users to login with this service
  getSubscriptionUrl?: (userId: number) => string; // Custom subscription URL (e.g., GitHub App installation)
}
```

**OAuth Properties:**

- **`enabled`** (required if oauth object exists): Set to `true` to enable OAuth authentication
- **`supportsLogin`** (optional): Set to `true` if users can login to AREA using this service
- **`getSubscriptionUrl`** (optional): Function returning a custom subscription URL
  - Use when service requires app installation or special subscription flow
  - Example: GitHub App installation page
  - Parameter: `userId` - Current user's ID for tracking
  - Return: Full URL where user should be redirected

**Example with custom subscription:**

```typescript
const githubService: Service = {
  id: 'github',
  name: 'GitHub',
  description: 'Version control platform',
  version: '1.0.0',
  oauth: {
    enabled: true,
    supportsLogin: true,
    getSubscriptionUrl: (userId: number) => {
      const appSlug = process.env.GITHUB_APP_SLUG || 'your-app';
      return `https://github.com/apps/${appSlug}/installations/new?state=${userId}`;
    },
  },
  actions: actions,
  reactions: reactions,
};
```

**Example without custom subscription (standard OAuth):**

```typescript
const spotifyService: Service = {
  id: 'spotify',
  name: 'Spotify',
  description: 'Music streaming service',
  version: '1.0.0',
  oauth: {
    enabled: true,
    supportsLogin: false,
    // No getSubscriptionUrl - uses standard OAuth flow
  },
  actions: actions,
  reactions: reactions,
};
```

**Example without OAuth (always available):**

```typescript
const timerService: Service = {
  id: 'timer',
  name: 'Timer',
  description: 'Schedule-based triggers',
  version: '1.0.0',
  alwaysSubscribed: true, // Always available, no OAuth needed
  actions: actions,
  reactions: reactions,
};
```

**Example for auth-only service (login only):**

```typescript
const microsoftService: Service = {
  id: 'microsoft',
  name: 'Microsoft 365',
  description: 'Microsoft 365 OAuth service for authentication',
  version: '1.0.0',
  oauth: {
    enabled: true,
    supportsLogin: true,
  },
  authOnly: true, // Used only for login, won't appear in services list
  actions: [], // No actions for auth-only services
  reactions: [], // No reactions for auth-only services
};
```

#### Advanced Optional Functions

**`getCredentials(userId: number)`**
- Retrieves user-specific credentials (OAuth tokens, API keys)
- Used internally by action/reaction executors
- Should return object with credential keys/values

**`deleteWebhook(userId: number, webhookId: number)`**
- Called when a mapping using this service's action is deleted
- Should clean up external webhooks to prevent orphaned subscriptions
- Example: Unregister webhook from GitHub API

**`ensureWebhookForMapping(mapping, userId, actionDefinition?)`**
- Called when a new mapping is created
- Should ensure webhook exists for the action configuration
- Can create or update webhooks as needed
- Useful for services that use webhooks for actions

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

:::info 📁 `locales/` Folder

Each service must have its own `locales/` folder containing translation files for each supported language. This folder is automatically detected and loaded by AREA's modular translation system.

**Required Structure:**
```
your-service/
└── locales/
    ├── en.json    # English translations
    └── fr.json    # French translations
```

**Why a folder per service?**
- **Modularity**: Each service manages its own translations
- **Maintenance**: Easier to add/modify translations
- **Performance**: On-demand loading of translations
- **Scalability**: New services = new folders, no central files to modify

:::

### Creating Translation Files

Create the `locales/` folder in your service:

```bash
mkdir -p backend/src/services/services/your-service/locales
```

#### `en.json` - English Translations

```json
{
  "name": "Your Service",
  "description": "Complete integration with YourService for automation workflows",
  "actions": {
    "yourservice.push": {
      "name": "Repository Push",
      "description": "Triggers when code is pushed to a repository"
    },
    "yourservice.issue_created": {
      "name": "Issue Created",
      "description": "Triggers when a new issue is created"
    }
  },
  "reactions": {
    "yourservice.create_issue": {
      "name": "Create Issue",
      "description": "Creates a new issue in a repository"
    },
    "yourservice.send_notification": {
      "name": "Send Notification",
      "description": "Sends a notification to the user"
    }
  }
}
```

#### `fr.json` - French Translations

```json
{
  "name": "Votre Service",
  "description": "Intégration complète avec VotreService pour les workflows d'automatisation",
  "actions": {
    "yourservice.push": {
      "name": "Push sur Dépôt",
      "description": "Se déclenche lorsqu'un push est fait sur un dépôt"
    },
    "yourservice.issue_created": {
      "name": "Issue Créée",
      "description": "Se déclenche lorsqu'une nouvelle issue est créée"
    }
  },
  "reactions": {
    "yourservice.create_issue": {
      "name": "Créer une Issue",
      "description": "Crée une nouvelle issue dans un dépôt"
    },
    "yourservice.send_notification": {
      "name": "Envoyer une Notification",
      "description": "Envoie une notification à l'utilisateur"
    }
  }
}
```

### Translation Keys Structure

| Key | Description | Example |
|-----|-------------|---------|
| `name` | Service name displayed to users | "GitHub", "Spotify" |
| `description` | Short service description | "Version control platform" |
| `actions.{actionId}.name` | Action name | "Repository Push" |
| `actions.{actionId}.description` | Action description | "Triggers when code is pushed" |
| `reactions.{reactionId}.name` | Reaction name | "Create Issue" |
| `reactions.{reactionId}.description` | Reaction description | "Creates a new issue" |

:::warning ⚠️ Naming Convention

Action and reaction keys must exactly match the `id` defined in `actions.ts` and `reactions.ts`:
- Action ID: `"yourservice.push"` → key: `"actions.yourservice.push"`
- Reaction ID: `"yourservice.create_issue"` → key: `"reactions.yourservice.create_issue"`

:::

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

## Event Architecture

### Understanding Events in AREA

AREA processes different types of events that trigger automation execution:

#### 1. Webhook Events (External)
- **Source** : External services (GitHub, Discord, etc.)
- **Trigger** : HTTP webhooks received from the external service
- **Behavior** : According to `sharedEvents`, can trigger mappings for all users or only a specific user

#### 2. Scheduled Events (Timers)
- **Source** : Internal timer system
- **Trigger** : Periodic execution based on user configuration
- **Behavior** : Always personal (only the owner user sees their reactions)

#### 3. Polling Events
- **Source** : Regular API checks for external services
- **Trigger** : Regular API requests to detect changes
- **Behavior** : Can be shared or personal depending on the event nature

### Event Execution Flow

```
1. Event Received ──┬─ Webhook ──→ WebhookHandler
                   ├─ Timer ────→ TimerService
                   └─ Polling ──→ PollingService

2. Event Creation ──→ WebhookEvents (in database)

3. Mapping Search ──┬─ sharedEvents: true ──→ All users
                   └─ sharedEvents: false ──→ Owner user only

4. Contextual Filtering ──→ sharedEventFilter (optional)

5. Reaction Execution ──→ ReactionExecutor
```

### Practical Examples

#### GitHub Push (Shared Event)
```typescript
metadata: {
  sharedEvents: true,
  sharedEventFilter: (event, mapping) => {
    // A push on "owner/repo" only triggers mappings configured for that repo
    const repo = event.payload.repository?.full_name;
    return mapping.action.config?.repository === repo;
  }
}
```
**Result** : If 3 users are watching "owner/repo", a push triggers all 3 automations.

#### Personal Timer (Personal Event)
```typescript
metadata: {
  sharedEvents: false, // or undefined
}
```
**Result** : A user's timer only triggers their own automations.

#### Spotify Notification (Personal Event)
```typescript
metadata: {
  sharedEvents: false,
}
```
**Result** : A Spotify notification for user A only triggers A's automations.

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

## Ressources Supplémentaires

- [Architecture des Événements](../architecture/event-architecture.md)
- [OAuth 2.0 Documentation](https://oauth.net/2/)
- [TypeScript Types](../types/service.ts)
- [Exemples Existants](../services/services/github/)

---
