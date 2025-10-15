import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

export interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface GoogleErrorResponse {
  error: string;
  error_description?: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export class GoogleOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private googleApiBaseUrl: string;
  private googleAuthBaseUrl: string;
  private initialized: boolean = false;

  constructor() {
    this.clientId = '';
    this.clientSecret = '';
    this.redirectUri = '';
    this.googleApiBaseUrl = 'https://www.googleapis.com';
    this.googleAuthBaseUrl = 'https://accounts.google.com';
  }

  private ensureInitialized(): void {
    if (this.initialized) return;

    this.clientId = process.env.SERVICE_GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_GOOGLE_REDIRECT_URI || '';
    this.googleApiBaseUrl =
      process.env.SERVICE_GOOGLE_API_BASE_URL || 'https://www.googleapis.com';
    this.googleAuthBaseUrl =
      process.env.SERVICE_GOOGLE_AUTH_BASE_URL || 'https://accounts.google.com';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Google OAuth configuration missing');
    }

    this.initialized = true;
  }

  getAuthorizationUrl(state: string): string {
    this.ensureInitialized();
    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: state,
    });
    return `${this.googleAuthBaseUrl}/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
    this.ensureInitialized();
    const response = await fetch(`${this.googleAuthBaseUrl}/o/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
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
      throw new Error(
        `Google OAuth token exchange failed: ${response.statusText}`
      );
    }

    const data = (await response.json()) as
      | GoogleTokenResponse
      | GoogleErrorResponse;

    if ('error' in data) {
      throw new Error(`Google OAuth error: ${data.error}`);
    }

    return data;
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<GoogleTokenResponse> {
    this.ensureInitialized();
    const response = await fetch(`${this.googleAuthBaseUrl}/o/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Google OAuth token refresh failed: ${response.statusText}`
      );
    }

    const data = (await response.json()) as
      | GoogleTokenResponse
      | GoogleErrorResponse;

    if ('error' in data) {
      throw new Error(`Google OAuth refresh error: ${data.error}`);
    }

    return data;
  }

  async getUserInfo(accessToken: string): Promise<GoogleUser> {
    this.ensureInitialized();
    const response = await fetch(
      `${this.googleApiBaseUrl}/oauth2/v2/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get Google user info: ${response.statusText}`);
    }

    return (await response.json()) as GoogleUser;
  }

  async storeUserToken(
    userId: number,
    tokenData: GoogleTokenResponse
  ): Promise<void> {
    this.ensureInitialized();
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const existingToken = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'google_access_token',
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
        token_type: 'google_access_token',
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
          token_type: 'google_refresh_token',
        },
      });

      if (existingRefreshToken) {
        existingRefreshToken.token_value = tokenData.refresh_token;
        await tokenRepository.save(existingRefreshToken);
      } else {
        const newRefreshToken = tokenRepository.create({
          user_id: userId,
          token_type: 'google_refresh_token',
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
        token_type: 'google_access_token',
        is_revoked: false,
      },
    });

    if (!token) {
      return null;
    }

    if (token && token.expires_at && token.expires_at < new Date()) {
      const refreshToken = await tokenRepository.findOne({
        where: {
          user_id: userId,
          token_type: 'google_refresh_token',
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
              token_type: 'google_access_token',
              is_revoked: false,
            },
          });
        } catch (error) {
          console.error('Failed to refresh Google token:', error);
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
          token_type: 'google_access_token',
        },
        {
          user_id: userId,
          token_type: 'google_refresh_token',
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

export const googleOAuth = new GoogleOAuth();
