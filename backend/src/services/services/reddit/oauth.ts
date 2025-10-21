import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

export interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

export interface RedditErrorResponse {
  error: string;
  error_description?: string;
}

export interface RedditUser {
  id: string;
  name: string;
  created: number;
  comment_karma: number;
  link_karma: number;
}

export class RedditOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private redditApiBaseUrl: string;
  private redditAuthBaseUrl: string;
  private redditOAuthApiBaseUrl: string;

  constructor() {
    this.clientId = process.env.SERVICE_REDDIT_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_REDDIT_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_REDDIT_REDIRECT_URI || '';
    this.redditApiBaseUrl =
      process.env.SERVICE_REDDIT_API_BASE_URL || 'https://www.reddit.com';
    this.redditAuthBaseUrl =
      process.env.SERVICE_REDDIT_API_BASE_URL || 'https://www.reddit.com';
    this.redditOAuthApiBaseUrl =
      process.env.SERVICE_REDDIT_AUTH_API_BASE_URL ||
      'https://oauth.reddit.com';

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Reddit OAuth configuration missing');
    }
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      state: state,
      redirect_uri: this.redirectUri,
      duration: 'permanent',
      scope: 'identity read',
    });
    return `${this.redditAuthBaseUrl}/api/v1/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<RedditTokenResponse> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      'base64'
    );

    const response = await fetch(
      `${this.redditAuthBaseUrl}/api/v1/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
          'User-Agent': 'AREA-App/1.0',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Reddit OAuth token exchange failed: ${response.statusText}`
      );
    }

    const data = (await response.json()) as
      | RedditTokenResponse
      | RedditErrorResponse;

    if ('error' in data) {
      throw new Error(`Reddit OAuth error: ${data.error}`);
    }

    return data;
  }

  async getUserInfo(accessToken: string): Promise<RedditUser> {
    const response = await fetch(`${this.redditOAuthApiBaseUrl}/api/v1/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'AREA-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Reddit user info: ${response.statusText}`);
    }

    return (await response.json()) as RedditUser;
  }

  async storeUserToken(
    userId: number,
    tokenData: RedditTokenResponse
  ): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const existingToken = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'reddit_access_token',
      },
    });

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    if (existingToken) {
      existingToken.token_value = tokenData.access_token;
      existingToken.expires_at = expiresAt;
      await tokenRepository.save(existingToken);
    } else {
      const newToken = tokenRepository.create({
        user_id: userId,
        token_type: 'reddit_access_token',
        token_value: tokenData.access_token,
        expires_at: expiresAt,
        scopes: tokenData.scope.split(' '),
      });
      await tokenRepository.save(newToken);
    }
  }

  async getUserToken(userId: number): Promise<UserToken | null> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const token = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'reddit_access_token',
        is_revoked: false,
      },
    });

    if (token && token.expires_at && token.expires_at < new Date()) {
      return null;
    }

    return token;
  }

  async revokeUserToken(userId: number): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const token = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'reddit_access_token',
      },
    });

    if (token) {
      token.is_revoked = true;
      token.revoked_at = new Date();
      token.revoked_reason = 'User requested revocation';
      await tokenRepository.save(token);
    }
  }
}

export const redditOAuth = new RedditOAuth();
