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

interface TwitchBanRequest {
  user_id: string;
  duration?: number;
  reason?: string;
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
        case 'twitch.ban_user':
          return await this.banUser(reaction.config, validToken);
        case 'twitch.unban_user':
          return await this.unbanUser(reaction.config, validToken);
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

  private async banUser(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { username, duration, reason } = config as {
      username: string;
      duration?: number;
      reason?: string;
    };

    if (!username || username.trim().length === 0) {
      return {
        success: false,
        error: 'Username is required and cannot be empty',
      };
    }

    if (duration !== undefined && (duration < 1 || duration > 1209600)) {
      return {
        success: false,
        error:
          'Timeout duration must be between 1 and 1,209,600 seconds (2 weeks)',
      };
    }

    if (reason && reason.length > 500) {
      return {
        success: false,
        error: 'Ban reason cannot exceed 500 characters',
      };
    }

    try {
      // First, get the user ID from the username
      const targetUserId = await this.getBroadcasterId(
        username.trim(),
        accessToken
      );
      if (!targetUserId) {
        return {
          success: false,
          error: `User "${username.trim()}" not found`,
        };
      }

      const broadcasterId = await this.getUserTwitchId(accessToken);
      if (!broadcasterId) {
        return {
          success: false,
          error: 'Failed to get authenticated user information',
        };
      }

      const requestBody: TwitchBanRequest = {
        user_id: targetUserId,
      };

      if (duration !== undefined) {
        requestBody.duration = duration;
      }

      if (reason) {
        requestBody.reason = reason.trim();
      }

      const response = await fetch(
        `${this.apiBaseUrl}/moderation/bans?broadcaster_id=${broadcasterId}&moderator_id=${broadcasterId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': process.env.SERVICE_TWITCH_CLIENT_ID || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: requestBody }),
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
              'Insufficient permissions. The moderator:manage:banned_users scope is required.',
          };
        } else if (response.status === 400) {
          return {
            success: false,
            error: `Invalid request: ${errorMessage}`,
          };
        } else if (response.status === 409) {
          return {
            success: false,
            error: 'User is already banned or timed out',
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
          broadcaster_id: broadcasterId,
          username: username.trim(),
          duration: duration || null,
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while banning user: ${(error as Error).message}`,
      };
    }
  }

  private async unbanUser(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { username } = config as { username: string };

    if (!username || username.trim().length === 0) {
      return {
        success: false,
        error: 'Username is required and cannot be empty',
      };
    }

    try {
      // First, get the user ID from the username
      const targetUserId = await this.getBroadcasterId(
        username.trim(),
        accessToken
      );
      if (!targetUserId) {
        return {
          success: false,
          error: `User "${username.trim()}" not found`,
        };
      }

      const broadcasterId = await this.getUserTwitchId(accessToken);
      if (!broadcasterId) {
        return {
          success: false,
          error: 'Failed to get authenticated user information',
        };
      }

      const response = await fetch(
        `${this.apiBaseUrl}/moderation/bans?broadcaster_id=${broadcasterId}&moderator_id=${broadcasterId}&user_id=${encodeURIComponent(targetUserId)}`,
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
              'Insufficient permissions. The moderator:manage:banned_users scope is required.',
          };
        } else if (response.status === 400) {
          return {
            success: false,
            error: `Invalid request: ${errorMessage}`,
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: 'User is not currently banned',
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
          broadcaster_id: broadcasterId,
          username: username.trim(),
          success: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while unbanning user: ${(error as Error).message}`,
      };
    }
  }
}

export const twitchReactionExecutor = new TwitchReactionExecutor();
