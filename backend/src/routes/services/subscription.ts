import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import passport from 'passport';
import { createLog } from '../logs/logs.service';
import { ServiceSubscriptionManager } from '../../services/ServiceSubscriptionManager';

const router = express.Router();

async function handleTimerSubscription(
  userId: number,
  service: string,
  serviceSubscriptionManager: ServiceSubscriptionManager
): Promise<{ status: number; response: Record<string, unknown> }> {
  const subscription = await serviceSubscriptionManager.subscribeUser(
    userId,
    service
  );
  console.log(
    `✅ [SUBSCRIBE] Timer subscription successful for user ${userId}`
  );
  await createLog(200, 'other', `User ${userId} subscribed to ${service}`);
  return {
    status: 200,
    response: {
      message: `Successfully subscribed to ${service}`,
      subscription: {
        subscribed: subscription.subscribed,
        subscribed_at: subscription.subscribed_at,
        service: subscription.service,
      },
    },
  };
}

async function handleGithubSubscription(
  userId: number,
  service: string,
  serviceSubscriptionManager: ServiceSubscriptionManager,
  req: Request,
  res: Response,
  next: express.NextFunction
): Promise<{ status: number; response: Record<string, unknown> } | null> {
  const { githubOAuth } = await import('../../services/services/github/oauth');
  const githubToken = await githubOAuth.getUserToken(userId);

  if (githubToken) {
    const githubSubscription = await serviceSubscriptionManager.subscribeUser(
      userId,
      service
    );
    console.log(
      `✅ [SUBSCRIBE] GitHub subscription successful for user ${userId}`
    );
    await createLog(200, 'other', `User ${userId} subscribed to ${service}`);
    return {
      status: 200,
      response: {
        message: `Successfully subscribed to ${service}`,
        subscription: {
          subscribed: githubSubscription.subscribed,
          subscribed_at: githubSubscription.subscribed_at,
          service: githubSubscription.service,
        },
        note: 'GitHub app installation will be handled separately for webhooks',
      },
    };
  }

  const session = req.session as
    | { githubSubscriptionFlow?: boolean }
    | undefined;
  if (session) {
    session.githubSubscriptionFlow = true;
  }

  await createLog(
    302,
    'other',
    `Starting OAuth flow for user ${userId} to subscribe to ${service}`
  );
  passport.authenticate('github-subscribe', { session: false })(req, res, next);
  return null;
}

async function handleGoogleSubscription(
  userId: number,
  service: string,
  serviceSubscriptionManager: ServiceSubscriptionManager,
  req: Request,
  res: Response,
  next: express.NextFunction
): Promise<{ status: number; response: Record<string, unknown> } | null> {
  const { googleOAuth } = await import('../../services/services/google/oauth');
  const googleToken = await googleOAuth.getUserToken(userId);

  if (googleToken) {
    const googleSubscription = await serviceSubscriptionManager.subscribeUser(
      userId,
      service
    );
    console.log(
      `✅ [SUBSCRIBE] Google subscription successful for user ${userId}`
    );
    await createLog(200, 'other', `User ${userId} subscribed to ${service}`);
    return {
      status: 200,
      response: {
        message: `Successfully subscribed to ${service}`,
        subscription: {
          subscribed: googleSubscription.subscribed,
          subscribed_at: googleSubscription.subscribed_at,
          service: googleSubscription.service,
        },
      },
    };
  }

  await createLog(
    302,
    'other',
    `Starting OAuth flow for user ${userId} to subscribe to ${service}`
  );
  passport.authenticate('google-subscribe', {
    session: false,
  })(req, res, next);
  return null;
}

async function handleSpotifySubscription(
  userId: number,
  service: string,
  serviceSubscriptionManager: ServiceSubscriptionManager,
  req: Request,
  res: Response,
  next: express.NextFunction
): Promise<{ status: number; response: Record<string, unknown> } | null> {
  const { spotifyOAuth } = await import(
    '../../services/services/spotify/oauth'
  );
  const spotifyToken = await spotifyOAuth.getUserToken(userId);

  if (spotifyToken) {
    const spotifySubscription = await serviceSubscriptionManager.subscribeUser(
      userId,
      service
    );
    console.log(
      `✅ [SUBSCRIBE] Spotify subscription successful for user ${userId}`
    );
    await createLog(200, 'other', `User ${userId} subscribed to ${service}`);
    return {
      status: 200,
      response: {
        message: `Successfully subscribed to ${service}`,
        subscription: {
          subscribed: spotifySubscription.subscribed,
          subscribed_at: spotifySubscription.subscribed_at,
          service: spotifySubscription.service,
        },
      },
    };
  }

  await createLog(
    302,
    'other',
    `Starting OAuth flow for user ${userId} to subscribe to ${service}`
  );
  passport.authenticate('spotify-subscribe', {
    session: false,
  })(req, res, next);
  return null;
}

