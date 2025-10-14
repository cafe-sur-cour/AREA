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
        console.error(
          `❌ [Twitch] API error for "${login}": ${response.status} - ${errorText}`
        );
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
      console.error(
        `❌ [Twitch] Error fetching broadcaster ID for "${login}":`,
        error
      );
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

      console.log(
        `📡 [Twitch] User info API response status: ${response.status}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ [Twitch] Failed to get user info: ${response.status} - ${errorText}`
        );
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

      console.log(
        `✅ [Twitch] Authenticated user: ${user.login} (ID: ${user.id})`
      );
      return user.id;
    } catch (error) {
      console.error('❌ [Twitch] Error fetching user Twitch ID:', error);
      return null;
    }
  }

  private async updateChannel(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { title } = config as { title: string };

    console.log(
      `🎯 [Twitch] Starting update_channel reaction with title: "${title}"`
    );

    if (!title || title.trim().length === 0) {
      return {
        success: false,
        error: 'Channel title is required and cannot be empty',
      };
    }

    if (title.length > 140) {
      return {
        success: false,
        error: 'Channel title cannot exceed 140 characters',
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

      console.log(`📡 [Twitch] Getting current channel information...`);
      const currentChannelResponse = await fetch(
        `${this.apiBaseUrl}/channels?broadcaster_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': process.env.SERVICE_TWITCH_CLIENT_ID || '',
          },
        }
      );

      let oldTitle = '';
      if (currentChannelResponse.ok) {
        const currentChannelData = (await currentChannelResponse.json()) as {
          data: Array<{ title: string }>;
        };
        if (
          currentChannelData.data &&
          currentChannelData.data.length > 0 &&
          currentChannelData.data[0]
        ) {
          oldTitle = currentChannelData.data[0].title;
        }
      }

      console.log(`📡 [Twitch] Updating channel title to: "${title}"`);
      const response = await fetch(
        `${this.apiBaseUrl}/channels?broadcaster_id=${userId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': process.env.SERVICE_TWITCH_CLIENT_ID || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
          }),
        }
      );

      console.log(
        `📡 [Twitch] Update channel API response status: ${response.status}`
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({}))) as TwitchErrorResponse;
        const errorMessage =
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        console.log(`❌ [Twitch] Update channel API error: ${errorMessage}`);

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
              'Insufficient permissions. The channel:manage:broadcast scope is required.',
          };
        } else if (response.status === 400) {
          return {
            success: false,
            error: `Invalid title: ${errorMessage}`,
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

      console.log(
        `✅ [Twitch] Successfully updated channel title to: "${title}"`
      );
      return {
        success: true,
        output: {
          broadcaster_id: userId,
          old_title: oldTitle,
          new_title: title.trim(),
          success: true,
        },
      };
    } catch (error) {
      console.error(`❌ [Twitch] Network error while updating channel:`, error);
      return {
        success: false,
        error: `Network error while updating channel: ${(error as Error).message}`,
      };
    }
  }
}

export const twitchReactionExecutor = new TwitchReactionExecutor();
