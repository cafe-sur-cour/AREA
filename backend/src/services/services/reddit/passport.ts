import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { connectOAuthProvider } from '../../../routes/auth/auth.service';
import { redditOAuth } from './oauth';
import { JWT_SECRET } from '../../../../index';
import { getCurrentUser } from '../../../utils/auth';

export interface RedditUser {
  id: string;
  name: string;
  token: string;
}

export function initializeRedditPassport(): void {
  const baseUrl =
    process.env.SERVICE_REDDIT_API_BASE_URL || 'https://www.reddit.com';
  const scopes = 'identity read vote submit';

  const strategy = new OAuth2Strategy(
    {
      authorizationURL: `${baseUrl}/api/v1/authorize`,
      tokenURL: `${baseUrl}/api/v1/access_token`,
      clientID: process.env.SERVICE_REDDIT_CLIENT_ID || '',
      clientSecret: process.env.SERVICE_REDDIT_CLIENT_SECRET || '',
      callbackURL: process.env.SERVICE_REDDIT_REDIRECT_URI || '',
      scope: scopes,
      passReqToCallback: true,
      customHeaders: {
        'User-Agent': 'AREA-App/1.0',
      },
    },
    async (
      req: Request,
      accessToken: string,
      params: unknown,
      profile: unknown,
      done: unknown
    ) => {
      const doneCallback = done as (
        error: Error | null,
        user?: RedditUser | null
      ) => void;

      try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser) {
          return doneCallback(new Error('User not authenticated'), null);
        }

        const userInfo = await redditOAuth.getUserInfo(accessToken);

        const userToken = await connectOAuthProvider(
          currentUser.id,
          'reddit',
          userInfo.id,
          '', // Reddit doesn't provide email in basic scope
          userInfo.name
        );

        if (userToken instanceof Error) {
          return doneCallback(userToken, null);
        }

        const tokenData = {
          access_token: accessToken,
          token_type: 'bearer',
          expires_in: (params as { expires_in?: number }).expires_in || 3600,
          scope: scopes,
        };

        const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
          id: number;
        };
        await redditOAuth.storeUserToken(decoded.id, tokenData);

        try {
          const { serviceSubscriptionManager } = await import(
            '../../ServiceSubscriptionManager'
          );
          await serviceSubscriptionManager.subscribeUser(decoded.id, 'reddit');
        } catch (subscriptionError) {
          console.error(
            'Error auto-subscribing user to Reddit service:',
            subscriptionError
          );
        }

        return doneCallback(null, {
          id: userInfo.id,
          name: userInfo.name,
          token: userToken,
        });
      } catch (error) {
        return doneCallback(error as Error, null);
      }
    }
  );

  const strategyWithOAuth = strategy as unknown as {
    _oauth2: {
      getOAuthAccessToken: (
        code: string,
        params: Record<string, unknown>,
        callback: (
          error: Error | null,
          accessToken?: string,
          refreshToken?: string,
          params?: unknown
        ) => void
      ) => void;
      _customHeaders?: Record<string, string>;
    };
  };

  const originalGetOAuthAccessToken =
    strategyWithOAuth._oauth2.getOAuthAccessToken;

  strategyWithOAuth._oauth2.getOAuthAccessToken = function (
    this: typeof strategyWithOAuth._oauth2,
    code: string,
    params: Record<string, unknown>,
    callback: (
      error: Error | null,
      accessToken?: string,
      refreshToken?: string,
      params?: unknown
    ) => void
  ) {
    const clientId = process.env.SERVICE_REDDIT_CLIENT_ID || '';
    const clientSecret = process.env.SERVICE_REDDIT_CLIENT_SECRET || '';
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    this._customHeaders = {
      ...this._customHeaders,
      Authorization: `Basic ${auth}`,
      'User-Agent': 'AREA-App/1.0',
    };

    return originalGetOAuthAccessToken.call(this, code, params, callback);
  };

  passport.use('reddit-subscribe', strategy);
}
