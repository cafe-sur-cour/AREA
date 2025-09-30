import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();
import { Strategy as GitHubStrategy, Profile } from 'passport-github';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { oauthLogin, connectOAuthProvider } from '../routes/auth/auth.service';
import { githubOAuth } from '../services/services/github/oauth';
import { JWT_SECRET } from '../../index';

export interface GitHubUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

async function isUserAuthenticated(req: Request): Promise<boolean> {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      jwt.verify(token, JWT_SECRET as string);
      return true;
    }

    const cookieToken = req.cookies?.auth_token;
    if (cookieToken) {
      jwt.verify(cookieToken, JWT_SECRET as string);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

async function getCurrentUser(
  req: Request
): Promise<{ id: number; email: string } | null> {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, JWT_SECRET as string) as {
        id: number;
        email: string;
      };
      return decoded;
    }

    const cookieToken = req.cookies?.auth_token;
    if (cookieToken) {
      const decoded = jwt.verify(cookieToken, JWT_SECRET as string) as {
        id: number;
        email: string;
      };
      return decoded;
    }

    return null;
  } catch {
    return null;
  }
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
        const isServiceConnection = await isUserAuthenticated(req);

        let userToken: string | Error;

        if (isServiceConnection) {
          const currentUser = await getCurrentUser(req);
          if (!currentUser) {
            return doneCallback(new Error('User not authenticated'), null);
          }

          userToken = await connectOAuthProvider(
            currentUser.id,
            'github',
            profile.id,
            profile.emails?.[0]?.value || '',
            profile.displayName || profile.username || ''
          );
        } else {
          userToken = await oauthLogin(
            'github',
            profile.id,
            profile.emails?.[0]?.value || '',
            profile.displayName || profile.username || ''
          );
        }

        if (userToken instanceof Error) {
          return doneCallback(userToken, null);
        }

        const tokenData = {
          access_token: accessToken,
          token_type: 'bearer',
          scope: 'user:email,read:user',
        };

        const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
          id: number;
        };
        await githubOAuth.storeUserToken(decoded.id, tokenData);

        return doneCallback(null, {
          id: profile.id,
          name: profile.displayName || profile.username || '',
          email: profile.emails?.[0]?.value || '',
          token: userToken,
        });
      } catch (error) {
        return doneCallback(error as Error, null);
      }
    }
  )
);

export default passport;
