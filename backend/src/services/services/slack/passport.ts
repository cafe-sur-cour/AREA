import passport from 'passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { connectOAuthProvider } from '../../../routes/auth/auth.service';
import { slackOAuth } from './oauth';
import { JWT_SECRET } from '../../../../index';
import { getCurrentUser } from '../../../utils/auth';

export interface SlackUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export function initializeSlackPassport(): void {
  passport.use(
    'slack-subscribe',
    new CustomStrategy(
      async (
        req: Request,
        done: (error: Error | null, user?: SlackUser | null) => void
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

          const tokenData = await slackOAuth.exchangeCodeForToken(code);
          const userInfo = await slackOAuth.getUserInfo(tokenData.access_token);

          const userToken = await connectOAuthProvider(
            currentUser.id,
            'slack',
            userInfo.user.id,
            userInfo.user.profile?.email || '',
            userInfo.user.real_name || userInfo.user.name
          );

          if (userToken instanceof Error) {
            return done(userToken, null);
          }

          const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
            id: number;
          };
          await slackOAuth.storeUserToken(decoded.id, tokenData);

          try {
            const { serviceSubscriptionManager } = await import(
              '../../ServiceSubscriptionManager'
            );
            await serviceSubscriptionManager.subscribeUser(decoded.id, 'slack');
          } catch (subscriptionError) {
            console.error(
              'Error auto-subscribing user to Slack service:',
              subscriptionError
            );
          }

          return done(null, {
            id: userInfo.user.id,
            name: userInfo.user.real_name || userInfo.user.name,
            email: userInfo.user.profile?.email || '',
            token: userToken,
          });
        } catch (error) {
          return done(error as Error, null);
        }
      }
    )
  );
}
