# Service Subscription Flow

This document outlines the frontend flow for subscribing to services in AREA.

## Available Endpoints

### Unified Subscription Endpoint
```
GET /api/auth/{service}/subscribe
```
- **Purpose**: Complete subscription including OAuth flow
- **Auth**: Bearer token required
- **Response**: Redirects to OAuth or returns subscription status

### Service Status Endpoints
```
GET /api/{service}/subscribe/status
GET /api/{service}/login/status
```
- **Purpose**: Check subscription and OAuth status
- **Auth**: Bearer token required

### Unsubscribe Endpoint
```
POST /api/{service}/unsubscribe
```
- **Purpose**: Unsubscribe from service events
- **Auth**: Bearer token required

## Subscription Flow

### 1. Check Current Status
```javascript
// Check if user is already subscribed
const statusResponse = await fetch('/api/github/subscribe/status', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});
const status = await statusResponse.json();

// status.subscribed: boolean
// status.oauth_connected: boolean
// status.can_create_webhooks: boolean
```

### 2. Initiate Subscription
```javascript
// If not subscribed, start subscription process
if (!status.subscribed) {
  // This will handle OAuth if needed, then subscribe
  window.location.href = `/api/auth/github/subscribe`;
}
```

### 3. Handle OAuth Callback (if redirected)
```javascript
// After OAuth completion, check subscription status again
const newStatus = await fetch('/api/github/subscribe/status', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});
```

### 4. Verify Success
```javascript
if (newStatus.subscribed && newStatus.oauth_connected) {
  // Subscription successful - can now create webhooks
  console.log('Successfully subscribed to GitHub');
}
```

## Error Handling

### Common Responses
- `401`: Authentication required
- `404`: Not subscribed (when checking status)
- `500`: Internal server error

### OAuth Flow Errors
- Check browser console for OAuth provider errors
- Verify redirect URIs match configuration

## Service Configuration

### Get All Services
```
GET /api/services/
```
- **Purpose**: Retrieve all available services with subscription status
- **Auth**: Bearer token required
- **Response**: List of services with endpoints and subscription status

```javascript
// Get all services with subscription status
const servicesResponse = await fetch('/api/services/', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});
const { services } = await servicesResponse.json();

// Each service includes:
services.forEach(service => {
  console.log(service.id);           // 'github'
  console.log(service.name);         // 'GitHub'
  console.log(service.isSubscribed); // true/false
  console.log(service.endpoints);    // { auth, status, loginStatus, subscribe, unsubscribe }
});
```

### Get Subscribed Services Only
```
GET /api/services/subscribed
```
- **Purpose**: Get only services the user is subscribed to
- **Auth**: Bearer token required

### Get Services with Actions/Reactions
```
GET /api/services/actions
GET /api/services/reactions
```
- **Purpose**: Get services that provide actions or reactions
- **Auth**: Bearer token required

## Mobile App Flow

For mobile apps, the subscription flow has been optimized to work seamlessly without requiring external browsers for callbacks. Use the `is_mobile=true` query parameter to enable mobile-specific redirects.

### Mobile Subscription Flow

1. **Open OAuth URL with mobile parameter**
```javascript
// For mobile apps, add is_mobile=true to enable deep link redirects
const subscribeUrl = `/api/auth/github/subscribe?is_mobile=true`;
```

2. **Handle different callback types**
```javascript
// Configure your mobile app to handle these callback types:
//
// For services WITHOUT app installation (Spotify, Google):
// - mobileApp://callback?spotify_subscribed=true
// - mobileApp://callback?google_subscribed=true
//
// For services WITH app installation (GitHub):
// - GitHub redirects to: https://github.com/apps/.../installations/new
// - After installation, GitHub redirects back to your backend callback
// - Backend then redirects to: mobileApp://callback?github_subscribed=true
```

3. **Handle external browser redirects**
```javascript
// For services requiring app installation (like GitHub),
// the backend will redirect to external URLs that must be opened in browser
function handleSubscriptionRedirect(url) {
  if (url.includes('github.com/apps/')) {
    // Open in external browser for app installation
    openExternalBrowser(url);
  } else if (url.startsWith('mobileApp://')) {
    // Handle deep link directly in app
    handleDeepLink(url);
  }
}
```

### Important Notes for Mobile Apps

**GitHub App Installation:**
- GitHub requires app installation for webhook functionality
- Even with `is_mobile=true`, GitHub subscription redirects to installation URL
- Mobile app must open this URL in external browser
- After installation, GitHub redirects back to backend, which then sends deep link

**Service Differences:**
- **GitHub**: Requires app installation → external browser → deep link
- **Spotify/Google**: Direct OAuth → deep link
- **Timer**: No OAuth required → direct API response

### Mobile Authentication Flow

For user authentication from mobile apps:

```javascript
// 1. Start OAuth login with mobile parameter
const loginUrl = `${API_BASE_URL}/api/auth/github/login?is_mobile=true`;

// 2. Handle callback
// mobileApp://callback?token=jwt_token_here

// 3. Store token and proceed with authenticated requests
```

### Mobile vs Web Differences

| Aspect | Web App | Mobile App |
|--------|---------|------------|
| OAuth Initiation | Direct browser redirect | WebView with `?is_mobile=true` |
| Callback Handling | Frontend route handling | Deep links `mobileApp://callback` |
| Token Storage | HTTP-only cookies | Secure storage in app |
| User Experience | Same tab/window | Seamless app transition |
| **GitHub Installation** | **Same flow** | **External browser required** |
| **Service Connection** | **Direct redirect** | **Deep link after OAuth** |

### Configuration Requirements

**Mobile App Configuration:**
- Register `mobileApp://callback` URL scheme
- Handle deep links in app delegate/router
- Parse query parameters from callback URLs
- **Handle external browser redirects** for services requiring app installation (GitHub)

**Backend Configuration:**
- Set `MOBILE_CALLBACK_URL=mobileApp://callback` in environment variables
- Ensure mobile callback URL is properly configured for production

**External Browser Handling:**
```javascript
// Mobile apps must detect and handle external URLs differently
function handleRedirect(url) {
  if (url.startsWith('mobileApp://')) {
    // Handle as deep link
    handleDeepLink(url);
  } else if (url.includes('github.com/apps/')) {
    // Open in external browser for app installation
    openExternalBrowser(url);
  } else {
    // Other external URLs
    openExternalBrowser(url);
  }
}
```

### Error Handling for Mobile

```javascript
function handleRedirect(url) {
  try {
    if (url.startsWith('mobileApp://')) {
      // Success callbacks
      handleDeepLink(url);
    } else if (url.includes('github.com/apps/')) {
      // GitHub app installation - open in external browser
      openExternalBrowser(url);
      showMessage('Please complete GitHub app installation in your browser');
    } else if (url.includes('google.com') || url.includes('spotify.com')) {
      // OAuth providers - these should be handled in WebView
      openWebView(url);
    } else {
      // Unexpected redirect
      console.error('Unexpected redirect URL:', url);
      showError('Unexpected redirect occurred');
    }
  } catch (error) {
    console.error('Failed to handle redirect:', error);
    showError('Failed to process redirect');
  }
}
```
