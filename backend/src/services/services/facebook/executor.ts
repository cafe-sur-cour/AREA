import type {
  ReactionExecutor,
  ReactionExecutionContext,
  ReactionExecutionResult,
} from '../../../types/service';

interface FacebookPostResponse {
  id: string;
}

interface FacebookPhotoResponse {
  id: string;
  post_id?: string;
}

export class FacebookReactionExecutor implements ReactionExecutor {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl =
      process.env.SERVICE_FACEBOOK_API_BASE_URL ||
      'https://graph.facebook.com';
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
          error: 'Facebook access token not configured',
        };
      }

      switch (reaction.type) {
        case 'facebook.post_to_feed':
          return await this.postToFeed(reaction.config, accessToken);
        case 'facebook.upload_photo':
          return await this.uploadPhoto(reaction.config, accessToken);
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

  private async postToFeed(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { message, link } = config as {
      message: string;
      link?: string;
    };

    if (!message) {
      return {
        success: false,
        error: 'Message is required for posting to feed',
      };
    }

    const params = new URLSearchParams({
      message,
      access_token: accessToken,
    });

    if (link) {
      params.append('link', link);
    }

    const response = await fetch(`${this.apiBaseUrl}/me/feed`, {
      method: 'POST',
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: { message?: string } };
      return {
        success: false,
        error: `Facebook API error: ${errorData.error?.message || 'Unknown error'}`,
      };
    }

    const data = await response.json() as FacebookPostResponse;

    return {
      success: true,
      output: {
        post: {
          id: data.id,
        },
      },
    };
  }

  private async uploadPhoto(
    config: Record<string, unknown>,
    accessToken: string
  ): Promise<ReactionExecutionResult> {
    const { image_url, caption } = config as {
      image_url: string;
      caption?: string;
    };

    if (!image_url) {
      return {
        success: false,
        error: 'Image URL is required for uploading photo',
      };
    }

    const form = new FormData();
    form.append('url', image_url);
    form.append('access_token', accessToken);
    if (caption) {
      form.append('caption', caption);
    }

    const response = await fetch(`${this.apiBaseUrl}/me/photos`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `Facebook API error: ${errorData.error?.message || 'Unknown error'}`,
      };
    }

    const data: FacebookPhotoResponse = await response.json();

    return {
      success: true,
      data: {
        photo: {
          id: data.id,
          post_id: data.post_id,
        },
      },
    };
  }
}

export const facebookReactionExecutor = new FacebookReactionExecutor();
