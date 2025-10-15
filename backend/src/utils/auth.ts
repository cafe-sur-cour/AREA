import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../index';

export async function getCurrentUser(
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
