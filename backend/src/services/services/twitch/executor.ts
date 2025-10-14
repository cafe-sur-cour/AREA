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
      const clientId = process.env.SERVICE_TWITCH_CLIENT_ID || '';
      console.log(`🔍 [Twitch] Looking up broadcaster ID for "${login}"`);

      if (!clientId) {
        console.error('❌ [Twitch] SERVICE_TWITCH_CLIENT_ID not configured');
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

      console.log(`📡 [Twitch] API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Twitch] API error for "${login}": ${response.status} - ${errorText}`);
        return null;
      }

      const data = (await response.json()) as {
        data: Array<{ id: string; login: string; display_name: string }>;
      };

      console.log(`📊 [Twitch] API response data:`, data);

      if (!data.data || data.data.length === 0) {
        console.log(`⚠️ [Twitch] No user found for login "${login}"`);
        return null;
      }

      const user = data.data[0];
      if (!user) {
        console.log(`⚠️ [Twitch] User data is empty for "${login}"`);
        return null;
      }

      console.log(`✅ [Twitch] Found user: ${user.login} (ID: ${user.id})`);
      return user.id;
    } catch (error) {
      console.error(`❌ [Twitch] Error fetching broadcaster ID for "${login}":`, error);
      return null;
    }
  }

  private async getUserTwitchId(accessToken: string): Promise<string | null> {
    try {
      const clientId = process.env.SERVICE_TWITCH_CLIENT_ID || '';
      console.log(`🔍 [Twitch] Getting authenticated user ID`);

      if (!clientId) {
        console.error('❌ [Twitch] SERVICE_TWITCH_CLIENT_ID not configured');
        return null;
      }

      const response = await fetch(`${this.apiBaseUrl}/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': clientId,
        },
      });

      console.log(`📡 [Twitch] User info API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Twitch] Failed to get user info: ${response.status} - ${errorText}`);
        return null;
      }

      const data = (await response.json()) as {
        data: Array<{ id: string; login: string; display_name: string }>;
      };

      console.log(`📊 [Twitch] User info response data:`, data);

      if (!data.data || data.data.length === 0) {
        console.log(`⚠️ [Twitch] No user data returned`);
        return null;
      }

      const user = data.data[0];
      if (!user) {
        console.log(`⚠️ [Twitch] User data is empty`);
        return null;
      }

      console.log(`✅ [Twitch] Authenticated user: ${user.login} (ID: ${user.id})`);
      return user.id;
    } catch (error) {
      console.error('❌ [Twitch] Error fetching user Twitch ID:', error);
      return null;
    }
  }

  private async followChannel(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { broadcaster_login } = config as { broadcaster_login: string };

    console.log(`🎯 [Twitch] Starting follow_channel reaction for "${broadcaster_login}"`);

    if (!broadcaster_login) {
      return {
        success: false,
        error: 'Streamer username is required',
      };
    }

    try {
      console.log(`🔑 [Twitch] Getting authenticated user ID...`);
      const userId = await this.getUserTwitchId(accessToken);
      if (!userId) {
        console.log(`❌ [Twitch] Failed to get authenticated user ID`);
        return {
          success: false,
          error: 'Failed to get authenticated user information',
        };
      }
      console.log(`✅ [Twitch] Authenticated user ID: ${userId}`);

      console.log(`🔍 [Twitch] Looking up broadcaster ID for "${broadcaster_login}"...`);
      const broadcasterId = await this.getBroadcasterId(
        broadcaster_login,
        accessToken
      );
      if (!broadcasterId) {
        console.log(`❌ [Twitch] Broadcaster "${broadcaster_login}" not found`);
        return {
          success: false,
          error: `Streamer "${broadcaster_login}" not found`,
        };
      }
      console.log(`✅ [Twitch] Broadcaster ID: ${broadcasterId}`);

      console.log(`📡 [Twitch] Making follow request...`);
      const response = await fetch(`${this.apiBaseUrl}/users/follows`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': process.env.SERVICE_TWITCH_CLIENT_ID || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_id: userId,
          to_id: broadcasterId,
        }),
      });

      console.log(`📡 [Twitch] Follow API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({}))) as TwitchErrorResponse;
        const errorMessage =
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        console.log(`❌ [Twitch] Follow API error: ${errorMessage}`);

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

      console.log(`✅ [Twitch] Successfully followed "${broadcaster_login}"`);
      return {
        success: true,
        output: {
          broadcaster_login: broadcaster_login,
          broadcaster_id: broadcasterId,
          user_id: userId,
          success: true,
        },
      };
    } catch (error) {
      console.error(`❌ [Twitch] Network error while following channel:`, error);
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
