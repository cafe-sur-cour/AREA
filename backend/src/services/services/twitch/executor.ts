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
    const { description } = config as { description: string };

    console.log(
      `🎯 [Twitch] Starting update_channel reaction with description: "${description}"`
    );

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

      // Get current user information to capture old description
      console.log(`📡 [Twitch] Getting current user information...`);
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
        console.log(`📊 [Twitch] Current user data:`, currentUserData);
        if (
          currentUserData.data &&
          currentUserData.data.length > 0 &&
          currentUserData.data[0]
        ) {
          oldDescription = currentUserData.data[0].description || '';
          console.log(`📝 [Twitch] Current description: "${oldDescription}"`);
        }
      } else {
        console.log(
          `⚠️ [Twitch] Failed to get current user info: ${currentUserResponse.status}`
        );
      }

      console.log(
        `📡 [Twitch] Updating channel description to: "${description}"`
      );
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

      console.log(
        `📡 [Twitch] Update user API response status: ${response.status}`
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({}))) as TwitchErrorResponse;
        const errorMessage =
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        console.log(`❌ [Twitch] Update user API error: ${errorMessage}`);

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

      console.log(
        `✅ [Twitch] Successfully updated channel description to: "${description}"`
      );
      console.log(
        `📊 [Twitch] Description changed from "${oldDescription}" to "${description.trim()}"`
      );
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
      console.error(`❌ [Twitch] Network error while updating channel:`, error);
      return {
        success: false,
        error: `Network error while updating channel: ${(error as Error).message}`,
      };
    }
  }
}

export const twitchReactionExecutor = new TwitchReactionExecutor();
