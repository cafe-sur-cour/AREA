import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();
import { Strategy as GitHubStrategy, Profile } from 'passport-github';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { oauthLogin } from '../routes/auth/auth.service';
import { githubOAuth } from '../services/services/github/oauth';
import { JWT_SECRET } from '../../index';

export interface GitHubUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.SERVICE_GITHUB_CLIENT_ID || '',
      clientSecret: process.env.SERVICE_GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.SERVICE_GITHUB_REDIRECT_URI || '',
      scope: ['user:email', 'read:user'],
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
        const user = await oauthLogin(
          'github',
          profile.id,
          profile.emails?.[0]?.value || '',
          profile.displayName || profile.username || ''
        );

        if (user instanceof Error) {
          return doneCallback(user, null);
        }

        const tokenData = {
          access_token: accessToken,
          token_type: 'bearer',
          scope: 'user:email,read:user',
        };

        const decoded = jwt.verify(user, JWT_SECRET as string) as { id: number };
        await githubOAuth.storeUserToken(decoded.id, tokenData);

        return doneCallback(null, {
          id: profile.id,
          name: profile.displayName || profile.username || '',
          email: profile.emails?.[0]?.value || '',
          token: user,
        });
      } catch (error) {
        return doneCallback(error as Error, null);
      }
    }
  )
);

export default passport;
