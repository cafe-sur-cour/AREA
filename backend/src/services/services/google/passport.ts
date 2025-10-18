import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from 'passport-google-oauth20';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import {
  oauthLogin,
  connectOAuthProvider,
} from '../../../routes/auth/auth.service';
import { googleOAuth } from './oauth';
import { JWT_SECRET } from '../../../../index';
import { getCurrentUser } from '../../../utils/auth';

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

const googleScopes = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive',
];

export function initializeGooglePassport(): void {
  passport.use(
    'google-login',
    new GoogleStrategy(
      {
        clientID: process.env.SERVICE_GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.SERVICE_GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.SERVICE_GOOGLE_REDIRECT_URI || '',
        scope: googleScopes,
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        params: { expires_in?: number },
        profile: GoogleProfile,
        done: unknown
      ) => {
        const doneCallback = done as (
          error: Error | null,
          user?: GoogleUser | null
        ) => void;
        try {
          const userToken = await oauthLogin(
            'google',
            profile.id,
            profile.emails?.[0]?.value || '',
            profile.displayName ||
              profile.name?.givenName + ' ' + profile.name?.familyName ||
              ''
          );

          if (userToken instanceof Error) {
            return doneCallback(userToken, null);
          }

          const tokenData = {
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: params.expires_in || 3600,
            refresh_token: refreshToken,
            scope: googleScopes.join(' '),
          };

          const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
            id: number;
          };
          await googleOAuth.storeUserToken(decoded.id, tokenData);

          return doneCallback(null, {
            id: profile.id,
            name:
              profile.displayName ||
              profile.name?.givenName + ' ' + profile.name?.familyName ||
              '',
            email: profile.emails?.[0]?.value || '',
            token: userToken,
          });
        } catch (error) {
          return doneCallback(error as Error, null);
        }
      }
    )
  );

  passport.use(
    'google-subscribe',
    new GoogleStrategy(
      {
        clientID: process.env.SERVICE_GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.SERVICE_GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.SERVICE_GOOGLE_REDIRECT_URI || '',
        scope: googleScopes,
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        params: { expires_in?: number },
        profile: GoogleProfile,
        done: unknown
      ) => {
        const doneCallback = done as (
          error: Error | null,
          user?: GoogleUser | null
        ) => void;
        try {
          const currentUser = await getCurrentUser(req);
          if (!currentUser) {
            return doneCallback(new Error('User not authenticated'), null);
          }

          const userToken = await connectOAuthProvider(
            currentUser.id,
            'google',
            profile.id,
            profile.emails?.[0]?.value || '',
            profile.displayName ||
              profile.name?.givenName + ' ' + profile.name?.familyName ||
              ''
          );

          if (userToken instanceof Error) {
            return doneCallback(userToken, null);
          }

          const tokenData = {
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: params.expires_in || 3600,
            refresh_token: refreshToken,
            scope: googleScopes.join(' '),
          };

          const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
            id: number;
          };
          await googleOAuth.storeUserToken(decoded.id, tokenData);

          try {
            const { serviceSubscriptionManager } = await import(
              '../../ServiceSubscriptionManager'
            );
            await serviceSubscriptionManager.subscribeUser(
              decoded.id,
              'google'
            );
          } catch (subscriptionError) {
            console.error(
              'Error auto-subscribing user to Google service:',
              subscriptionError
            );
          }

          return doneCallback(null, {
            id: profile.id,
            name:
              profile.displayName ||
              profile.name?.givenName + ' ' + profile.name?.familyName ||
              '',
            email: profile.emails?.[0]?.value || '',
            token: userToken,
          });
        } catch (error) {
          return doneCallback(error as Error, null);
        }
      }
    )
  );
}
