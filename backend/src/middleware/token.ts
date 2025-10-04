import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../../index';

type AuthPayload = JwtPayload & {
  id?: number;
  email?: string;
  is_admin?: boolean;
};

type AuthRequest = Request & {
  cookies?: Record<string, unknown>;
  auth?: string | AuthPayload;
};

const clearAuthCookie = (res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

const token = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const tokenStr = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(tokenStr, JWT_SECRET as string) as
          | JwtPayload
          | string;
        req.auth = decoded;
        return next();
      } catch (err) {
        void err;
        console.error('Invalid Bearer token');
        if (req.cookies?.auth_token) {
          console.log(
            'Clearing invalid auth_token cookie due to invalid Bearer token'
          );
          clearAuthCookie(res);
        }

        return res.status(401).json({ msg: 'Invalid authentication token' });
      }
    }

    const cookieToken = req.cookies?.auth_token;
    if (cookieToken) {
      try {
        const decoded = jwt.verify(cookieToken, JWT_SECRET as string) as
          | JwtPayload
          | string;
        req.auth = decoded;
        return next();
      } catch (err: unknown) {
        console.log('Clearing invalid auth_token cookie');
        res.clearCookie('auth_token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });

        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name?: string }).name === 'TokenExpiredError'
        ) {
          console.log('Token expired, cookie cleared');
        } else if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name?: string }).name === 'JsonWebTokenError'
        ) {
          console.log('Invalid token signature, cookie cleared');
        }
        return res.status(401).json({ msg: 'Invalid authentication token' });
      }
    }

    return res.status(401).json({ msg: 'Authentication required' });
  } catch (error) {
    console.error('Authentication error:', error);
    return res
      .status(500)
      .json({ msg: 'Internal server error in token middleware' });
  }
};

export default token;
