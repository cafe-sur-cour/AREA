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
        case 'microsoft.send_email':
          return await this.sendEmail(reaction.config, validToken);
        case 'microsoft.reply_to_email':
          return await this.replyToEmail(reaction.config, validToken);
        case 'microsoft.create_calendar_event':
          return await this.createCalendarEvent(reaction.config, validToken);
        case 'microsoft.post_teams_channel_message':
          return await this.postTeamsChannelMessage(
            reaction.config,
            validToken
          );
        case 'microsoft.update_presence':
          return await this.updatePresence(reaction.config, validToken);
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

      const responseData = (await response.json()) as TeamsChatMessageResponse;

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

  private async sendEmail(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { to, subject, body, cc } = config as {
      to: string;
      subject: string;
      body: string;
      cc?: string;
    };

    if (!to || !subject || !body) {
      return {
        success: false,
        error: 'To, subject, and body are required',
      };
    }

    try {
      const emailPayload = {
        message: {
          subject: subject,
          body: {
            contentType: 'Text',
            content: body,
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
          ...(cc && {
            ccRecipients: cc.split(',').map((email: string) => ({
              emailAddress: {
                address: email.trim(),
              },
            })),
          }),
        },
        saveToSentItems: true,
      };

      const response = await fetch(
        `${this.apiBaseUrl}/v1.0/me/sendMail`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message ||
          'Unknown error';
        return {
          success: false,
          error: `Failed to send email: ${errorMessage}`,
        };
      }

      return {
        success: true,
        output: {
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while sending email: ${(error as Error).message}`,
      };
    }
  }

  private async replyToEmail(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { message_id, reply_body } = config as {
      message_id: string;
      reply_body: string;
    };

    if (!message_id || !reply_body) {
      return {
        success: false,
        error: 'Message ID and reply body are required',
      };
    }

    try {
      const replyPayload = {
        comment: reply_body,
      };

      const response = await fetch(
        `${this.apiBaseUrl}/v1.0/me/messages/${message_id}/reply`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(replyPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message ||
          'Unknown error';
        return {
          success: false,
          error: `Failed to reply to email: ${errorMessage}`,
        };
      }

      return {
        success: true,
        output: {
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while replying to email: ${(error as Error).message}`,
      };
    }
  }

  private async createCalendarEvent(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { subject, start_datetime, end_datetime, location, body, attendees } =
      config as {
        subject: string;
        start_datetime: string;
        end_datetime: string;
        location?: string;
        body?: string;
        attendees?: string;
      };

    if (!subject || !start_datetime || !end_datetime) {
      return {
        success: false,
        error: 'Subject, start datetime, and end datetime are required',
      };
    }

    try {
      const eventPayload = {
        subject: subject,
        start: {
          dateTime: start_datetime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: end_datetime,
          timeZone: 'UTC',
        },
        ...(location && {
          location: {
            displayName: location,
          },
        }),
        ...(body && {
          body: {
            contentType: 'Text',
            content: body,
          },
        }),
        ...(attendees && {
          attendees: attendees.split(',').map((email: string) => ({
            emailAddress: {
              address: email.trim(),
            },
            type: 'required',
          })),
        }),
      };

      const response = await fetch(
        `${this.apiBaseUrl}/v1.0/me/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message ||
          'Unknown error';
        return {
          success: false,
          error: `Failed to create calendar event: ${errorMessage}`,
        };
      }

      const eventData = (await response.json()) as {
        id: string;
        webLink: string;
      };

      return {
        success: true,
        output: {
          event_id: eventData.id,
          web_link: eventData.webLink,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while creating calendar event: ${(error as Error).message}`,
      };
    }
  }

  private async postTeamsChannelMessage(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { team_id, channel_id, message } = config as {
      team_id: string;
      channel_id: string;
      message: string;
    };

    if (!team_id || !channel_id || !message) {
      return {
        success: false,
        error: 'Team ID, channel ID, and message are required',
      };
    }

    try {
      const messagePayload = {
        body: {
          contentType: 'text',
          content: message,
        },
      };

      const response = await fetch(
        `${this.apiBaseUrl}/v1.0/teams/${team_id}/channels/${channel_id}/messages`,
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
          error: `Failed to post channel message: ${errorMessage}`,
        };
      }

      const responseData = (await response.json()) as { id: string };

      return {
        success: true,
        output: {
          message_id: responseData.id,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while posting channel message: ${(error as Error).message}`,
      };
    }
  }

  private async updatePresence(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { availability, activity, expiration_duration } = config as {
      availability: string;
      activity: string;
      expiration_duration?: string;
    };

    if (!availability || !activity) {
      return {
        success: false,
        error: 'Availability and activity are required',
      };
    }

    try {
      const presencePayload = {
        sessionId: `area-${Date.now()}`,
        availability: availability,
        activity: activity,
        ...(expiration_duration && {
          expirationDuration: expiration_duration,
        }),
      };

      const response = await fetch(
        `${this.apiBaseUrl}/v1.0/me/presence/setPresence`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(presencePayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message ||
          'Unknown error';
        return {
          success: false,
          error: `Failed to update presence: ${errorMessage}`,
        };
      }

      return {
        success: true,
        output: {
          success: true,
          availability: availability,
          activity: activity,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while updating presence: ${(error as Error).message}`,
      };
    }
  }
}

export const microsoftReactionExecutor = new MicrosoftReactionExecutor();
