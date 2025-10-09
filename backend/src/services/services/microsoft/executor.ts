import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';
import { microsoftOAuth } from './oauth';

interface TeamsChatMessage {
  body: {
    contentType: string;
    content: string;
  };
}

interface TeamsChatMessageResponse {
  id: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  body: {
    contentType: string;
    content: string;
  };
  from: {
    user?: {
      id: string;
      displayName: string;
    };
  };
}

interface TeamsUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

interface CreateChatRequest {
  chatType: string;
  members: Array<{
    '@odata.type': string;
    roles: string[];
    'user@odata.bind': string;
  }>;
}

interface ChatResponse {
  id: string;
  chatType: string;
  createdDateTime: string;
}

export class MicrosoftReactionExecutor implements ReactionExecutor {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl =
      process.env.SERVICE_MICROSOFT_API_BASE_URL ||
      'https://graph.microsoft.com';
  }

  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const { reaction, serviceConfig } = context;

    try {
      const accessToken = serviceConfig.credentials?.access_token;
      if (!accessToken) {
        return {
          success: false,
          error: 'Microsoft access token not configured',
        };
      }

      const userToken = await microsoftOAuth.getUserToken(
        context.event.user_id
      );
      if (!userToken) {
        return {
          success: false,
          error: 'Microsoft access token not found or expired',
        };
      }

      const validToken = userToken.token_value;

      switch (reaction.type) {
        case 'microsoft.send_teams_chat_message':
          return await this.sendChatMessage(reaction.config, validToken);
        case 'microsoft.send_direct_message':
          return await this.sendDirectMessage(reaction.config, validToken);
        default:
          return {
            success: false,
            error: `Unknown reaction type: ${reaction.type}`,
          };
      }
    } catch (error) {
      console.error('Microsoft reaction execution error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async sendChatMessage(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { chat_id, message } = config as {
      chat_id: string;
      message: string;
    };

    if (!chat_id || !message) {
      return {
        success: false,
        error: 'Chat ID and message are required',
      };
    }

    try {
      const messagePayload: TeamsChatMessage = {
        body: {
          contentType: 'text',
          content: message,
        },
      };

      const response = await fetch(
        `${this.apiBaseUrl}/v1.0/chats/${chat_id}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messagePayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message ||
          'Unknown error';
        return {
          success: false,
          error: `Microsoft Graph API error: ${response.status} - ${errorMessage}`,
        };
      }

      const responseData =
        (await response.json()) as TeamsChatMessageResponse;

      return {
        success: true,
        output: {
          message_id: responseData.id,
          chat_id: chat_id,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while sending Teams chat message: ${(error as Error).message}`,
      };
    }
  }

  private async sendDirectMessage(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { user_email, message } = config as {
      user_email: string;
      message: string;
    };

    if (!user_email || !message) {
      return {
        success: false,
        error: 'User email and message are required',
      };
    }

    try {
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
        const errorData = await userResponse.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message ||
          'Unknown error';
        return {
          success: false,
          error: `Failed to find user: ${errorMessage}`,
        };
      }

      const targetUser = (await userResponse.json()) as TeamsUser;

      const meResponse = await fetch(`${this.apiBaseUrl}/v1.0/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!meResponse.ok) {
        return {
          success: false,
          error: 'Failed to get current user info',
        };
      }

      const currentUser = (await meResponse.json()) as TeamsUser;

      const createChatPayload: CreateChatRequest = {
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

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message ||
          'Unknown error';
        return {
          success: false,
          error: `Failed to create/get chat: ${errorMessage}`,
        };
      }

      const chat = (await chatResponse.json()) as ChatResponse;

      const messagePayload: TeamsChatMessage = {
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

      if (!messageResponse.ok) {
        const errorData = await messageResponse.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message ||
          'Unknown error';
        return {
          success: false,
          error: `Failed to send message: ${errorMessage}`,
        };
      }

      const messageData =
        (await messageResponse.json()) as TeamsChatMessageResponse;

      return {
        success: true,
        output: {
          message_id: messageData.id,
          chat_id: chat.id,
          user_email: user_email,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while sending direct message: ${(error as Error).message}`,
      };
    }
  }
}

export const microsoftReactionExecutor = new MicrosoftReactionExecutor();
