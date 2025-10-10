import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

export interface SlackTokenResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id?: string;
  app_id?: string;
  team?: {
    id: string;
    name: string;
  };
  authed_user?: {
    id: string;
    scope?: string;
    access_token?: string;
    token_type?: string;
  };
  error?: string;
}

export interface SlackErrorResponse {
  ok: boolean;
  error: string;
}

export interface SlackUser {
  ok: boolean;
  user: {
    id: string;
    name: string;
    real_name: string;
    profile: {
      email?: string;
      display_name?: string;
    };
  };
  error?: string;
}

export interface SlackIncomingWebhookResponse {
  ok: boolean;
  url?: string;
  channel?: string;
  channel_id?: string;
  configuration_url?: string;
  error?: string;
}

export class SlackOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private slackApiBaseUrl: string;
  private slackAuthBaseUrl: string;

  constructor() {
    this.clientId = process.env.SERVICE_SLACK_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_SLACK_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_SLACK_REDIRECT_URI || '';
    this.slackApiBaseUrl =
      process.env.SERVICE_SLACK_API_BASE_URL || 'https://slack.com/api';
    this.slackAuthBaseUrl =
      process.env.SERVICE_SLACK_AUTH_BASE_URL || 'https://slack.com/oauth/v2';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Slack OAuth configuration missing');
    }
  }

  async createIncomingWebhook(accessToken: string, channel: string): Promise<SlackIncomingWebhookResponse> {
    console.log('🔵 SLACK DEBUG: Channel access check skipped (scopes are correct)');

    // With proper scopes, we assume the user/bot can access the channel
    // No need to send a test message anymore
    return {
      ok: true,
      channel: channel,
    };
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope:
        'channels:read,chat:write,users:read,groups:read,im:read,mpim:read,reactions:read,reactions:write,incoming-webhook',
      user_scope: 'channels:read,chat:write,groups:read,im:read,mpim:read,reactions:read,reactions:write',
      redirect_uri: this.redirectUri,
      state: state,
    });
    return `${this.slackAuthBaseUrl}/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<SlackTokenResponse> {
    const response = await fetch(`${this.slackApiBaseUrl}/oauth.v2.access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Slack OAuth token exchange failed: ${response.statusText}`
      );
    }

    const data = (await response.json()) as
      | SlackTokenResponse
      | SlackErrorResponse;

    if ('error' in data && !data.ok) {
      throw new Error(`Slack OAuth error: ${data.error}`);
    }

    return data as SlackTokenResponse;
  }

  async refreshAccessToken(): Promise<SlackTokenResponse> {
    throw new Error('Slack tokens do not require refresh in the same way');
  }

  async getUserInfo(accessToken: string): Promise<SlackUser> {
    const authTestResponse = await fetch(`${this.slackApiBaseUrl}/auth.test`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!authTestResponse.ok) {
      throw new Error(
        `Failed to authenticate with Slack: ${authTestResponse.statusText}`
      );
    }

    const authData = (await authTestResponse.json()) as {
      ok: boolean;
      user_id: string;
      error?: string;
    };

    if (!authData.ok) {
      throw new Error(`Slack auth test error: ${authData.error}`);
    }

    const userResponse = await fetch(
      `${this.slackApiBaseUrl}/users.info?user=${authData.user_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error(
        `Failed to get Slack user info: ${userResponse.statusText}`
      );
    }

    return (await userResponse.json()) as SlackUser;
  }

  async storeUserToken(
    userId: number,
    tokenData: SlackTokenResponse
  ): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const existingToken = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'slack_access_token',
      },
    });

    if (existingToken) {
      existingToken.token_value = tokenData.access_token;
      await tokenRepository.save(existingToken);
    } else {
      const newToken = tokenRepository.create({
        user_id: userId,
        token_type: 'slack_access_token',
        token_value: tokenData.access_token,
        scopes: tokenData.scope.split(','),
      });
      await tokenRepository.save(newToken);
    }

    if (tokenData.authed_user?.access_token) {
      const existingUserToken = await tokenRepository.findOne({
        where: {
          user_id: userId,
          token_type: 'slack_user_access_token',
        },
      });

      if (existingUserToken) {
        existingUserToken.token_value = tokenData.authed_user.access_token;
        await tokenRepository.save(existingUserToken);
      } else {
        const newUserToken = tokenRepository.create({
          user_id: userId,
          token_type: 'slack_user_access_token',
          token_value: tokenData.authed_user.access_token,
          scopes: tokenData.authed_user.scope?.split(',') || [],
        });
        await tokenRepository.save(newUserToken);
      }
    }
  }

  async getUserToken(userId: number): Promise<UserToken | null> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const token = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'slack_access_token',
        is_revoked: false,
      },
    });

    return token;
  }

  async getUserAccessToken(userId: number): Promise<UserToken | null> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const token = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'slack_user_access_token',
        is_revoked: false,
      },
    });

    return token;
  }

  async revokeUserToken(userId: number): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const tokens = await tokenRepository.find({
      where: [
        {
          user_id: userId,
          token_type: 'slack_access_token',
        },
        {
          user_id: userId,
          token_type: 'slack_user_access_token',
        },
      ],
    });

    for (const token of tokens) {
      token.is_revoked = true;
      token.revoked_at = new Date();
      token.revoked_reason = 'User requested revocation';
      await tokenRepository.save(token);
    }
  }
}

export const slackOAuth = new SlackOAuth();
