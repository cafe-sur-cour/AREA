---
sidebar_position: 2
---

# Implement OAuth

This guide explains how to implement OAuth authentication for external services in the AREA platform.

## Overview

OAuth implementation in AREA enables secure authentication with external services like GitHub, Discord, Spotify, and others. The platform uses OAuth 2.0 flow to obtain access tokens that allow the system to interact with external APIs on behalf of the user.

## Prerequisites

- Understanding of OAuth 2.0 flow
- External service OAuth application configured
- Environment variables properly set up
- Basic knowledge of TypeScript and Express.js

## OAuth Implementation Structure

### 1. Service OAuth Class

Create an OAuth handler class for your service in the service directory:

**File**: `backend/src/services/services/your-service/oauth.ts`

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

export interface YourServiceUser {
  id: number;
  username: string;
  email: string;
  // Add other user fields as needed
}

export class YourServiceOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private apiBaseUrl: string;
  private authBaseUrl: string;

  constructor() {
    this.clientId = process.env.SERVICE_YOURSERVICE_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_YOURSERVICE_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_YOURSERVICE_REDIRECT_URI || '';
    this.apiBaseUrl = process.env.SERVICE_YOURSERVICE_API_BASE_URL || 'https://api.yourservice.com';
    this.authBaseUrl = process.env.SERVICE_YOURSERVICE_AUTH_BASE_URL || 'https://yourservice.com';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('YourService OAuth configuration missing');
    }
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'read,write', // Adjust scopes as needed
      state: state,
      response_type: 'code',
    });

    return `${this.authBaseUrl}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<YourServiceTokenResponse> {
    const response = await fetch(`${this.authBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return await response.json() as YourServiceTokenResponse;
  }

  async getUserInfo(accessToken: string): Promise<YourServiceUser> {
    const response = await fetch(`${this.apiBaseUrl}/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return await response.json() as YourServiceUser;
  }

  async saveUserToken(userId: number, tokenData: YourServiceTokenResponse): Promise<void> {
    const userTokenRepo = AppDataSource.getRepository(UserToken);

    // Check if token already exists
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

  async refreshToken(refreshToken: string): Promise<YourServiceTokenResponse> {
    const response = await fetch(`${this.authBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    return await response.json() as YourServiceTokenResponse;
  }
}
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# YourService OAuth Configuration
SERVICE_YOURSERVICE_CLIENT_ID=your-client-id
SERVICE_YOURSERVICE_CLIENT_SECRET=your-client-secret
SERVICE_YOURSERVICE_REDIRECT_URI=http://localhost:3001/auth/yourservice/callback
SERVICE_YOURSERVICE_API_BASE_URL=https://api.yourservice.com
SERVICE_YOURSERVICE_AUTH_BASE_URL=https://yourservice.com
```

### 3. Authentication Routes

Create authentication routes for your service:

**File**: `backend/src/routes/yourservice/auth.ts`

```typescript
import express, { Request, Response } from 'express';
import { YourServiceOAuth } from '../../services/services/yourservice/oauth';
import { AppDataSource } from '../../config/db';
import { UserOAuthProvider } from '../../config/entity/UserOAuthProvider';

const router = express.Router();
const oauth = new YourServiceOAuth();


router.get('/auth', (req: Request, res: Response) => {
  try {
    const redirectUrl = req.query.redirect_url as string;
    const state = JSON.stringify({
      redirect_url: redirectUrl || process.env.FRONTEND_URL,
      timestamp: Date.now()
    });

    const authUrl = oauth.getAuthorizationUrl(Buffer.from(state).toString('base64'));
    res.redirect(authUrl);
  } catch (error) {
    console.error('OAuth initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});


router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      throw new Error('Missing required parameters');
    }

    // Decode and validate state
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const redirectUrl = stateData.redirect_url || process.env.FRONTEND_URL;

    // Exchange code for token
    const tokenData = await oauth.exchangeCodeForToken(code as string);

    // Get user info
    const userInfo = await oauth.getUserInfo(tokenData.access_token);

    // Save or update OAuth provider
    const oauthRepo = AppDataSource.getRepository(UserOAuthProvider);
    let oauthProvider = await oauthRepo.findOne({
      where: { provider: 'yourservice', provider_id: userInfo.id.toString() }
    });

    if (!oauthProvider) {
      // Handle new user registration or linking
      // This depends on your user management strategy
      res.redirect(`${redirectUrl}?error=user_not_linked`);
      return;
    }

    // Save tokens
    await oauth.saveUserToken(oauthProvider.user_id, tokenData);

    res.redirect(`${redirectUrl}?success=oauth_connected`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const redirectUrl = process.env.FRONTEND_URL;
    res.redirect(`${redirectUrl}?error=oauth_failed`);
  }
});

export default router;
```

### 4. Register Routes

Add your OAuth routes to the main application:

**File**: `backend/index.ts`

```typescript
import yourServiceAuthRoutes from './src/routes/yourservice/auth';

// Add this with other route registrations
app.use('/api/yourservice', yourServiceAuthRoutes);
```

### 5. Passport.js Integration (Optional)

For more advanced OAuth handling, you can integrate with Passport.js:

**File**: `backend/src/config/passport.ts`

```typescript
import passport from 'passport';
import { Strategy as YourServiceStrategy } from 'passport-yourservice';

passport.use(new YourServiceStrategy({
  clientID: process.env.SERVICE_YOURSERVICE_CLIENT_ID!,
  clientSecret: process.env.SERVICE_YOURSERVICE_CLIENT_SECRET!,
  callbackURL: process.env.SERVICE_YOURSERVICE_REDIRECT_URI!
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Handle user creation/linking logic
    const user = await handleOAuthUser(profile, 'yourservice');
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));
```

## Example: GitHub OAuth Implementation

The project includes a complete GitHub OAuth implementation as a reference:

**Files to examine:**
- `backend/src/services/services/github/oauth.ts` - OAuth handler class
- `backend/src/routes/github/github.ts` - Authentication routes
- `backend/src/config/passport.ts` - Passport.js configuration

## Frontend Integration

### React/Next.js Integration

```typescript
// Frontend OAuth initiation
const handleOAuth = () => {
  const redirectUrl = window.location.origin + '/dashboard';
  window.location.href = `/api/yourservice/auth?redirect_url=${encodeURIComponent(redirectUrl)}`;
};

// Handle OAuth callback results
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get('success');
  const error = urlParams.get('error');

  if (success === 'oauth_connected') {
    // Show success message and refresh user data
    setNotification('Service connected successfully!');
    refreshUserServices();
  } else if (error) {
    // Handle error cases
    setNotification('Failed to connect service', 'error');
  }
}, []);
```

### Mobile Flutter Integration

```dart
// Flutter OAuth handling
Future<void> initiateOAuth(String service) async {
  final url = '${ApiConfig.baseUrl}/api/$service/auth';

  // Use flutter_web_auth or similar package
  final result = await FlutterWebAuth.authenticate(
    url: url,
    callbackUrlScheme: 'area',
  );

  // Handle the result
  if (result.contains('success=oauth_connected')) {
    // Show success and refresh data
  }
}
```

## Security Considerations

:::danger Security Best Practices

**Critical Security Requirements:**

1. **State Parameter**: Always use state parameter for CSRF protection
2. **HTTPS Only**: OAuth should only work over HTTPS in production
3. **Token Storage**: Store tokens securely and encrypted
4. **Scope Limitation**: Request only necessary scopes
5. **Token Expiration**: Implement proper token refresh logic
6. **Input Validation**: Validate all OAuth callback parameters

:::

### Token Security

```typescript
// Encrypt tokens before storing
import crypto from 'crypto';

const encryptToken = (token: string): string => {
  const algorithm = 'aes-256-gcm';
  const key = process.env.TOKEN_ENCRYPTION_KEY!;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
};
```

## Testing OAuth Implementation

### Unit Tests

```typescript
// Test OAuth flow
describe('YourService OAuth', () => {
  it('should generate valid authorization URL', () => {
    const oauth = new YourServiceOAuth();
    const url = oauth.getAuthorizationUrl('test-state');

    expect(url).toContain('client_id=');
    expect(url).toContain('state=test-state');
  });

  it('should exchange code for token', async () => {
    const oauth = new YourServiceOAuth();
    // Mock fetch and test token exchange
  });
});
```

### Integration Tests

```typescript
// Test OAuth routes
describe('OAuth Routes', () => {
  it('should redirect to OAuth provider', async () => {
    const response = await request(app)
      .get('/api/yourservice/auth')
      .expect(302);

    expect(response.headers.location).toContain('yourservice.com');
  });
});
```

## Common Issues and Troubleshooting

### Invalid Redirect URI
- Ensure redirect URI matches exactly in OAuth app settings
- Check environment variable configuration
- Verify protocol (http vs https)

### Token Refresh Failures
- Implement proper error handling for expired tokens
- Store refresh tokens securely
- Handle refresh token rotation

### CORS Issues
- Configure CORS properly for OAuth callbacks
- Ensure frontend and backend URLs are whitelisted

:::tip Best Practices

1. **Environment Separation**: Use different OAuth apps for development/production
2. **Error Handling**: Implement comprehensive error handling and logging
3. **User Experience**: Provide clear OAuth connection status in UI
4. **Documentation**: Document required scopes and permissions
5. **Testing**: Test OAuth flow thoroughly in different environments

:::

## ⚡ Automatic Route Generation

:::info IMPORTANT - No Manual Route Registration Required

Since the modularization update, **OAuth routes are generated automatically** for all services with `oauth.enabled = true`.

You **DO NOT** need to:
- ❌ Add routes manually in `auth.ts`
- ❌ Register Passport strategies in central files
- ❌ Update Swagger documentation manually

The system automatically creates:
- ✅ `/api/auth/{service}/login` (if `supportsLogin: true`)
- ✅ `/api/auth/{service}/callback`
- ✅ Swagger documentation for all OAuth routes

### How It Works

1. **Your OAuth Class** with `getAuthorizationUrl()` method
2. **Service Definition** in `index.ts` with `oauth: { enabled: true }`
3. **Routes Generated** automatically by `oauth.router.ts`

### Custom Strategies

For services that need Passport OAuth2Strategy (like GitHub, Google):
- The system detects if `getAuthorizationUrl()` exists
- If **YES**: Uses manual redirect (Microsoft style)
- If **NO**: Falls back to `passport.authenticate()` (GitHub style)

:::

## 🔗 Custom Subscription URLs

Some services require special subscription flows beyond standard OAuth (e.g., GitHub App installation). Use the `getSubscriptionUrl` property to define custom subscription endpoints.

### When to Use `getSubscriptionUrl`

Use this property when your service requires:
- **App installations** (like GitHub Apps)
- **Organization-level permissions**
- **Additional setup steps** after OAuth
- **Custom subscription flows** not covered by OAuth alone

### Implementation

In your service definition (`index.ts`), add the `getSubscriptionUrl` function to your `oauth` configuration:

```typescript
import type { Service } from '../../../types/service';

export const yourService: Service = {
  id: 'yourservice',
  name: 'Your Service',
  description: 'Description of your service',
  oauth: {
    enabled: true,
    supportsLogin: true,
    // Custom subscription URL generator
    getSubscriptionUrl: (userId: number) => {
      const appSlug = process.env.YOURSERVICE_APP_SLUG || 'your-app-name';
      return `https://yourservice.com/install/app/${appSlug}?state=${userId}`;
    },
  },
  actions: [],
  reactions: [],
};
```

### How It Works

1. **User clicks "Subscribe"** on frontend
2. **Backend checks** for `oauth.getSubscriptionUrl` in service definition
3. **If defined**: User is redirected to the custom URL
4. **If not defined**: Standard OAuth flow is used
5. **After installation**: External service redirects back to your callback

### Real Example: GitHub App Installation

```typescript
export const githubService: Service = {
  id: 'github',
  name: 'GitHub',
  description: 'Version control and collaboration platform',
  oauth: {
    enabled: true,
    supportsLogin: true,
    getSubscriptionUrl: (userId: number) => {
      const appSlug = process.env.GITHUB_APP_SLUG || 'area-cafe-sur-cours';
      // Redirects to GitHub App installation page
      return `https://github.com/apps/${appSlug}/installations/new?state=${userId}`;
    },
  },
  // ... actions and reactions
};
```

### Parameters

- **`userId`**: The current user's ID, automatically passed by the system
  - Use this to track which user initiated the subscription
  - Include it in the `state` parameter for callback verification

### Benefits

✅ **Flexible**: Support any subscription flow, not just OAuth
✅ **Automatic**: No need to modify central routing code
✅ **Type-safe**: TypeScript ensures proper implementation
✅ **Modular**: All service logic stays in the service folder

### Notes

- The `getSubscriptionUrl` function is **optional**
- If not provided, the system uses standard OAuth subscribe flow
- The returned URL should include user identification (via `state` or similar)
- Your callback endpoint should handle the external service's redirect

````

## Next Steps

After implementing OAuth:

1. Test the complete OAuth flow
2. Implement token refresh logic
3. Add OAuth status to user dashboard
4. Create service-specific API calls using the tokens
5. Implement OAuth disconnection functionality

For more details about service integration, see [Create a Service](../services/SERVICES_ARCHITECTURE.md).
