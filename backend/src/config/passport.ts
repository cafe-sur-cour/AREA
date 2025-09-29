import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();
import { Strategy as GitHubStrategy, Profile } from 'passport-github';
import { Request } from 'express';
import { oauthLogin } from '../routes/auth/auth.service';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../index';
import { githubOAuth } from '../services/services/github/oauth';

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
        let authToken: string | null = null;
        if (req.query.state) {
          try {
            const stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
            authToken = stateData.authToken;
          } catch (error) {
            console.log('GitHub OAuth - Error decoding state:', error);
          }
        }

        if (!authToken) {
          authToken = req.cookies?.auth_token;
          console.log('GitHub OAuth - Auth token from cookie:', !!authToken);
        }

        if (authToken) {
          try {
            const decoded = jwt.verify(authToken, JWT_SECRET as string) as jwt.JwtPayload;
            const userId = decoded.id;

            const tokenData = {
              access_token: accessToken,
              token_type: 'bearer',
              scope: (params as { scope?: string })?.scope || 'repo,user',
            };
            await githubOAuth.storeUserToken(userId, tokenData);

            return doneCallback(null, {
              id: profile.id,
              name: profile.displayName || profile.username || '',
              email: profile.emails?.[0]?.value || '',
              token: authToken,
            });
          } catch (error) {
            console.log('GitHub OAuth - Error processing auth token:', error);
          }
        }

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
          scope: (params as { scope?: string })?.scope || 'repo,user',
        };

        const decoded = jwt.verify(user, JWT_SECRET as string) as jwt.JwtPayload;
        const userId = decoded.id;
        await githubOAuth.storeUserToken(userId, tokenData);

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
