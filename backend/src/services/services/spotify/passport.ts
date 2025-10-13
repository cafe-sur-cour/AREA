import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { connectOAuthProvider } from '../../../routes/auth/auth.service';
import { spotifyOAuth } from './oauth';
import { JWT_SECRET } from '../../../../index';
import { getCurrentUser } from '../../../utils/auth';

export interface SpotifyUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

export function initializeSpotifyPassport(): void {
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
              '../../ServiceSubscriptionManager'
            );
            await serviceSubscriptionManager.subscribeUser(
              decoded.id,
              'spotify'
            );
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
}
