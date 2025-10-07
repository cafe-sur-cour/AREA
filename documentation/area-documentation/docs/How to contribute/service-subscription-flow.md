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

For mobile apps, use WebView or external browser for OAuth:

1. Open OAuth URL in external browser
2. Handle callback URL scheme (e.g., `area://oauth/callback`)
3. Exchange code for token on backend
4. Check subscription status
