import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';
import { facebookOAuth } from './oauth';

export class FacebookReactionExecutor implements ReactionExecutor {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl =
      process.env.SERVICE_FACEBOOK_API_BASE_URL || 'https://graph.facebook.com';
  }

  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const { reaction } = context;

    try {
      const userToken = await facebookOAuth.getUserToken(context.event.user_id);
      if (!userToken) {
        return {
          success: false,
          error: 'Facebook access token not found or expired',
        };
      }

      const accessToken = userToken.token_value;

      switch (reaction.type) {
        case 'facebook.like_post':
          return await this.likePost(reaction.config, accessToken);
        default:
          return {
            success: false,
            error: `Unknown reaction type: ${reaction.type}`,
          };
      }
    } catch (error) {
      console.error('Facebook reaction execution error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async likePost(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { post_id } = config as { post_id: string };

    if (!post_id) {
      return {
        success: false,
        error: 'Post ID is required',
      };
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/v18.0/${post_id}/likes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message ||
          'Unknown error';
        return {
          success: false,
          error: `Facebook Graph API error: ${response.status} - ${errorMessage}`,
        };
      }

      return {
        success: true,
        output: {
          success: true,
          post_id: post_id,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error while liking post: ${(error as Error).message}`,
      };
    }
  }
}

export const facebookReactionExecutor = new FacebookReactionExecutor();
