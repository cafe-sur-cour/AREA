import fetch from 'node-fetch';
import { AppDataSource } from '../../../config/db';
import { UserToken } from '../../../config/entity/UserToken';

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in?: number;
}

export interface GitHubErrorResponse {
  error: string;
  error_description?: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
}

export class GitHubOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.SERVICE_GITHUB_CLIENT_ID || '';
    this.clientSecret = process.env.SERVICE_GITHUB_CLIENT_SECRET || '';
    this.redirectUri = process.env.SERVICE_GITHUB_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('GitHub OAuth configuration missing');
    }
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'repo,user',
      state: state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: this.redirectUri,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `GitHub OAuth token exchange failed: ${response.statusText}`
      );
    }

    const data = (await response.json()) as
      | GitHubTokenResponse
      | GitHubErrorResponse;

    if ('error' in data) {
      throw new Error(`GitHub OAuth error: ${data.error}`);
    }

    return data;
  }

  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'AREA-App',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get GitHub user info: ${response.statusText}`);
    }

    return (await response.json()) as GitHubUser;
  }

  async storeUserToken(
    userId: number,
    tokenData: GitHubTokenResponse
  ): Promise<void> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const existingToken = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'github_access_token',
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
        token_type: 'github_access_token',
        token_value: tokenData.access_token,
        expires_at: expiresAt,
        scopes: tokenData.scope.split(','),
      });
      await tokenRepository.save(newToken);
    }
  }

  async getUserToken(userId: number): Promise<UserToken | null> {
    const tokenRepository = AppDataSource.getRepository(UserToken);

    const token = await tokenRepository.findOne({
      where: {
        user_id: userId,
        token_type: 'github_access_token',
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
        token_type: 'github_access_token',
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

export const githubOAuth = new GitHubOAuth();
