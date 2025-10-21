import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import passport from 'passport';
import { createLog } from '../logs/logs.service';
import { ServiceSubscriptionManager } from '../../services/ServiceSubscriptionManager';
import { serviceRegistry } from '../../services/ServiceRegistry';

const router = express.Router();

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
  const serviceDefinition = serviceRegistry.getService(service);
  const usesOAuth = serviceDefinition?.oauth?.enabled ?? true;

  if (!usesOAuth) {
    await serviceSubscriptionManager.subscribeUser(userId, service);
    console.log(
      `✅ [SUBSCRIBE] ${service} subscription successful for user ${userId}`
    );
    await createLog(200, 'service', `User ${userId} subscribed to ${service}`);

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
      await createLog(
        200,
        'service',
        `User ${userId} subscribed to ${service}`
      );

      redirectAfterSubscription(req, res, service);
      return null;
    }

    await createLog(
      302,
      'service',
      `Starting OAuth flow for user ${userId} to subscribe to ${service}`
    );

    if (typeof oauthInstance.getAuthorizationUrl === 'function') {
      const state = Math.random().toString(36).substring(2, 15);
      const authUrl = oauthInstance.getAuthorizationUrl(state);
      res.redirect(authUrl);
      return null;
    }

    passport.authenticate(`${service}-subscribe`, {
      session: false,
    })(req, res, next);

    return null;
  } catch (error) {
    console.error(`Error loading OAuth for service ${service}:`, error);
    await createLog(
      404,
      'service',
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
      await createLog(400, 'service', 'Service parameter is required');
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
          'service',
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
        'service',
        `Error in ${service} subscribe route: ${error instanceof Error ? error.message : String(error)}`
      );
      return res
        .status(500)
        .json({ error: `Internal Server Error in ${service} subscribe` });
    }
  }
);

/**
 * @swagger
 * /api/auth/{service}/unsubscribe:
 *   post:
 *     summary: Unsubscribe from a service
 *     tags:
 *       - OAuth
 *     description: |
 *       Generic unsubscribe endpoint that handles service unsubscription.
 *       This unified route replaces individual service-specific unsubscribe routes.
 *
 *       The user's OAuth connection remains intact - only the subscription is removed.
 *       The user can re-subscribe at any time without needing to re-authenticate.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: service
 *         in: path
 *         required: true
 *         description: Service name (github, google, spotify, microsoft, etc.)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully unsubscribed from github events"
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     subscribed:
 *                       type: boolean
 *                       example: false
 *                     unsubscribed_at:
 *                       type: string
 *                       format: date-time
 *                     service:
 *                       type: string
 *       404:
 *         description: No active subscription found
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Internal Server Error
 */
