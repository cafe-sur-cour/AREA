import passport from 'passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import {
  oauthLogin,
  connectOAuthProvider,
} from '../../../routes/auth/auth.service';
import { microsoftOAuth } from './oauth';
import { JWT_SECRET } from '../../../../index';
import { getCurrentUser } from '../../../utils/auth';

export interface MicrosoftUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export function initializeMicrosoftPassport(): void {
  passport.use(
    'microsoft-login',
    new CustomStrategy(
      async (
        req: Request,
        done: (error: Error | null, user?: MicrosoftUser | null) => void
      ) => {
        try {
          const { code } = req.query;
          if (!code || typeof code !== 'string') {
            return done(new Error('Authorization code is missing'), null);
          }

          const tokenData = await microsoftOAuth.exchangeCodeForToken(code);
          const userInfo = await microsoftOAuth.getUserInfo(
            tokenData.access_token
          );
          const userToken = await oauthLogin(
            'microsoft',
            userInfo.id,
            userInfo.mail || userInfo.userPrincipalName,
            userInfo.displayName
          );

          if (userToken instanceof Error) {
            return done(userToken, null);
          }

          const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
            id: number;
          };
          await microsoftOAuth.storeUserToken(decoded.id, tokenData);

          return done(null, {
            id: userInfo.id,
            name: userInfo.displayName,
            email: userInfo.mail || userInfo.userPrincipalName,
            token: userToken,
          });
        } catch (error) {
          return done(error as Error, null);
        }
      }
    )
  );

  passport.use(
    'microsoft-subscribe',
    new CustomStrategy(
      async (
        req: Request,
        done: (error: Error | null, user?: MicrosoftUser | null) => void
      ) => {
        try {
          const currentUser = await getCurrentUser(req);
          if (!currentUser) {
            return done(new Error('User not authenticated'), null);
          }

          const { code } = req.query;
          if (!code || typeof code !== 'string') {
            return done(new Error('Authorization code is missing'), null);
          }

          const tokenData = await microsoftOAuth.exchangeCodeForToken(code);
          const userInfo = await microsoftOAuth.getUserInfo(
            tokenData.access_token
          );

          const userToken = await connectOAuthProvider(
            currentUser.id,
            'microsoft',
            userInfo.id,
            userInfo.mail || userInfo.userPrincipalName,
            userInfo.displayName
          );

          if (userToken instanceof Error) {
            return done(userToken, null);
          }

          const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
            id: number;
          };
          await microsoftOAuth.storeUserToken(decoded.id, tokenData);

          try {
            const { serviceSubscriptionManager } = await import(
              '../../ServiceSubscriptionManager'
            );
            await serviceSubscriptionManager.subscribeUser(
              decoded.id,
              'microsoft'
            );
          } catch (subscriptionError) {
            console.error(
              'Error auto-subscribing user to Microsoft service:',
              subscriptionError
            );
          }

          return done(null, {
            id: userInfo.id,
            name: userInfo.displayName,
            email: userInfo.mail || userInfo.userPrincipalName,
            token: userToken,
          });
        } catch (error) {
          return done(error as Error, null);
        }
      }
    )
  );
}
