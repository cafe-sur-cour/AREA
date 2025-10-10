# Microsoft Reactions Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Reactions](#reactions)
- [Schemas](#schemas)
- [Executor](#executor)
- [OAuth & Permissions](#oauth--permissions)
- [How to Add New Reactions](#how-to-add-new-reactions)

---

## Overview

The Microsoft service provides **7 reactions** for automating tasks across Microsoft 365 services including **Microsoft Teams**, **Outlook Email**, and **Outlook Calendar**. These reactions allow users to create powerful automation workflows that interact with their Microsoft ecosystem.

### Service Components

```
backend/src/services/services/microsoft/
├── index.ts          # Service registration and configuration
├── oauth.ts          # OAuth authentication and token management
├── schemas.ts        # Configuration schemas for each reaction
├── reactions.ts      # Reaction definitions
└── executor.ts       # Reaction execution logic
```

---

## Architecture

### 1. Service Flow

```
User Action/Event
    ↓
AREA System Triggers Reaction
    ↓
Executor receives ReactionExecutionContext
    ↓
Validates OAuth token
    ↓
Calls appropriate Microsoft Graph API
    ↓
Returns ReactionExecutionResult
```

### 2. Key Interfaces

#### ReactionExecutionContext
```typescript
interface ReactionExecutionContext {
  reaction: {
    type: string;              // e.g., "microsoft.send_email"
    config: Record<string, unknown>;  // User configuration
  };
  event: {
    user_id: number;           // User who owns the automation
    data: Record<string, unknown>;    // Event data
  };
  serviceConfig: {
    credentials?: {
      access_token: string;    // Microsoft OAuth token
    };
  };
}
```

#### ReactionExecutionResult
```typescript
interface ReactionExecutionResult {
  success: boolean;
  output?: Record<string, unknown>;  // Output data
  error?: string;                    // Error message if failed
}
```

---

## Reactions

### 1. 💬 Send Message in Teams Chat
**ID:** `microsoft.send_teams_chat_message`

Sends a message to an existing Microsoft Teams chat (1-to-1 or group chat).

**Configuration:**
- `chat_id` (required): The unique identifier of the Teams chat
  - Format: `19:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx_yyyyyyyyyyyyyyyyyyyyyyyy@unq.gbl.spaces`
- `message` (required): The message content to send

**How to get Chat ID:**
1. Open Teams in web browser
2. Navigate to the chat
3. Copy the ID from the URL after `/conversations/`

**Output:**
```typescript
{
  message_id: string;  // ID of the sent message
  chat_id: string;     // Chat where message was sent
  success: boolean;
}
```

**Graph API:** `POST /v1.0/chats/{chat_id}/messages`

**Example Use Case:**
- Send status updates to a project team chat
- Notify a group when a deployment completes

---

### 2. 📧 Send Direct Message to User
**ID:** `microsoft.send_direct_message`

Creates a 1-to-1 chat and sends a direct message to a specific user in Teams.

**Configuration:**
- `user_email` (required): Email address of the recipient
  - Example: `john.doe@company.com`
- `message` (required): The message content

**Process:**
1. Finds the target user by email
2. Retrieves current user info
3. Creates or retrieves 1-to-1 chat
4. Sends the message

**Output:**
```typescript
{
  message_id: string;   // ID of the sent message
  chat_id: string;      // Chat that was created/used
  user_email: string;   // Recipient's email
  success: boolean;
}
```

**Graph APIs Used:**
- `GET /v1.0/users/{email}` - Find user
- `GET /v1.0/me` - Get current user
- `POST /v1.0/chats` - Create/get chat
- `POST /v1.0/chats/{id}/messages` - Send message

**Example Use Case:**
- Send personal reminders to team members
- Direct notifications for task assignments

---

### 3. 📨 Send Email
**ID:** `microsoft.send_email`

Sends an email via Outlook.

**Configuration:**
- `to` (required): Recipient's email address
- `subject` (required): Email subject line
- `body` (required): Email body content (plain text)
- `cc` (optional): CC recipients, comma-separated
  - Example: `user1@example.com, user2@example.com`

**Features:**
- Automatically saves to Sent Items
- Supports multiple CC recipients
- Plain text format (HTML can be added)

**Output:**
```typescript
{
  message_id: string;  // ID of sent email (if returned)
  success: boolean;
}
```

**Graph API:** `POST /v1.0/me/sendMail`

**Example Use Case:**
- Send automated reports
- Email notifications for important events
- Weekly summaries to stakeholders

---

### 4. 💬 Reply to Email
**ID:** `microsoft.reply_to_email`

Replies to a specific email in Outlook.

**Configuration:**
- `message_id` (required): ID of the email to reply to
  - Format: `AAMkAGI2TG93AAA=`
- `reply_body` (required): Content of the reply

**How to get Message ID:**
- From action triggers (when new email received)
- From Microsoft Graph API queries
- From webhook payloads

**Output:**
```typescript
{
  message_id: string;  // ID of reply (if returned)
  success: boolean;
}
```

**Graph API:** `POST /v1.0/me/messages/{message_id}/reply`

**Example Use Case:**
- Auto-reply to specific senders
- Acknowledge receipt of important emails
- Send automated responses based on email content

---

### 5. 📅 Create Calendar Event
**ID:** `microsoft.create_calendar_event`

Creates a new event in Outlook Calendar.

**Configuration:**
- `subject` (required): Event title
  - Example: `"Team Standup Meeting"`
- `start_datetime` (required): Start date/time in ISO 8601 format
  - Example: `"2025-10-09T14:00:00"`
- `end_datetime` (required): End date/time in ISO 8601 format
  - Example: `"2025-10-09T15:00:00"`
- `location` (optional): Event location
  - Example: `"Conference Room A"`
- `body` (optional): Event description
- `attendees` (optional): Email addresses, comma-separated
  - Example: `"user1@example.com, user2@example.com"`

**Features:**
- Timezone defaults to UTC
- Sends meeting invites to attendees
- Creates event in primary calendar

**Output:**
```typescript
{
  event_id: string;    // ID of created event
  web_link: string;    // URL to view event
  success: boolean;
}
```

**Graph API:** `POST /v1.0/me/events`

**Example Use Case:**
- Schedule meetings when tasks are completed
- Create recurring team syncs
- Book time blocks automatically

---

### 6. 📢 Post Message in Teams Channel
**ID:** `microsoft.post_teams_channel_message`

Posts a message to a public or private Teams channel.

**Configuration:**
- `team_id` (required): Team GUID
  - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- `channel_id` (required): Channel identifier
  - Format: `19:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@thread.tacv2`
- `message` (required): Message content

**How to get IDs:**
1. **Team ID:**
   - Teams Settings → Get link to team → Extract ID from URL
2. **Channel ID:**
   - Right-click channel → Get link → Extract ID from URL

**Output:**
```typescript
{
  message_id: string;  // ID of posted message
  success: boolean;
}
```

**Graph API:** `POST /v1.0/teams/{team_id}/channels/{channel_id}/messages`

**Example Use Case:**
- Post build status to dev channel
- Announce deployments to team
- Share automated reports with department

---

### 7. 🟢 Update User Presence
**ID:** `microsoft.update_presence`

Updates your presence/status in Microsoft Teams.

**Configuration:**
- `availability` (required): Availability status
  - Options: `Available`, `Busy`, `DoNotDisturb`, `BeRightBack`, `Away`
- `activity` (required): Activity status
  - Options: `Available`, `InACall`, `InAMeeting`, `Busy`, `Away`
- `expiration_duration` (optional): How long status lasts (ISO 8601 duration)
  - Example: `"PT1H"` (1 hour), `"PT30M"` (30 minutes)

**Status Combinations:**
| Availability | Activity | Meaning |
|-------------|----------|---------|
| Available | Available | Normal available state |
| Busy | InACall | Currently in a call |
| Busy | InAMeeting | Currently in a meeting |
| DoNotDisturb | Busy | Don't disturb me |
| Away | Away | Away from desk |

**Output:**
```typescript
{
  success: boolean;
  availability: string;  // Confirmed availability
  activity: string;      // Confirmed activity
}
```

**Graph API:** `POST /v1.0/me/presence/setPresence`

**Example Use Case:**
- Auto-set "In a Meeting" during calendar events
- Set "Do Not Disturb" during focus time
- Update status based on location/time

---

## Schemas

Schemas define the **user interface** for configuring reactions. They specify what fields users need to fill out.

### Schema Structure

```typescript
interface ActionReactionSchema {
  name: string;           // Display name
  description: string;    // What this reaction does
  fields: ConfigField[];  // Configuration fields
}

interface ConfigField {
  name: string;          // Field identifier (used in config object)
  type: string;          // Input type: 'text', 'textarea', 'select'
  label: string;         // Display label
  required: boolean;     // Is field required?
  placeholder?: string;  // Placeholder text
  options?: Array<{      // For 'select' type
    value: string;
    label: string;
  }>;
  default?: any;         // Default value
}
```

### Example: Email Schema

```typescript
export const microsoftSendEmailSchema: ActionReactionSchema = {
  name: 'Send Email',
  description: 'Sends an email via Outlook',
  fields: [
    {
      name: 'to',              // → config.to
      type: 'text',
      label: 'To (Email Address)',
      required: true,
      placeholder: 'recipient@example.com',
    },
    {
      name: 'subject',         // → config.subject
      type: 'text',
      label: 'Subject',
      required: true,
      placeholder: 'Email subject',
    },
    {
      name: 'body',            // → config.body
      type: 'textarea',
      label: 'Body',
      required: true,
      placeholder: 'Email body content',
    },
    {
      name: 'cc',              // → config.cc
      type: 'text',
      label: 'CC (Optional)',
      required: false,
      placeholder: 'cc@example.com',
    },
  ],
};
```

**Field Types:**
- `text`: Single-line input
- `textarea`: Multi-line input
- `select`: Dropdown with predefined options

---

## Executor

The `MicrosoftReactionExecutor` class handles the actual execution of reactions.

### Executor Pattern

```typescript
class MicrosoftReactionExecutor implements ReactionExecutor {
  async execute(context: ReactionExecutionContext): Promise<ReactionExecutionResult> {
    // 1. Extract configuration and validate
    // 2. Get valid OAuth token
    // 3. Route to appropriate handler method
    // 4. Call Microsoft Graph API
    // 5. Return result
  }

  private async specificReaction(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    // Implementation for specific reaction
  }
}
```

### Key Methods

#### 1. `execute()`
Main entry point that:
- Validates access token
- Routes to correct handler based on `reaction.type`
- Catches and handles errors

```typescript
async execute(context: ReactionExecutionContext): Promise<ReactionExecutionResult> {
  const { reaction, serviceConfig } = context;

  try {
    // Get user's Microsoft token
    const userToken = await microsoftOAuth.getUserToken(context.event.user_id);
    if (!userToken) {
      return { success: false, error: 'Token not found' };
    }

    const validToken = userToken.token_value;

    // Route to handler
    switch (reaction.type) {
      case 'microsoft.send_email':
        return await this.sendEmail(reaction.config, validToken);
      // ... other cases
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

#### 2. Handler Methods
Each reaction has its own private handler method:

**Pattern:**
```typescript
private async handlerMethod(
  config: Record<string, unknown>,
  accessToken: string
): Promise<ReactionExecutionResult> {
  // 1. Extract and validate config
  const { field1, field2 } = config as { field1: string; field2: string };

  if (!field1) {
    return { success: false, error: 'Field1 is required' };
  }

  try {
    // 2. Prepare payload
    const payload = {
      // ... API-specific structure
    };

    // 3. Call Microsoft Graph API
    const response = await fetch(
      `${this.apiBaseUrl}/v1.0/endpoint`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    // 4. Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `API error: ${errorData.error?.message}`,
      };
    }

    const result = await response.json();

    // 5. Return success
    return {
      success: true,
      output: {
        // ... relevant output data
        success: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Network error: ${error.message}`,
    };
  }
}
```

### Error Handling

The executor implements multiple layers of error handling:

1. **Token Validation**: Checks if user has valid Microsoft token
2. **Input Validation**: Validates required fields
3. **API Errors**: Captures Microsoft Graph API errors
4. **Network Errors**: Handles connection issues
5. **Type Safety**: TypeScript ensures type correctness

**Error Response Structure:**
```typescript
{
  success: false,
  error: "Description of what went wrong"
}
```

### Complex Example: Send Direct Message

This reaction demonstrates advanced flow with multiple API calls:

```typescript
private async sendDirectMessage(
  config: Record<string, unknown>,
  accessToken: string
): Promise<ReactionExecutionResult> {
  const { user_email, message } = config as {
    user_email: string;
    message: string;
  };

  // Step 1: Find target user by email
  const userResponse = await fetch(
    `${this.apiBaseUrl}/v1.0/users/${encodeURIComponent(user_email)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!userResponse.ok) {
    return { success: false, error: 'Failed to find user' };
  }

  const targetUser = await userResponse.json() as TeamsUser;

  // Step 2: Get current user info
  const meResponse = await fetch(`${this.apiBaseUrl}/v1.0/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const currentUser = await meResponse.json() as TeamsUser;

  // Step 3: Create or get 1-to-1 chat
  const createChatPayload = {
    chatType: 'oneOnOne',
    members: [
      {
        '@odata.type': '#microsoft.graph.aadUserConversationMember',
        roles: ['owner'],
        'user@odata.bind': `${this.apiBaseUrl}/v1.0/users('${currentUser.id}')`,
      },
      {
        '@odata.type': '#microsoft.graph.aadUserConversationMember',
        roles: ['owner'],
        'user@odata.bind': `${this.apiBaseUrl}/v1.0/users('${targetUser.id}')`,
      },
    ],
  };

  const chatResponse = await fetch(`${this.apiBaseUrl}/v1.0/chats`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createChatPayload),
  });

  const chat = await chatResponse.json() as ChatResponse;

  // Step 4: Send message to chat
  const messagePayload = {
    body: {
      contentType: 'text',
      content: message,
    },
  };

  const messageResponse = await fetch(
    `${this.apiBaseUrl}/v1.0/chats/${chat.id}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    }
  );

  const messageData = await messageResponse.json();

  return {
    success: true,
    output: {
      message_id: messageData.id,
      chat_id: chat.id,
      user_email: user_email,
      success: true,
    },
  };
}
```

This demonstrates:
- Multiple sequential API calls
- Data transformation between calls
- Complex payload structures
- Comprehensive output data

---

## OAuth & Permissions

### Required Scopes

The Microsoft service requires the following **delegated permissions**:

```
openid                    # Basic OpenID Connect
email                     # User's email address
profile                   # User's profile information
User.Read                 # Read user profile
User.ReadBasic.All        # Read basic info of all users (for finding users)
offline_access            # Refresh tokens

Chat.ReadWrite            # Read/write chats
ChatMessage.Send          # Send chat messages

Mail.Send                 # Send emails
Mail.ReadWrite            # Read/write emails

Calendars.ReadWrite       # Read/write calendar events

ChannelMessage.Send       # Send channel messages

Presence.ReadWrite        # Read/write presence status
```

### Azure AD Configuration

1. **Register Application** in Azure Portal
2. **Configure Redirect URI**: `https://your-domain.com/api/oauth/microsoft/callback`
3. **Add Permissions**: API permissions → Microsoft Graph → Delegated permissions
4. **Grant Admin Consent**: If required by organization
5. **Create Client Secret**: Certificates & secrets section

### Environment Variables

```bash
SERVICE_MICROSOFT_CLIENT_ID=your-client-id
SERVICE_MICROSOFT_CLIENT_SECRET=your-client-secret
SERVICE_MICROSOFT_REDIRECT_URI=https://your-domain.com/api/oauth/microsoft/callback
SERVICE_MICROSOFT_TENANT_ID=common  # or your tenant ID
```

### Token Management

Tokens are stored in the `user_token` table:
- **Access Token**: Short-lived (typically 1 hour)
- **Refresh Token**: Long-lived (with `offline_access` scope)

The OAuth class (`oauth.ts`) handles:
- Token exchange
- Token storage
- Token retrieval
- Token validation
- Automatic refresh (to be implemented)

---

## How to Add New Reactions

Follow these steps to add a new Microsoft reaction:

### Step 1: Define the Schema (`schemas.ts`)

```typescript
export const microsoftNewReactionSchema: ActionReactionSchema = {
  name: 'Your Reaction Name',
  description: 'What your reaction does',
  fields: [
    {
      name: 'field_name',
      type: 'text',
      label: 'Field Label',
      required: true,
      placeholder: 'Example value',
    },
    // ... more fields
  ],
};
```

### Step 2: Define the Reaction (`reactions.ts`)

```typescript
import { microsoftNewReactionSchema } from './schemas';

export const microsoftReactions: ReactionDefinition[] = [
  // ... existing reactions
  {
    id: 'microsoft.new_reaction',
    name: 'Your Reaction Name',
    description: 'Detailed description',
    configSchema: microsoftNewReactionSchema,
    outputSchema: {
      type: 'object',
      properties: {
        output_field: {
          type: 'string',
          description: 'Description of output',
        },
        success: {
          type: 'boolean',
          description: 'Whether operation succeeded',
        },
      },
      required: ['success'],
    },
    metadata: {
      category: 'Microsoft Category',
      tags: ['tag1', 'tag2'],
      requiresAuth: true,
      estimatedDuration: 2000,  // milliseconds
    },
  },
];
```

### Step 3: Implement Handler (`executor.ts`)

```typescript
// Add case to switch statement
switch (reaction.type) {
  // ... existing cases
  case 'microsoft.new_reaction':
    return await this.newReaction(reaction.config, validToken);
}

// Implement handler method
private async newReaction(
  config: Record<string, unknown>,
  accessToken: string
): Promise<ReactionExecutionResult> {
  // Extract config
  const { field_name } = config as { field_name: string };

  // Validate
  if (!field_name) {
    return {
      success: false,
      error: 'Field name is required',
    };
  }

  try {
    // Call Microsoft Graph API
    const response = await fetch(
      `${this.apiBaseUrl}/v1.0/your-endpoint`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Your payload
        }),
      }
    );

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `API error: ${errorData.error?.message || 'Unknown error'}`,
      };
    }

    const result = await response.json();

    // Return success
    return {
      success: true,
      output: {
        output_field: result.someField,
        success: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Network error: ${(error as Error).message}`,
    };
  }
}
```

### Step 4: Update OAuth Scopes (if needed)

If your reaction requires new permissions, update `oauth.ts`:

```typescript
scope: 'existing scopes New.Scope Another.Scope'
```

And configure in Azure AD.

### Step 5: Test

1. Restart the backend
2. The new reaction should appear in the UI automatically
3. Test with valid configuration
4. Verify error handling
5. Check logs for issues

---

## Best Practices

### 1. Error Handling
- Always validate input fields
- Catch both API and network errors
- Provide clear, actionable error messages
- Log errors for debugging

### 2. API Calls
- Use proper TypeScript types
- Include `Content-Type` header
- Handle non-200 responses
- Parse error responses safely with `.catch(() => ({}))`

### 3. Configuration
- Mark optional fields clearly
- Provide helpful placeholder text
- Use appropriate input types
- Document format requirements

### 4. Security
- Never log access tokens
- Validate token before use
- Handle expired tokens gracefully
- Follow OAuth best practices

### 5. Performance
- Keep payloads minimal
- Use appropriate estimated durations
- Consider rate limits
- Implement retries for transient failures

---

## Microsoft Graph API Resources

- **Documentation**: https://docs.microsoft.com/en-us/graph/
- **API Explorer**: https://developer.microsoft.com/en-us/graph/graph-explorer
- **Permissions Reference**: https://docs.microsoft.com/en-us/graph/permissions-reference
- **SDK & Tools**: https://docs.microsoft.com/en-us/graph/sdks/sdks-overview

---

## Troubleshooting

### Common Issues

**1. "Insufficient privileges"**
- Missing OAuth scope
- Need admin consent
- Token not refreshed after scope change

**2. "Token not found or expired"**
- User needs to reconnect
- Refresh token expired
- Token was revoked

**3. "Failed to find user"**
- User doesn't exist in organization
- Email format incorrect
- Missing `User.ReadBasic.All` permission

**4. "Failed to create/get chat"**
- Invalid user IDs
- Missing `Chat.ReadWrite` permission
- Users in different tenants

**5. "API rate limit exceeded"**
- Too many requests
- Need to implement throttling
- Use batch requests when possible

---

## Summary

The Microsoft reactions system provides a robust framework for automating Microsoft 365 tasks. The three-layer architecture (schemas, reactions, executor) separates concerns effectively:

- **Schemas**: Define the user interface
- **Reactions**: Define the metadata and structure
- **Executor**: Implements the business logic

This modular approach makes it easy to add new reactions while maintaining consistency and code quality.
