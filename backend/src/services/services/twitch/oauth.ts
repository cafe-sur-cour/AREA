import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

export interface TwitchTokenResponse {
  access_token: string;
  token_type: string;
  scope: string[] | string;
  expires_in: number;
  refresh_token?: string;
}

export interface TwitchErrorResponse {
  status: number;
  message: string;
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  email?: string;
  profile_image_url: string;
  broadcaster_type: string;
  description: string;
}

export class TwitchOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private twitchApiBaseUrl: string;
  private twitchAuthBaseUrl: string;

  constructor() {
    this.clientId = process.env.SERVICE_TWITCH_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_TWITCH_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_TWITCH_REDIRECT_URI || '';
    this.twitchApiBaseUrl =
      process.env.SERVICE_TWITCH_API_BASE_URL || 'https://api.twitch.tv/helix';
    this.twitchAuthBaseUrl =
      process.env.SERVICE_TWITCH_AUTH_BASE_URL || 'https://id.twitch.tv/oauth2';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Twitch OAuth configuration missing');
    }
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'user:read:email user:edit',
      state: state,
    });
    return `${this.twitchAuthBaseUrl}/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TwitchTokenResponse> {
    const response = await fetch(`${this.twitchAuthBaseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as TwitchErrorResponse;
      throw new Error(
        `Twitch OAuth token exchange failed: ${errorData.message || response.statusText}`
      );
    }

    const data = (await response.json()) as TwitchTokenResponse;
    return data;
  }

  async refreshAccessToken(refreshToken: string): Promise<TwitchTokenResponse> {
    const response = await fetch(`${this.twitchAuthBaseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as TwitchErrorResponse;
      throw new Error(
        `Twitch OAuth token refresh failed: ${errorData.message || response.statusText}`
      );
    }

    const data = (await response.json()) as TwitchTokenResponse;
    return data;
  }

  async getUserInfo(accessToken: string): Promise<TwitchUser> {
    const response = await fetch(`${this.twitchApiBaseUrl}/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Twitch user info: ${response.statusText}`);
    }

    const data = (await response.json()) as { data: TwitchUser[] };

    if (!data.data || data.data.length === 0) {
      throw new Error('No user data returned from Twitch API');
    }

    const user = data.data[0];
    if (!user) {
      throw new Error('No user data in Twitch API response');
    }

    return user;
  }

  async storeUserToken(
    userId: number,
    tokenData: TwitchTokenResponse
  ): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const existingToken = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'twitch_access_token',
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
      const scopes = Array.isArray(tokenData.scope)
        ? tokenData.scope
        : typeof tokenData.scope === 'string'
          ? tokenData.scope.split(' ')
          : [];

      const newToken = tokenRepository.create({
        user_id: userId,
        token_type: 'twitch_access_token',
        token_value: tokenData.access_token,
        expires_at: expiresAt,
        scopes: scopes,
      });
      await tokenRepository.save(newToken);
    }

    if (tokenData.refresh_token) {
      const existingRefreshToken = await tokenRepository.findOne({
        where: {
          user_id: userId,
          token_type: 'twitch_refresh_token',
        },
      });

      if (existingRefreshToken) {
        existingRefreshToken.token_value = tokenData.refresh_token;
        await tokenRepository.save(existingRefreshToken);
      } else {
        const scopes = Array.isArray(tokenData.scope)
          ? tokenData.scope
          : typeof tokenData.scope === 'string'
            ? tokenData.scope.split(' ')
            : [];

        const newRefreshToken = tokenRepository.create({
          user_id: userId,
          token_type: 'twitch_refresh_token',
          token_value: tokenData.refresh_token,
          scopes: scopes,
        });
        await tokenRepository.save(newRefreshToken);
      }
    }
  }

  async getUserToken(userId: number): Promise<UserToken | null> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const token = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'twitch_access_token',
        is_revoked: false,
      },
    });

    if (token && token.expires_at && token.expires_at < new Date()) {
      const refreshToken = await tokenRepository.findOne({
        where: {
          user_id: userId,
          token_type: 'twitch_refresh_token',
          is_revoked: false,
        },
      });

      if (refreshToken) {
        try {
          const newTokenData = await this.refreshAccessToken(
            refreshToken.token_value
          );
          await this.storeUserToken(userId, newTokenData);
          return await tokenRepository.findOne({
            where: {
              user_id: userId,
              token_type: 'twitch_access_token',
              is_revoked: false,
            },
          });
        } catch (error) {
          console.error('Failed to refresh Twitch token:', error);
          return null;
        }
      }
      return null;
    }

    return token;
  }

  async revokeUserToken(userId: number): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const tokens = await tokenRepository.find({
      where: [
        {
          user_id: userId,
          token_type: 'twitch_access_token',
        },
        {
          user_id: userId,
          token_type: 'twitch_refresh_token',
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

export const twitchOAuth = new TwitchOAuth();
