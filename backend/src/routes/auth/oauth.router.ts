import express, { Request, Response, NextFunction, Router } from 'express';
import passport from 'passport';
import process from 'process';
import { serviceRegistry } from '../../services/ServiceRegistry';
import { createLog } from '../logs/logs.service';

let oauthRouter: Router | null = null;

export function createOAuthRouter(): Router {
  if (oauthRouter) {
    return oauthRouter;
  }

  const router = express.Router();

  const services = serviceRegistry.getAllServices();

  console.log(`🔧 Creating OAuth routes for ${services.length} services...`);

  for (const service of services) {
    if (!service.oauth?.enabled) continue;

    const serviceId = service.id;
    const supportsLogin = service.oauth.supportsLogin ?? false;

    if (supportsLogin) {
      router.get(
        `/${serviceId}/login`,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const serviceOAuth = await import(
              `../../services/services/${serviceId}/oauth`
            );
            const oauthInstance = serviceOAuth[`${serviceId}OAuth`];

            if (typeof oauthInstance?.getAuthorizationUrl === 'function') {
              if (req.query.is_mobile === 'true') {
                const session = req.session as {
                  is_mobile?: boolean;
                } & typeof req.session;
                session.is_mobile = true;
              }
              const state = Math.random().toString(36).substring(2, 15);
              const authUrl = oauthInstance.getAuthorizationUrl(state);
              return res.redirect(authUrl);
            }
          } catch {}

          if (req.query.is_mobile === 'true') {
            const session = req.session as {
              is_mobile?: boolean;
            } & typeof req.session;
            session.is_mobile = true;
          }
          passport.authenticate(`${serviceId}-login`)(req, res, next);
        }
      );
    }

    router.get(
      `/${serviceId}/callback`,
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const isAuthenticated = !!(req.auth || req.cookies?.auth_token);

          if (isAuthenticated) {
            passport.authenticate(`${serviceId}-subscribe`, { session: false })(
              req,
              res,
              next
            );
          } else if (supportsLogin) {
            passport.authenticate(`${serviceId}-login`, { session: false })(
              req,
              res,
              next
            );
          } else {
            await createLog(
              401,
              'other',
              `Attempted to use ${serviceId} callback without authentication`
            );
            res.status(401).json({
              error: `${service.name} requires authentication`,
            });
          }
        } catch (err) {
          console.error(`${service.name} OAuth callback error:`, err);
          await createLog(
            500,
            'other',
            `Failed to authenticate with ${service.name}: ${err}`
          );
          res.status(500).json({
            error: `Failed to authenticate with ${service.name}`,
          });
        }
      },
      async (req: Request, res: Response): Promise<void> => {
        try {
          const user = req.user as { token: string };
          const isAuthenticated = !!(req.auth || req.cookies?.auth_token);

          if (!user || !user.token) {
            await createLog(
              500,
              'other',
              `Failed to authenticate with ${service.name}: No token received`
            );
            res.status(500).json({ error: 'Authentication failed' });
            return;
          }

          if (isAuthenticated) {
            const session = req.session as {
              is_mobile?: boolean;
              githubSubscriptionFlow?: boolean;
            } & typeof req.session;

            // GitHub App installation is the only special case as it requires a specific installation flow
            if (serviceId === 'github' && session.githubSubscriptionFlow) {
              const appSlug =
                process.env.GITHUB_APP_SLUG || 'area-cafe-sur-cours';
              const userId = (req.auth as { id: number })?.id || 'unknown';
              const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${userId}`;

              delete session.githubSubscriptionFlow;
              delete session.is_mobile;
              return res.redirect(installUrl);
            }

            if (session.is_mobile) {
              delete session.is_mobile;
              return res.redirect(
                `${process.env.MOBILE_CALLBACK_URL || ''}?${serviceId}_subscribed=true`
              );
            } else {
              return res.redirect(
                `${process.env.FRONTEND_URL || ''}/services?${serviceId}_subscribed=true`
              );
            }
          }

          res.cookie('auth_token', user.token, {
            maxAge: 86400000,
            httpOnly: true,
            secure: true,
            domain: process.env.DOMAIN,
            sameSite: 'none',
          });

          const session = req.session as {
            is_mobile?: boolean;
          } & typeof req.session;

          if (session.is_mobile) {
            delete session.is_mobile;
            return res.redirect(
              `${process.env.MOBILE_CALLBACK_URL || ''}?token=${user.token}`
            );
          } else {
            return res.redirect(
              `${process.env.FRONTEND_URL || ''}?token=${user.token}`
            );
          }
        } catch (err) {
          console.error(`${service.name} OAuth callback error:`, err);
          await createLog(
            500,
            'other',
            `Failed to authenticate with ${service.name}: ${err}`
          );
          res.status(500).json({
            error: `Failed to authenticate with ${service.name}`,
          });
        }
      }
    );
  }

  console.log(`✅ OAuth routes created successfully`);
  oauthRouter = router;
  return router;
}
