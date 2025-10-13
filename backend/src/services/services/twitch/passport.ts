import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import {
  oauthLogin,
  connectOAuthProvider,
} from '../../../routes/auth/auth.service';
import { twitchOAuth } from './oauth';
import { JWT_SECRET } from '../../../../index';
import { getCurrentUser } from '../../../utils/auth';

export interface TwitchUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export function initializeTwitchPassport(): void {
  passport.use(
    'twitch-login',
    new OAuth2Strategy(
      {
        authorizationURL: `${process.env.SERVICE_TWITCH_AUTH_BASE_URL || 'https://id.twitch.tv/oauth2'}/authorize`,
        tokenURL: `${process.env.SERVICE_TWITCH_AUTH_BASE_URL || 'https://id.twitch.tv/oauth2'}/token`,
        clientID: process.env.SERVICE_TWITCH_CLIENT_ID || '',
        clientSecret: process.env.SERVICE_TWITCH_CLIENT_SECRET || '',
        callbackURL: process.env.SERVICE_TWITCH_REDIRECT_URI || '',
        scope: 'user:read:email',
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        params: { expires_in?: number; scope?: string },
        profile: unknown,
        done: unknown
      ) => {
        const doneCallback = done as (
          error: Error | null,
          user?: TwitchUser | null
        ) => void;
        try {
          const userInfo = await twitchOAuth.getUserInfo(accessToken);

          const userToken = await oauthLogin(
            'twitch',
            userInfo.id,
            userInfo.email || '',
            userInfo.display_name || userInfo.login
          );

          if (userToken instanceof Error) {
            return doneCallback(userToken, null);
          }

          const tokenData = {
            access_token: accessToken,
            token_type: 'bearer',
            scope: params.scope || 'user:read:email',
            expires_in: params.expires_in || 3600,
            refresh_token: refreshToken,
          };

          const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
            id: number;
          };
          await twitchOAuth.storeUserToken(decoded.id, tokenData);

          return doneCallback(null, {
            id: userInfo.id,
            name: userInfo.display_name || userInfo.login,
            email: userInfo.email || '',
            token: userToken,
          });
        } catch (error) {
          return doneCallback(error as Error, null);
        }
      }
    )
  );

  passport.use(
    'twitch-subscribe',
    new OAuth2Strategy(
      {
        authorizationURL: `${process.env.SERVICE_TWITCH_AUTH_BASE_URL || 'https://id.twitch.tv/oauth2'}/authorize`,
        tokenURL: `${process.env.SERVICE_TWITCH_AUTH_BASE_URL || 'https://id.twitch.tv/oauth2'}/token`,
        clientID: process.env.SERVICE_TWITCH_CLIENT_ID || '',
        clientSecret: process.env.SERVICE_TWITCH_CLIENT_SECRET || '',
        callbackURL: process.env.SERVICE_TWITCH_REDIRECT_URI || '',
        scope: 'user:read:email channel:read:subscriptions',
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        params: { expires_in?: number; scope?: string },
        profile: unknown,
        done: unknown
      ) => {
        const doneCallback = done as (
          error: Error | null,
          user?: TwitchUser | null
        ) => void;
        try {
          const currentUser = await getCurrentUser(req);
          if (!currentUser) {
            return doneCallback(new Error('User not authenticated'), null);
          }

          const userInfo = await twitchOAuth.getUserInfo(accessToken);

          const userToken = await connectOAuthProvider(
            currentUser.id,
            'twitch',
            userInfo.id,
            userInfo.email || '',
            userInfo.display_name || userInfo.login
          );

          if (userToken instanceof Error) {
            return doneCallback(userToken, null);
          }

          const tokenData = {
            access_token: accessToken,
            token_type: 'bearer',
            scope: params.scope || 'user:read:email channel:read:subscriptions',
            expires_in: params.expires_in || 3600,
            refresh_token: refreshToken,
          };

          const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
            id: number;
          };
          await twitchOAuth.storeUserToken(decoded.id, tokenData);

          try {
            const { serviceSubscriptionManager } = await import(
              '../../ServiceSubscriptionManager'
            );
            await serviceSubscriptionManager.subscribeUser(
              decoded.id,
              'twitch'
            );
          } catch (subscriptionError) {
            console.error(
              'Error auto-subscribing user to Twitch service:',
              subscriptionError
            );
          }

          return doneCallback(null, {
            id: userInfo.id,
            name: userInfo.display_name || userInfo.login,
            email: userInfo.email || '',
            token: userToken,
          });
        } catch (error) {
          return doneCallback(error as Error, null);
        }
      }
    )
  );
}
