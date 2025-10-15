import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { facebookOAuth } from './oauth';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import {
  oauthLogin,
//   connectOAuthProvider,
} from '../../../routes/auth/auth.service';
import { JWT_SECRET } from '../../../../index';
// import { getCurrentUser } from '../../../utils/auth';

export interface MetaUser {
  id: string;
  name: string;
  email: string;
  token: string;
}
export interface FacebookUser {
	id: string;
	name: string;
	email?: string;
}

export function initializeFacebookPassport(): void {
  passport.use(
    'facebook-login',
    new FacebookStrategy(
      {
        clientID: process.env.SERVICE_FACEBOOK_CLIENT_ID,
        clientSecret: process.env.SERVICE_FACEBOOK_CLIENT_SECRET,
        callbackURL: process.env.SERVICE_FACEBOOK_REDIRECT_URI,
        profileFields: ['id', 'displayName', 'email', 'picture.type(large)'],
        passReqToCallback: true
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
          user?: FacebookUser | null
        ) => void;
        try {
          interface FacebookProfileShape {
            id?: string;
            displayName?: string;
            emails?: { value?: string }[];
            photos?: { value?: string }[];
          }
          const fbProfile = profile as FacebookProfileShape;

          const user: FacebookUser = {
            id: fbProfile.id || '',
            name: fbProfile.displayName || '',
            ...(fbProfile.emails?.[0]?.value && { email: fbProfile.emails[0].value }),
          };

          const token = await oauthLogin(
            'meta',
            fbProfile.id || '',
            user.email || '',
            fbProfile.displayName || ''
          );

          if (token instanceof Error) {
            return doneCallback(token, null);
          }

          const decoded = jwt.verify(token, JWT_SECRET as string) as {
            id: number;
          };

          await facebookOAuth.storeUserToken(
            decoded.id,
            {
              access_token: accessToken,
              token_type: 'bearer',
              expires_in: 5184000
            }
          );

          const userWithToken = {
            ...user,
            token
          };

          return doneCallback(null, userWithToken);
        } catch (error) {
          return doneCallback(error as Error, null);
        }
      }
    )
  );
}




// /**
//  * * @swagger
//  * /api/auth/facebook/login:
//  *   get:
//  *     summary: Initiate Facebook OAuth authorization for login/register
//  *     tags:
//  *       - OAuth
//  *     description: |
//  *       Redirects user to Facebook for OAuth authorization.
//  *       This route is used for login/register when user is not authenticated.
//  *     parameters:
//  *       - name: is_mobile
//  *         in: query
//  *         required: false
//  *         description: Indicates if the request originates from mobile client
//  *         schema:
//  *           type: boolean
//  */
// router.get('/facebook/login',
//   (req, res, next) => {
//     if (req.query.is_mobile === 'true') {
//       const session = req.session as {
//         is_mobile?: boolean;
//       } & typeof req.session;
//       session.is_mobile = true;
//     }
//     next();
//   },
//   passport.authenticate('facebook-login')
// );

// app.use('/api/facebook', facebookRoutes);
