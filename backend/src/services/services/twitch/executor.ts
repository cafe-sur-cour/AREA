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
        case 'twitch.follow_channel':
          return await this.followChannel(reaction.config, validToken);
        case 'twitch.unfollow_channel':
          return await this.unfollowChannel(reaction.config, validToken);
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
      const response = await fetch(
        `${this.apiBaseUrl}/users?login=${encodeURIComponent(login)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': process.env.SERVICE_TWITCH_CLIENT_ID || '',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        data: Array<{ id: string; login: string }>;
      };
      return data.data?.[0]?.id || null;
    } catch (error) {
      console.error('Error fetching broadcaster ID:', error);
      return null;
    }
  }

  private async followChannel(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { broadcaster_login } = config as { broadcaster_login: string };

    if (!broadcaster_login) {
      return {
        success: false,
        error: 'Streamer username is required',
      };
    }

    try {
      const broadcasterId = await this.getBroadcasterId(
        broadcaster_login,
        accessToken
      );
      if (!broadcasterId) {
        return {
          success: false,
          error: `Streamer "${broadcaster_login}" not found`,
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/users/follows`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': process.env.SERVICE_TWITCH_CLIENT_ID || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_id: broadcasterId,
        }),
      });

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
            error:
              'Insufficient permissions. The user:edit:follows scope is required.',
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: `Channel "${broadcaster_login}" not found.`,
          };
        } else if (response.status === 422) {
          return {
            success: false,
            error: `Invalid streamer username: ${broadcaster_login}`,
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
          broadcaster_login: broadcaster_login,
          broadcaster_id: broadcasterId,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while following channel: ${(error as Error).message}`,
      };
    }
  }

  private async unfollowChannel(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { broadcaster_login } = config as { broadcaster_login: string };

    if (!broadcaster_login) {
      return {
        success: false,
        error: 'Streamer username is required',
      };
    }

    try {
      const broadcasterId = await this.getBroadcasterId(
        broadcaster_login,
        accessToken
      );
      if (!broadcasterId) {
        return {
          success: false,
          error: `Streamer "${broadcaster_login}" not found`,
        };
      }

      const response = await fetch(
        `${this.apiBaseUrl}/users/follows?to_id=${broadcasterId}`,
        {
          method: 'DELETE',
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
            error:
              'Insufficient permissions. The user:edit:follows scope is required.',
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: `Channel "${broadcaster_login}" not found or not followed.`,
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
          broadcaster_login: broadcaster_login,
          broadcaster_id: broadcasterId,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while unfollowing channel: ${(error as Error).message}`,
      };
    }
  }
}

export const twitchReactionExecutor = new TwitchReactionExecutor();
