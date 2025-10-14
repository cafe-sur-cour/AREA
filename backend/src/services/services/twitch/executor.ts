import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';
import { twitchOAuth } from './oauth';

interface TwitchErrorResponse {
  error: string;
  status: number;
  message: string;
}

export class TwitchReactionExecutor implements ReactionExecutor {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl =
      process.env.SERVICE_TWITCH_API_BASE_URL || 'https://api.twitch.tv/helix';
  }

  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const { reaction } = context;

    try {
      const userToken = await twitchOAuth.getUserToken(context.event.user_id);
      if (!userToken) {
        return {
          success: false,
          error: 'Twitch access token not found or expired',
        };
      }

      const validToken = userToken.token_value;

      switch (reaction.type) {
        case 'twitch.update_channel':
          return await this.updateChannel(reaction.config, validToken);
        default:
          return {
            success: false,
            error: `Unknown reaction type: ${reaction.type}`,
          };
      }
    } catch (error) {
      console.error('Twitch reaction execution error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async getBroadcasterId(
    login: string,
    accessToken: string
  ): Promise<string | null> {
    try {
      const clientId = process.env.SERVICE_TWITCH_CLIENT_ID || '';

      if (!clientId) {
        return null;
      }

      const response = await fetch(
        `${this.apiBaseUrl}/users?login=${encodeURIComponent(login)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': clientId,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        data: Array<{ id: string; login: string; display_name: string }>;
      };

      if (!data.data || data.data.length === 0) {
        return null;
      }

      const user = data.data[0];
      if (!user) {
        return null;
      }

      return user.id;
    } catch {
      return null;
    }
  }

  private async getUserTwitchId(accessToken: string): Promise<string | null> {
    try {
      const clientId = process.env.SERVICE_TWITCH_CLIENT_ID || '';

      if (!clientId) {
        return null;
      }

      const response = await fetch(`${this.apiBaseUrl}/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': clientId,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        data: Array<{ id: string; login: string; display_name: string }>;
      };

      if (!data.data || data.data.length === 0) {
        return null;
      }

      const user = data.data[0];
      if (!user) {
        return null;
      }

      return user.id;
    } catch {
      return null;
    }
  }

  private async updateChannel(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { description } = config as { description: string };

    if (!description || description.trim().length === 0) {
      return {
        success: false,
        error: 'Channel description is required and cannot be empty',
      };
    }

    if (description.length > 300) {
      return {
        success: false,
        error: 'Channel description cannot exceed 300 characters',
      };
    }

    try {
      const userId = await this.getUserTwitchId(accessToken);
      if (!userId) {
        return {
          success: false,
          error: 'Failed to get authenticated user information',
        };
      }

      const currentUserResponse = await fetch(
        `${this.apiBaseUrl}/users?id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': process.env.SERVICE_TWITCH_CLIENT_ID || '',
          },
        }
      );

      let oldDescription = '';
      if (currentUserResponse.ok) {
        const currentUserData = (await currentUserResponse.json()) as {
          data: Array<{ description: string }>;
        };
        if (
          currentUserData.data &&
          currentUserData.data.length > 0 &&
          currentUserData.data[0]
        ) {
          oldDescription = currentUserData.data[0].description || '';
        }
      }

      const response = await fetch(
        `${this.apiBaseUrl}/users?description=${encodeURIComponent(description.trim())}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': process.env.SERVICE_TWITCH_CLIENT_ID || '',
          },
        }
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({}))) as TwitchErrorResponse;
        const errorMessage =
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        if (response.status === 401) {
          return {
            success: false,
            error:
              'Authentication failed. Please reauthorize your Twitch account.',
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: 'Insufficient permissions. The user:edit scope is required.',
          };
        } else if (response.status === 400) {
          return {
            success: false,
            error: `Invalid description: ${errorMessage}`,
          };
        } else if (response.status === 500) {
          return {
            success: false,
            error: 'Twitch API server error. Please try again later.',
          };
        }

        return {
          success: false,
          error: `Twitch API error: ${errorMessage}`,
        };
      }

      return {
        success: true,
        output: {
          broadcaster_id: userId,
          old_description: oldDescription,
          new_description: description.trim(),
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while updating channel: ${(error as Error).message}`,
      };
    }
  }
}

export const twitchReactionExecutor = new TwitchReactionExecutor();
