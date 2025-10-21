import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';
import { redditOAuth } from './oauth';

class RedditReactionExecutor implements ReactionExecutor {
  async execute(
    context: ReactionExecutionContext
  ): Promise<ReactionExecutionResult> {
    const { reaction, event } = context;

    try {
      const userToken = await redditOAuth.getUserToken(event.user_id);
      if (!userToken) {
        return {
          success: false,
          error: 'Reddit authentication required',
        };
      }

      console.log(
        `[Reddit] User ${event.user_id} token scopes:`,
        userToken.scopes
      );

      switch (reaction.type) {
        case 'reddit.upvote_post':
          return await this.upvotePost(
            userToken.token_value,
            reaction.config as { post_id: string }
          );

        case 'reddit.post_comment':
          return await this.postComment(
            userToken.token_value,
            reaction.config as { post_id: string; comment_text: string },
            event.payload
          );

        default:
          return {
            success: false,
            error: `Unknown Reddit reaction type: ${reaction.type}`,
          };
      }
    } catch (error) {
      console.error('Error executing Reddit reaction:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async upvotePost(
    accessToken: string,
    config: { post_id: string }
  ): Promise<ReactionExecutionResult> {
    const { post_id } = config;

    if (!post_id) {
      return {
        success: false,
        error: 'Missing required field: post_id',
      };
    }

    try {
      const oauthBaseUrl =
        process.env.SERVICE_REDDIT_AUTH_API_BASE_URL ||
        'https://oauth.reddit.com';

      const response = await fetch(`${oauthBaseUrl}/api/vote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AREA-App/1.0',
        },
        body: new URLSearchParams({
          id: post_id,
          dir: '1', // 1 = upvote, 0 = remove vote, -1 = downvote
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Reddit API error: ${response.status} - ${errorText}`);
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
        error:
          error instanceof Error
            ? error.message
            : 'Failed to upvote Reddit post',
      };
    }
  }

  private async postComment(
    accessToken: string,
    config: { post_id: string; comment_text: string },
    payload: Record<string, unknown>
  ): Promise<ReactionExecutionResult> {
    const { post_id, comment_text } = config;

    if (!post_id || !comment_text) {
      return {
        success: false,
        error: 'Missing required fields: post_id or comment_text',
      };
    }

    let processedText = comment_text;
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const matches = Array.from(comment_text.matchAll(placeholderRegex));

    for (const match of matches) {
      if (match[1]) {
        const fieldPath = match[1].trim();
        const value = this.getNestedValue(payload, fieldPath);
        if (value !== undefined) {
          processedText = processedText.replace(match[0], String(value));
        }
      }
    }

    try {
      const oauthBaseUrl =
        process.env.SERVICE_REDDIT_AUTH_API_BASE_URL ||
        'https://oauth.reddit.com';

      const response = await fetch(`${oauthBaseUrl}/api/comment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AREA-App/1.0',
        },
        body: new URLSearchParams({
          thing_id: post_id,
          text: processedText,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Reddit API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as {
        json?: {
          data?: {
            things?: Array<{
              data?: {
                id?: string;
                permalink?: string;
              };
            }>;
          };
        };
      };

      const commentData = data?.json?.data?.things?.[0]?.data;
      const commentId = commentData?.id;
      const commentPermalink = commentData?.permalink;

      return {
        success: true,
        output: {
          success: true,
          comment_id: commentId || '',
          comment_url: commentPermalink
            ? `https://reddit.com${commentPermalink}`
            : '',
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to post comment on Reddit',
      };
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  }
}

export const redditReactionExecutor = new RedditReactionExecutor();
