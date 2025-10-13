import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import passport from 'passport';
import { createLog } from '../logs/logs.service';
import { ServiceSubscriptionManager } from '../../services/ServiceSubscriptionManager';

const router = express.Router();
const NON_OAUTH_SERVICES = ['timer'];

function redirectAfterSubscription(
  req: Request,
  res: Response,
  service: string
): void {
  const session = req.session as {
    is_mobile?: boolean;
  } & typeof req.session;

  const redirectUrl = session.is_mobile
    ? `${process.env.MOBILE_CALLBACK_URL || ''}?${service}_subscribed=true`
    : `${process.env.FRONTEND_URL || ''}/services?${service}_subscribed=true`;

  if (session.is_mobile) {
    delete session.is_mobile;
  }

  res.redirect(redirectUrl);
}

async function handleServiceSubscription(
  userId: number,
  service: string,
  serviceSubscriptionManager: ServiceSubscriptionManager,
  req: Request,
  res: Response,
  next: express.NextFunction
): Promise<{ status: number; response: Record<string, unknown> } | null> {
  if (NON_OAUTH_SERVICES.includes(service)) {
    await serviceSubscriptionManager.subscribeUser(userId, service);
    console.log(
      `✅ [SUBSCRIBE] ${service} subscription successful for user ${userId}`
    );
    await createLog(200, 'other', `User ${userId} subscribed to ${service}`);

    redirectAfterSubscription(req, res, service);
    return null;
  }

  try {
    const serviceOAuth = await import(
      `../../services/services/${service}/oauth`
    );
    const oauthInstance = serviceOAuth[`${service}OAuth`];
    const serviceToken = await oauthInstance.getUserToken(userId);

    if (serviceToken) {
      await serviceSubscriptionManager.subscribeUser(userId, service);
      console.log(
        `✅ [SUBSCRIBE] ${service} subscription successful for user ${userId}`
      );
      await createLog(200, 'other', `User ${userId} subscribed to ${service}`);

      redirectAfterSubscription(req, res, service);
      return null;
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
  } catch (error) {
    console.error(`Error loading OAuth for service ${service}:`, error);
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
        redirectAfterSubscription(req, res, service);
        return;
      }

      const result = await handleServiceSubscription(
        userId,
        service,
        serviceSubscriptionManager,
        req,
        res,
        next
      );

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

export default router;
