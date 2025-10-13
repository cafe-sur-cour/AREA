import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();
import { Strategy as GitHubStrategy, Profile } from 'passport-github';
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from 'passport-google-oauth20';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Strategy as CustomStrategy } from 'passport-custom';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { oauthLogin, connectOAuthProvider } from '../routes/auth/auth.service';
import { githubOAuth } from '../services/services/github/oauth';
import { googleOAuth } from '../services/services/google/oauth';
import { spotifyOAuth } from '../services/services/spotify/oauth';
import { microsoftOAuth } from '../services/services/microsoft/oauth';
import { slackOAuth } from '../services/services/slack/oauth';
import { facebookOAuth } from '../services/services/meta/oauth';
import { JWT_SECRET } from '../../index';

export interface GitHubUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface MicrosoftUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface SlackUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface SpotifyUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface MetaUser {
  id: string;
  name: string;
  email: string;
  token: string;
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
      try {
        const unverified = jwt.decode(cookieToken, { complete: true });
        void unverified;
      } catch (err) {
        console.warn('Failed to decode token (unverified):', err);
      }

      try {
        const decoded = jwt.verify(cookieToken, JWT_SECRET as string) as {
          id: number;
          email: string;
        };
        return decoded;
      } catch (err: unknown) {
        console.error(
          'JWT verification error:',
          err && typeof err === 'object' && 'name' in err
            ? `${(err as { name?: string }).name}: ${(err as Error).message}`
            : err
        );
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name?: string }).name === 'JsonWebTokenError'
        ) {
          console.warn(
            'Token signature invalid - user needs to re-authenticate'
          );
        }
        return null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

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
            '../services/ServiceSubscriptionManager'
          );
          await serviceSubscriptionManager.subscribeUser(decoded.id, 'github');
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

passport.use(
  'google-login',
  new GoogleStrategy(
    {
      clientID: process.env.SERVICE_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.SERVICE_GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.SERVICE_GOOGLE_REDIRECT_URI || '',
      scope: ['openid', 'email', 'profile'],
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
          scope: 'openid email profile',
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
      scope: ['openid', 'email', 'profile'],
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
          scope: 'openid email profile',
        };

        const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
          id: number;
        };
        await googleOAuth.storeUserToken(decoded.id, tokenData);

        try {
          const { serviceSubscriptionManager } = await import(
            '../services/ServiceSubscriptionManager'
          );
          await serviceSubscriptionManager.subscribeUser(decoded.id, 'google');
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

passport.use(
  'spotify-login',
  new OAuth2Strategy(
    {
      authorizationURL: `${process.env.SERVICE_SPOTIFY_AUTH_BASE_URL || ''}/authorize`,
      tokenURL: `${process.env.SERVICE_SPOTIFY_AUTH_BASE_URL || ''}/api/token`,
      clientID: process.env.SERVICE_SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SERVICE_SPOTIFY_CLIENT_SECRET || '',
      callbackURL: process.env.SERVICE_SPOTIFY_REDIRECT_URI || '',
      scope: 'user-read-email user-read-private',
      passReqToCallback: true,
    },
    async (
      req: Request,
      accessToken: string,
      refreshToken: string,
      params: { expires_in?: number },
      profile: unknown,
      done: unknown
    ) => {
      const doneCallback = done as (
        error: Error | null,
        user?: SpotifyUser | null
      ) => void;
      try {
        const userInfo = await spotifyOAuth.getUserInfo(accessToken);

        const userToken = await oauthLogin(
          'spotify',
          userInfo.id,
          userInfo.email,
          userInfo.display_name
        );

        if (userToken instanceof Error) {
          return doneCallback(userToken, null);
        }

        const tokenData = {
          access_token: accessToken,
          token_type: 'bearer',
          scope: 'user-read-email user-read-private',
          expires_in: params.expires_in || 3600,
          refresh_token: refreshToken,
        };

        const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
          id: number;
        };
        await spotifyOAuth.storeUserToken(decoded.id, tokenData);

        return doneCallback(null, {
          id: userInfo.id,
          name: userInfo.display_name,
          email: userInfo.email,
          token: userToken,
        });
      } catch (error) {
        return doneCallback(error as Error, null);
      }
    }
  )
);

passport.use(
  'spotify-subscribe',
  new OAuth2Strategy(
    {
      authorizationURL: `${process.env.SERVICE_SPOTIFY_AUTH_BASE_URL || 'https://accounts.spotify.com'}/authorize`,
      tokenURL: `${process.env.SERVICE_SPOTIFY_AUTH_BASE_URL || 'https://accounts.spotify.com'}/api/token`,
      clientID: process.env.SERVICE_SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SERVICE_SPOTIFY_CLIENT_SECRET || '',
      callbackURL: process.env.SERVICE_SPOTIFY_REDIRECT_URI || '',
      scope:
        'user-read-email user-read-private user-modify-playback-state playlist-modify-public playlist-modify-private user-read-playback-state user-library-read user-library-modify',
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
        user?: SpotifyUser | null
      ) => void;
      try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser) {
          return doneCallback(new Error('User not authenticated'), null);
        }

        const userInfo = await spotifyOAuth.getUserInfo(accessToken);

        const userToken = await connectOAuthProvider(
          currentUser.id,
          'spotify',
          userInfo.id,
          userInfo.email,
          userInfo.display_name
        );

        if (userToken instanceof Error) {
          return doneCallback(userToken, null);
        }

        const tokenData = {
          access_token: accessToken,
          token_type: 'bearer',
          scope:
            params.scope ||
            'user-read-email user-read-private user-modify-playback-state playlist-modify-public playlist-modify-private user-read-playback-state user-library-read user-library-modify',
          expires_in: params.expires_in || 3600,
          refresh_token: refreshToken,
        };

        const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
          id: number;
        };
        await spotifyOAuth.storeUserToken(decoded.id, tokenData);

        try {
          const { serviceSubscriptionManager } = await import(
            '../services/ServiceSubscriptionManager'
          );
          await serviceSubscriptionManager.subscribeUser(decoded.id, 'spotify');
        } catch (subscriptionError) {
          console.error(
            'Error auto-subscribing user to Spotify service:',
            subscriptionError
          );
        }

        return doneCallback(null, {
          id: userInfo.id,
          name: userInfo.display_name,
          email: userInfo.email,
          token: userToken,
        });
      } catch (error) {
        return doneCallback(error as Error, null);
      }
    }
  )
);

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
            '../services/ServiceSubscriptionManager'
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
            '../services/ServiceSubscriptionManager'
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

