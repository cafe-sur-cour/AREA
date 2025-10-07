import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

export interface MicrosoftTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface MicrosoftErrorResponse {
  error: string;
  error_description?: string;
}

export interface MicrosoftUser {
  id: string;
  userPrincipalName: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  jobTitle?: string;
  officeLocation?: string;
}

export class MicrosoftOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private tenantId: string;
  private microsoftApiBaseUrl: string;
  private microsoftAuthBaseUrl: string;
  private initialized: boolean = false;

  constructor() {
    this.clientId = '';
    this.clientSecret = '';
    this.redirectUri = '';
    this.tenantId = '';
    this.microsoftApiBaseUrl = 'https://graph.microsoft.com';
    this.microsoftAuthBaseUrl = 'https://login.microsoftonline.com';
  }

  private ensureInitialized(): void {
    if (this.initialized) return;

    this.clientId = process.env.SERVICE_MICROSOFT_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_MICROSOFT_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_MICROSOFT_REDIRECT_URI || '';
    this.tenantId = process.env.SERVICE_MICROSOFT_TENANT_ID || 'common';
    this.microsoftApiBaseUrl =
      process.env.SERVICE_MICROSOFT_API_BASE_URL ||
      'https://graph.microsoft.com';
    this.microsoftAuthBaseUrl =
      process.env.SERVICE_MICROSOFT_AUTH_BASE_URL ||
      'https://login.microsoftonline.com';

    if (
      !this.clientId ||
      !this.clientSecret ||
      !this.redirectUri ||
      !this.tenantId
    ) {
      throw new Error('Microsoft OAuth configuration missing');
    }

    this.initialized = true;
  }

  getAuthorizationUrl(state: string): string {
    this.ensureInitialized();
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid email profile User.Read',
      response_type: 'code',
      response_mode: 'query',
      state: state,
    });

    return `${this.microsoftAuthBaseUrl}/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<MicrosoftTokenResponse> {
    this.ensureInitialized();
    const url = `${this.microsoftAuthBaseUrl}/${this.tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: this.clientId,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    console.log('Microsoft OAuth - Exchange URL:', url);
    console.log('Microsoft OAuth - Redirect URI:', this.redirectUri);
    console.log('Microsoft OAuth - Client ID:', this.clientId);
    console.log('Microsoft OAuth - Tenant ID:', this.tenantId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body,
    });

    console.log('Microsoft OAuth - Response status:', response.status);
    console.log(
      'Microsoft OAuth - Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Microsoft OAuth - Error response:', errorText);
      throw new Error(
        `Microsoft OAuth token exchange failed: ${response.statusText} - ${errorText}`
      );
    }

    const data = (await response.json()) as
      | MicrosoftTokenResponse
      | MicrosoftErrorResponse;

    if ('error' in data) {
      console.error('Microsoft OAuth - API Error:', data);
      throw new Error(`Microsoft OAuth error: ${data.error}`);
    }

    return data;
  }

  async getUserInfo(accessToken: string): Promise<MicrosoftUser> {
    this.ensureInitialized();
    const response = await fetch(`${this.microsoftApiBaseUrl}/v1.0/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get Microsoft user info: ${response.statusText}`
      );
    }

    return (await response.json()) as MicrosoftUser;
  }

  async storeUserToken(
    userId: number,
    tokenData: MicrosoftTokenResponse
  ): Promise<void> {
    this.ensureInitialized();
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const existingToken = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'microsoft_access_token',
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
        token_type: 'microsoft_access_token',
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
          token_type: 'microsoft_refresh_token',
        },
      });

      if (existingRefreshToken) {
        existingRefreshToken.token_value = tokenData.refresh_token;
        await tokenRepository.save(existingRefreshToken);
      } else {
        const newRefreshToken = tokenRepository.create({
          user_id: userId,
          token_type: 'microsoft_refresh_token',
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
        token_type: 'microsoft_access_token',
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

    const tokens = await tokenRepository.find({
      where: {
        user_id: userId,
        token_type: 'microsoft_access_token',
      },
    });

    for (const token of tokens) {
      token.is_revoked = true;
      token.revoked_at = new Date();
      token.revoked_reason = 'User requested revocation';
      await tokenRepository.save(token);
    }
  }
}

export const microsoftOAuth = new MicrosoftOAuth();