async function handleDynamicServiceSubscription(
  userId: number,
  service: string,
  serviceSubscriptionManager: ServiceSubscriptionManager,
  req: Request,
  res: Response,
  next: express.NextFunction
): Promise<{ status: number; response: Record<string, unknown> } | null> {
  try {
    const serviceOAuth = await import(
      `../../services/services/${service}/oauth`
    );
    const oauthInstance = serviceOAuth[`${service}OAuth`];
    const serviceToken = await oauthInstance.getUserToken(userId);

    if (serviceToken) {
      const dynamicSubscription =
        await serviceSubscriptionManager.subscribeUser(userId, service);
      console.log(
        `✅ [SUBSCRIBE] ${service} subscription successful for user ${userId}`
      );
      await createLog(200, 'other', `User ${userId} subscribed to ${service}`);
      return {
        status: 200,
        response: {
          message: `Successfully subscribed to ${service}`,
          subscription: {
            subscribed: dynamicSubscription.subscribed,
            subscribed_at: dynamicSubscription.subscribed_at,
            service: dynamicSubscription.service,
          },
        },
      };
    }

    await createLog(
      302,
      'other',
      `Starting OAuth flow for user ${userId} to subscribe to ${service}`
    );
    passport.authenticate(`${service}-subscribe`, {
      session: false,
    })(req, res, next);
    return null;
  } catch {
    await createLog(
      404,
      'other',
      `Service ${service} not found or not supported`
    );
    return {
      status: 404,
      response: {
        error: `Service '${service}' not found or not supported`,
      },
    };
  }
}

/**
 * @swagger
 * /api/auth/{service}/subscribe:
 *   get:
 *     summary: Subscribe to a service (OAuth + Subscription)
 *     tags:
 *       - OAuth
 *     description: |
 *       Generic subscription endpoint that handles OAuth authorization and service subscription.
 *       This unified route replaces individual service-specific routes and provides a consistent
 *       subscription flow across all services.
 *
 *       The flow depends on the service type:
 *       - OAuth services (GitHub, Google, Spotify): Handles OAuth flow + subscription
 *       - Local services (Timer): Direct subscription without OAuth
 *
 *       If user is already subscribed, returns success immediately.
 *       If user has OAuth but not subscribed, performs subscription.
 *       If user has no OAuth, starts OAuth flow (for OAuth services).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: service
 *         in: path
 *         required: true
 *         description: Service name (github, google, spotify, timer, etc.)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully subscribed or already subscribed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 already_subscribed:
 *                   type: boolean
 *                 subscription:
 *                   type: object
 *                   description: Subscription details (when newly subscribed)
 *       302:
 *         description: Redirect to OAuth provider or app installation
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/:service/subscribe',
  (req, res, next) => {
    if (req.query.is_mobile === 'true') {
      const session = req.session as {
        is_mobile?: boolean;
      } & typeof req.session;
      session.is_mobile = true;
    }
    next();
  },
  token,
  async (req, res, next) => {
    const service = req.params.service?.toLowerCase();
    if (!service) {
      await createLog(400, 'other', 'Service parameter is required');
      return res.status(400).json({ error: 'Service parameter is required' });
    }

    const userId = (req.auth as { id: number }).id;

    try {
      const { serviceSubscriptionManager } = await import(
        '../../services/ServiceSubscriptionManager'
      );
      const existingSubscription =
        await serviceSubscriptionManager.getUserSubscription(userId, service);

      if (existingSubscription?.subscribed) {
        await createLog(
          200,
          'other',
          `User ${userId} already subscribed to ${service}`
        );
        return res.status(200).json({
          message: `Already subscribed to ${service}`,
          already_subscribed: true,
        });
      }

      let result: { status: number; response: Record<string, unknown> } | null =
        null;

      switch (service) {
        case 'timer':
          result = await handleTimerSubscription(
            userId,
            service,
            serviceSubscriptionManager
          );
          break;

        case 'github':
          result = await handleGithubSubscription(
            userId,
            service,
            serviceSubscriptionManager,
            req,
            res,
            next
          );
          break;

        case 'google':
          result = await handleGoogleSubscription(
            userId,
            service,
            serviceSubscriptionManager,
            req,
            res,
            next
          );
          break;

        case 'spotify':
          result = await handleSpotifySubscription(
            userId,
            service,
            serviceSubscriptionManager,
            req,
            res,
            next
          );
          break;

        default:
          result = await handleDynamicServiceSubscription(
            userId,
            service,
            serviceSubscriptionManager,
            req,
            res,
            next
          );
          break;
      }

      if (result === null) {
        return;
      }

      return res.status(result.status).json(result.response);
    } catch (error) {
      console.error(`Error in ${service} subscribe route:`, error);
      await createLog(
        500,
        'other',
        `Error in ${service} subscribe route: ${error instanceof Error ? error.message : String(error)}`
      );
      return res
        .status(500)
        .json({ error: `Internal Server Error in ${service} subscribe` });
    }
  }
);

router.get('/github/subscribe', (req, res) =>
  res.redirect('/auth/github/subscribe')
);
router.get('/google/subscribe', (req, res) =>
  res.redirect('/auth/google/subscribe')
);
router.get('/spotify/subscribe', (req, res) =>
  res.redirect('/auth/spotify/subscribe')
);
router.get('/timer/subscribe', (req, res) =>
  res.redirect('/auth/timer/subscribe')
);

export default router;
