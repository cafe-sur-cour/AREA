import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

export interface FacebookTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface FacebookErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id?: string;
  };
}

export interface FacebookUser {
  id: string;
  name: string;
  email?: string;
}

export class FacebookOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private facebookApiBaseUrl: string;
  private facebookAuthBaseUrl: string;

  constructor() {
    this.clientId = process.env.SERVICE_FACEBOOK_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_FACEBOOK_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_FACEBOOK_REDIRECT_URI || '';
    this.facebookApiBaseUrl =
      process.env.SERVICE_FACEBOOK_API_BASE_URL || 'https://graph.facebook.com';
    this.facebookAuthBaseUrl =
      process.env.SERVICE_FACEBOOK_AUTH_BASE_URL || 'https://www.facebook.com';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Facebook OAuth configuration missing');
    }
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'email,public_profile,user_likes',
      state: state,
      response_type: 'code',
    });
    return `${this.facebookAuthBaseUrl}/v18.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<FacebookTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      client_secret: this.clientSecret,
      code: code,
    });
    const response = await fetch(
      `${this.facebookApiBaseUrl}/v18.0/oauth/access_token?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Facebook OAuth token exchange failed: ${response.statusText}`
      );
    }

    const data = (await response.json()) as
      | FacebookTokenResponse
      | FacebookErrorResponse;
    if ('error' in data) {
      throw new Error(
        `Facebook OAuth error: ${(data as FacebookErrorResponse).error.message}`
      );
    }
    return data as FacebookTokenResponse;
  }

  async getUserInfo(accessToken: string): Promise<FacebookUser> {
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,name,email',
    });
    const response = await fetch(
      `${this.facebookApiBaseUrl}/me?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get Facebook user info: ${response.statusText}`
      );
    }
    return (await response.json()) as FacebookUser;
  }

  async storeUserToken(
    userId: number,
    tokenData: FacebookTokenResponse
  ): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(UserToken);
    const existingToken = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'facebook_access_token',
      },
    });
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;
    if (existingToken) {
      existingToken.token_value = tokenData.access_token;
      existingToken.expires_at = expiresAt;
      existingToken.scopes = ['email', 'public_profile', 'user_likes'];
      await tokenRepository.save(existingToken);
    } else {
      const newToken = tokenRepository.create({
        user_id: userId,
        token_type: 'facebook_access_token',
        token_value: tokenData.access_token,
        expires_at: expiresAt,
        scopes: ['email', 'public_profile', 'user_likes'],
      });
      await tokenRepository.save(newToken);
    }
  }

  async getUserToken(userId: number): Promise<UserToken | null> {
    const tokenRepository = AppDataSource.getRepository(UserToken);
    const token = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'facebook_access_token',
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
        token_type: 'facebook_access_token',
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

export const facebookOAuth = new FacebookOAuth();
