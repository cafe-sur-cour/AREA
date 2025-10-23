import passport from 'passport';
import GitLabStrategyModule from 'passport-gitlab2';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { connectOAuthProvider } from '../../../routes/auth/auth.service';
import { gitlabOAuth } from './oauth';
import { JWT_SECRET } from '../../../../index';
import { getCurrentUser } from '../../../utils/auth';

const GitLabStrategy = GitLabStrategyModule.Strategy;

export interface GitLabUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export function initializeGitLabPassport(): void {
  passport.use(
    'gitlab-subscribe',
    new GitLabStrategy(
      {
        clientID: process.env.SERVICE_GITLAB_CLIENT_ID || '',
        clientSecret: process.env.SERVICE_GITLAB_CLIENT_SECRET || '',
        callbackURL: process.env.SERVICE_GITLAB_REDIRECT_URI || '',
        baseURL: 'https://gitlab.com',
        scope:
          'api read_user read_api read_repository write_repository read_registry write_registry',
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        profile: unknown,
        done: unknown
      ) => {
        const doneCallback = done as (
          error: Error | null,
          user?: GitLabUser | null
        ) => void;
        console.log('in gitlab subscribe strategy');
        try {
          const currentUser = await getCurrentUser(req);
          if (!currentUser) {
            return doneCallback(new Error('User not authenticated'), null);
          }

          const userEmail =
            (profile as { emails?: { value: string }[] })?.emails?.[0]?.value ||
            '';

          const userToken = await connectOAuthProvider(
            currentUser.id,
            'gitlab',
            (profile as { id: string }).id,
            userEmail,
            (profile as { displayName?: string; username?: string })
              .displayName ||
              (profile as { username?: string }).username ||
              ''
          );

          if (userToken instanceof Error) {
            return doneCallback(userToken, null);
          }

          const tokenData = {
            access_token: accessToken,
            token_type: 'bearer',
            scope: 'read_user api write_repository',
          };

          const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
            id: number;
          };
          await gitlabOAuth.storeUserToken(decoded.id, tokenData);

          try {
            const { serviceSubscriptionManager } = await import(
              '../../ServiceSubscriptionManager'
            );
            await serviceSubscriptionManager.subscribeUser(
              decoded.id,
              'gitlab'
            );
          } catch (subscriptionError) {
            console.error(
              'Error auto-subscribing user to GitLab service:',
              subscriptionError
            );
          }

          return doneCallback(null, {
            id: (profile as { id: string }).id,
            name:
              (profile as { displayName?: string; username?: string })
                .displayName ||
              (profile as { username?: string }).username ||
              '',
            email: userEmail,
            token: userToken,
          });
        } catch (error) {
          return doneCallback(error as Error, null);
        }
      }
    )
  );
}
