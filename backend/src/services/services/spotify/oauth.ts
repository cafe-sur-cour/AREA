import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifyErrorResponse {
  error: string;
  error_description?: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
}

export class SpotifyOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private spotifyApiBaseUrl: string;
  private spotifyAuthBaseUrl: string;

  constructor() {
    this.clientId = process.env.SERVICE_SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_SPOTIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_SPOTIFY_REDIRECT_URI || '';
    this.spotifyApiBaseUrl =
      process.env.SERVICE_SPOTIFY_API_BASE_URL || 'https://api.spotify.com';
    this.spotifyAuthBaseUrl =
      process.env.SERVICE_SPOTIFY_AUTH_BASE_URL ||
      'https://accounts.spotify.com';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Spotify OAuth configuration missing');
    }
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'user-read-email user-read-private',
      state: state,
    });
    return `${this.spotifyAuthBaseUrl}/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<SpotifyTokenResponse> {
    const response = await fetch(`${this.spotifyAuthBaseUrl}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.clientId}:${this.clientSecret}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Spotify OAuth token exchange failed: ${response.statusText}`
      );
    }

    const data = (await response.json()) as
      | SpotifyTokenResponse
      | SpotifyErrorResponse;

    if ('error' in data) {
      throw new Error(`Spotify OAuth error: ${data.error}`);
    }

    return data;
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<SpotifyTokenResponse> {
    const response = await fetch(`${this.spotifyAuthBaseUrl}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.clientId}:${this.clientSecret}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Spotify OAuth token refresh failed: ${response.statusText}`
      );
    }

    const data = (await response.json()) as
      | SpotifyTokenResponse
      | SpotifyErrorResponse;

    if ('error' in data) {
      throw new Error(`Spotify OAuth refresh error: ${data.error}`);
    }

    return data;
  }

  async getUserInfo(accessToken: string): Promise<SpotifyUser> {
    const response = await fetch(`${this.spotifyApiBaseUrl}/v1/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get Spotify user info: ${response.statusText}`
      );
    }

    return (await response.json()) as SpotifyUser;
  }

  async storeUserToken(
    userId: number,
    tokenData: SpotifyTokenResponse
  ): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const existingToken = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'spotify_access_token',
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
        token_type: 'spotify_access_token',
        token_value: tokenData.access_token,
        expires_at: expiresAt,
        scopes: tokenData.scope.split(' '),
      });
      await tokenRepository.save(newToken);
    }

    if (tokenData.refresh_token) {
      const existingRefreshToken = await tokenRepository.findOne({
        where: {
          user_id: userId,
          token_type: 'spotify_refresh_token',
        },
      });

      if (existingRefreshToken) {
        existingRefreshToken.token_value = tokenData.refresh_token;
        await tokenRepository.save(existingRefreshToken);
      } else {
        const newRefreshToken = tokenRepository.create({
          user_id: userId,
          token_type: 'spotify_refresh_token',
          token_value: tokenData.refresh_token,
          scopes: tokenData.scope.split(' '),
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
        token_type: 'spotify_access_token',
        is_revoked: false,
      },
    });

    if (token && token.expires_at && token.expires_at < new Date()) {
      const refreshToken = await tokenRepository.findOne({
        where: {
          user_id: userId,
          token_type: 'spotify_refresh_token',
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
              token_type: 'spotify_access_token',
              is_revoked: false,
            },
          });
        } catch (error) {
          console.error('Failed to refresh Spotify token:', error);
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
          token_type: 'spotify_access_token',
        },
        {
          user_id: userId,
          token_type: 'spotify_refresh_token',
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

export const spotifyOAuth = new SpotifyOAuth();
