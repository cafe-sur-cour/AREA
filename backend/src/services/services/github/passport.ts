import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import {
  oauthLogin,
  connectOAuthProvider,
} from '../../../routes/auth/auth.service';
import { githubOAuth } from './oauth';
import { JWT_SECRET } from '../../../../index';
import { getCurrentUser } from '../../../utils/auth';

export interface GitHubUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export function initializeGitHubPassport(): void {
  passport.use(
    'github-login',
    new GitHubStrategy(
      {
        clientID: process.env.SERVICE_GITHUB_CLIENT_ID || '',
        clientSecret: process.env.SERVICE_GITHUB_CLIENT_SECRET || '',
        callbackURL: process.env.SERVICE_GITHUB_REDIRECT_URI || '',
        scope: ['user:email'],
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        params: unknown,
        refreshToken: string,
        profile: Profile,
        done: unknown
      ) => {
        const doneCallback = done as (
          error: Error | null,
          user?: GitHubUser | null
        ) => void;
        try {
          let userEmail = profile.emails?.[0]?.value || '';
          if (userEmail.includes('@github.oauth') || !userEmail) {
            try {
              const emails = await githubOAuth.getUserEmails(accessToken);
              const primaryEmail = emails.find(
                email => email.primary && email.verified
              );
              if (primaryEmail) {
                userEmail = primaryEmail.email;
              }
            } catch (error) {
              console.warn('Failed to fetch GitHub user emails:', error);
            }
          }
          const userToken = await oauthLogin(
            'github',
            profile.id,
            userEmail,
            profile.displayName || profile.username || ''
          );
          if (userToken instanceof Error) {
            return doneCallback(userToken, null);
          }

          const tokenData = {
            access_token: accessToken,
            token_type: 'bearer',
            scope: 'user:email',
          };
          const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
            id: number;
          };
          await githubOAuth.storeUserToken(decoded.id, tokenData);
          return doneCallback(null, {
            id: profile.id,
            name: profile.displayName || profile.username || '',
            email: userEmail,
            token: userToken,
          });
        } catch (error) {
          return doneCallback(error as Error, null);
        }
      }
    )
  );

  passport.use(
    'github-subscribe',
    new GitHubStrategy(
      {
        clientID: process.env.SERVICE_GITHUB_CLIENT_ID || '',
        clientSecret: process.env.SERVICE_GITHUB_CLIENT_SECRET || '',
        callbackURL: process.env.SERVICE_GITHUB_REDIRECT_URI || '',
        scope: ['user:email', 'repo'],
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        params: unknown,
        refreshToken: string,
        profile: Profile,
        done: unknown
      ) => {
        const doneCallback = done as (
          error: Error | null,
          user?: GitHubUser | null
        ) => void;
        try {
          const currentUser = await getCurrentUser(req);
          if (!currentUser) {
            return doneCallback(new Error('User not authenticated'), null);
          }

          let userEmail = profile.emails?.[0]?.value || '';
          if (userEmail.includes('@github.oauth') || !userEmail) {
            try {
              const emails = await githubOAuth.getUserEmails(accessToken);
              const primaryEmail = emails.find(
                email => email.primary && email.verified
              );
              if (primaryEmail) {
                userEmail = primaryEmail.email;
              }
            } catch (error) {
              console.warn('Failed to fetch GitHub user emails:', error);
            }
          }

          const userToken = await connectOAuthProvider(
            currentUser.id,
            'github',
            profile.id,
            userEmail,
            profile.displayName || profile.username || ''
          );

          if (userToken instanceof Error) {
            return doneCallback(userToken, null);
          }

          const tokenData = {
            access_token: accessToken,
            token_type: 'bearer',
            scope: 'user:email,repo',
          };

          const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
            id: number;
          };
          await githubOAuth.storeUserToken(decoded.id, tokenData);

          try {
            const { serviceSubscriptionManager } = await import(
              '../../ServiceSubscriptionManager'
            );
            await serviceSubscriptionManager.subscribeUser(
              decoded.id,
              'github'
            );
          } catch (subscriptionError) {
            console.error(
              'Error auto-subscribing user to GitHub service:',
              subscriptionError
            );
          }

          return doneCallback(null, {
            id: profile.id,
            name: profile.displayName || profile.username || '',
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
