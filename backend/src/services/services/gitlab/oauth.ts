import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

export interface GitLabTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface GitLabErrorResponse {
  error: string;
  error_description?: string;
}

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  email: string;
}

export class GitLabOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private gitlabApiBaseUrl: string;
  private gitlabAuthBaseUrl: string;
  private isConfigured: boolean = false;

  constructor() {
    this.clientId = process.env.SERVICE_GITLAB_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_GITLAB_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_GITLAB_REDIRECT_URI || '';
    this.gitlabApiBaseUrl =
      process.env.SERVICE_GITLAB_API_BASE_URL || 'https://gitlab.com/api/v4';
    this.gitlabAuthBaseUrl =
      process.env.SERVICE_GITLAB_AUTH_BASE_URL || 'https://gitlab.com';

    this.isConfigured = !!(this.clientId && this.clientSecret && this.redirectUri);
    
    if (!this.isConfigured) {
      console.warn('GitLab OAuth configuration missing - service will not be available');
    }
  }

  getAuthorizationUrl(state: string): string {
    if (!this.isConfigured) {
      throw new Error('GitLab OAuth configuration is missing');
    }
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'read_user read_api',
      state: state,
      response_type: 'code',
    });
    return `${this.gitlabAuthBaseUrl}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<GitLabTokenResponse> {
    if (!this.isConfigured) {
      throw new Error('GitLab OAuth configuration is missing');
    }
    const response = await fetch(`${this.gitlabAuthBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `GitLab OAuth token exchange failed: ${response.statusText}`
      );
    }

    const data = (await response.json()) as
      | GitLabTokenResponse
      | GitLabErrorResponse;

    if ('error' in data) {
      throw new Error(`GitLab OAuth error: ${data.error}`);
    }

    return data;
  }

  async getUserInfo(accessToken: string): Promise<GitLabUser> {
    const response = await fetch(`${this.gitlabApiBaseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'User-Agent': 'AREA-App',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get GitLab user info: ${response.statusText}`);
    }

    return (await response.json()) as GitLabUser;
  }

  async storeUserToken(
    userId: number,
    tokenData: GitLabTokenResponse
  ): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const existingToken = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'gitlab_access_token',
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
        token_type: 'gitlab_access_token',
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
        token_type: 'gitlab_access_token',
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
        token_type: 'gitlab_access_token',
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

export const gitlabOAuth = new GitLabOAuth();