router.post(
  '/:service/unsubscribe',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    const service = req.params.service?.toLowerCase();
    if (!service) {
      await createLog(400, 'service', 'Service parameter is required');
      return res.status(400).json({ error: 'Service parameter is required' });
    }

    const userId = (req.auth as { id: number }).id;

    try {
      const { serviceSubscriptionManager } = await import(
        '../../services/ServiceSubscriptionManager'
      );

      const subscription = await serviceSubscriptionManager.unsubscribeUser(
        userId,
        service
      );

      if (!subscription) {
        await createLog(
          404,
          'service',
          `No active subscription found for user ${userId} on ${service}`
        );
        return res.status(404).json({
          error: 'No active subscription found',
        });
      }

      console.log(
        `✅ [UNSUBSCRIBE] ${service} unsubscription successful for user ${userId}`
      );
      await createLog(
        200,
        'service',
        `User ${userId} unsubscribed from ${service}`
      );

      return res.status(200).json({
        message: `Successfully unsubscribed from ${service} events`,
        subscription: {
          subscribed: subscription.subscribed,
          unsubscribed_at: subscription.unsubscribed_at,
          service: subscription.service,
        },
      });
    } catch (error) {
      console.error(`Error in ${service} unsubscribe route:`, error);
      await createLog(
        500,
        'service',
        `Error in ${service} unsubscribe route: ${error instanceof Error ? error.message : String(error)}`
      );
      return res.status(500).json({
        error: `Internal Server Error in ${service} unsubscribe`,
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/{service}/subscribe/status:
 *   get:
 *     summary: Check service subscription status
 *     tags:
 *       - OAuth
 *     description: |
 *       Generic status endpoint that checks if a user is subscribed to a service.
 *       This unified route replaces individual service-specific status routes.
 *
 *       Returns subscription status, OAuth connection status, and whether the user
 *       can create webhooks (requires both subscription and OAuth).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: service
 *         in: path
 *         required: true
 *         description: Service name (github, google, spotify, microsoft, etc.)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service subscription status (subscribed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                   example: true
 *                 oauth_connected:
 *                   type: boolean
 *                   description: True if user has OAuth token for this service
 *                 can_create_webhooks:
 *                   type: boolean
 *                   description: True if user can create webhooks (subscribed + oauth)
 *                 subscribed_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 unsubscribed_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       404:
 *         description: Not subscribed to service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                   example: false
 *                 oauth_connected:
 *                   type: boolean
 *                 can_create_webhooks:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/:service/subscribe/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    const service = req.params.service?.toLowerCase();
    if (!service) {
      await createLog(400, 'service', 'Service parameter is required');
      return res.status(400).json({ error: 'Service parameter is required' });
    }

    const userId = (req.auth as { id: number }).id;

    try {
      console.log(
        `🔄 [STATUS] Checking ${service} subscription status for user ${userId}`
      );

      const { serviceSubscriptionManager } = await import(
        '../../services/ServiceSubscriptionManager'
      );

      const subscription = await serviceSubscriptionManager.getUserSubscription(
        userId,
        service
      );
      const isSubscribed = subscription?.subscribed || false;

      // Check if service uses OAuth by looking at service definition
      const serviceDefinition = serviceRegistry.getService(service);
      const usesOAuth = serviceDefinition?.oauth?.enabled ?? true;

      let oauthConnected = false;
      if (usesOAuth) {
        try {
          const serviceOAuth = await import(
            `../../services/services/${service}/oauth`
          );
          const oauthInstance = serviceOAuth[`${service}OAuth`];
          const userToken = await oauthInstance.getUserToken(userId);
          oauthConnected = !!userToken;
        } catch (error) {
          console.warn(`Could not check OAuth status for ${service}:`, error);
        }
      } else {
        // Non-OAuth services are always "connected"
        oauthConnected = true;
      }

      console.log(
        `✅ [STATUS] ${service} status for user ${userId}: subscribed=${isSubscribed}, oauth=${oauthConnected}`
      );

      if (!isSubscribed) {
        return res.status(404).json({
          subscribed: false,
          oauth_connected: oauthConnected,
          can_create_webhooks: false,
          message: `Not subscribed to ${service} events`,
        });
      }

      return res.status(200).json({
        subscribed: true,
        oauth_connected: oauthConnected,
        can_create_webhooks: isSubscribed && oauthConnected,
        subscribed_at: subscription?.subscribed_at || null,
        unsubscribed_at: subscription?.unsubscribed_at || null,
      });
    } catch (error) {
      console.error(
        `❌ [STATUS] Error fetching ${service} subscription status for user ${userId}:`,
        error
      );
      await createLog(
        500,
        'service',
        `Error in ${service} subscribe status: ${error instanceof Error ? error.message : String(error)}`
      );
      return res.status(500).json({
        error: `Internal Server Error in ${service} subscribe status`,
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/{service}/login/status:
 *   get:
 *     summary: Check OAuth login status for a service
 *     tags:
 *       - OAuth
 *     description: |
 *       Generic login status endpoint that checks if a user has completed OAuth authentication
 *       with a service. This unified route replaces individual service-specific login/status routes.
 *
 *       This only checks OAuth connection status, not subscription status.
 *       Use /:service/subscribe/status to check subscription status.
 *
 *       Only works for services that support OAuth login (github, google, microsoft).
 *       Returns 404 for non-OAuth services like timer.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: service
 *         in: path
 *         required: true
 *         description: Service name (github, google, microsoft)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OAuth login status (connected)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                   example: true
 *                 token_expires_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 scopes:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: OAuth not completed or service doesn't support OAuth login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/:service/login/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    const service = req.params.service?.toLowerCase();
    if (!service) {
      return res.status(400).json({ error: 'Service parameter is required' });
    }

    const userId = (req.auth as { id: number }).id;

    try {
      // Check if service uses OAuth by looking at service definition
      const serviceDefinition = serviceRegistry.getService(service);
      const usesOAuth = serviceDefinition?.oauth?.enabled ?? true;

      if (!usesOAuth) {
        return res.status(404).json({
          connected: false,
          message: `${service} does not support OAuth login`,
        });
      }

      const serviceOAuth = await import(
        `../../services/services/${service}/oauth`
      );
      const oauthInstance = serviceOAuth[`${service}OAuth`];
      const userToken = await oauthInstance.getUserToken(userId);

      if (!userToken) {
        return res.status(404).json({
          connected: false,
          message: `${service} OAuth not completed`,
        });
      }

      return res.status(200).json({
        connected: true,
        token_expires_at: userToken.expires_at,
        scopes: userToken.scopes,
      });
    } catch (error) {
      console.error(`Error checking ${service} login status:`, error);
      return res.status(500).json({
        error: `Internal Server Error in ${service} login status`,
      });
    }
  }
);

export default router;