passport.use(
  'meta-login',
  new CustomStrategy(
    async (
      req: Request,
      done: (error: Error | null, user?: MetaUser | null) => void
    ) => {
      try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
          return done(new Error('Authorization code is missing'), null);
        }

        const tokenData = await facebookOAuth.exchangeCodeForToken(code);
        const userInfo = await facebookOAuth.getUserInfo(
          tokenData.access_token
        );
        const userToken = await oauthLogin(
          'meta',
          userInfo.id,
          userInfo.email || '',
          userInfo.name
        );

        if (userToken instanceof Error) {
          return done(userToken, null);
        }

        const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
          id: number;
        };
        await facebookOAuth.storeUserToken(decoded.id, tokenData);

        return done(null, {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email || '',
          token: userToken,
        });
      } catch (error) {
        return done(error as Error, null);
      }
    }
  )
);

passport.use(
  'meta-subscribe',
  new CustomStrategy(
    async (
      req: Request,
      done: (error: Error | null, user?: MetaUser | null) => void
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

        const tokenData = await facebookOAuth.exchangeCodeForToken(code);
        const userInfo = await facebookOAuth.getUserInfo(
          tokenData.access_token
        );

        const userToken = await connectOAuthProvider(
          currentUser.id,
          'meta',
          userInfo.id,
          userInfo.email || '',
          userInfo.name
        );

        if (userToken instanceof Error) {
          return done(userToken, null);
        }

        const decoded = jwt.verify(userToken, JWT_SECRET as string) as {
          id: number;
        };
        await facebookOAuth.storeUserToken(decoded.id, tokenData);

        try {
          const { serviceSubscriptionManager } = await import(
            '../services/ServiceSubscriptionManager'
          );
          await serviceSubscriptionManager.subscribeUser(decoded.id, 'meta');
        } catch (subscriptionError) {
          console.error(
            'Error auto-subscribing user to Meta service:',
            subscriptionError
          );
        }

        return done(null, {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email || '',
          token: userToken,
        });
      } catch (error) {
        return done(error as Error, null);
      }
    }
  )
);

export default passport;
