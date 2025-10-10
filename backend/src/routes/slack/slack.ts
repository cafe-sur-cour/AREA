import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { slackOAuth } from '../../services/services/slack/oauth';
import { serviceSubscriptionManager } from '../../services/ServiceSubscriptionManager';

const router = express.Router();

/**
 * @swagger
 * /api/slack/login/status:
 *   get:
 *     summary: Check Slack OAuth login status
 *     tags:
 *       - Slack OAuth
 *     description: |
 *       Checks if user has completed OAuth authentication with Slack.
 *       This indicates if the user can access Slack API but not necessarily
 *       subscribed to Slack events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slack OAuth status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                 scopes:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Slack not connected
 */
router.get(
  '/login/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const userToken = await slackOAuth.getUserToken(userId);

      if (!userToken) {
        return res.status(404).json({
          connected: false,
          message: 'Slack OAuth not completed',
        });
      }

      return res.status(200).json({
        connected: true,
        scopes: userToken.scopes,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/slack/subscribe/status:
 *   get:
 *     summary: Check Slack service subscription status
 *     tags:
 *       - Slack Service
 *     description: |
 *       Checks if user is subscribed to Slack events. This is independent
 *       from OAuth login - user can be logged in but not subscribed to events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slack subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                   description: True if user is subscribed to Slack events
 *                 oauth_connected:
 *                   type: boolean
 *                   description: True if user has Slack OAuth token
 *                 can_create_webhooks:
 *                   type: boolean
 *                   description: True if user can create webhooks (subscribed + oauth)
 *                 subscribed_at:
 *                   type: string
 *                   nullable: true
 *                 unsubscribed_at:
 *                   type: string
 *                   nullable: true
 *       404:
 *         description: Not subscribed to Slack service
 */
router.get(
  '/subscribe/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      console.log(
        `🔄 [STATUS] Checking Slack subscription status for user ${userId}`
      );
      const userToken = await slackOAuth.getUserToken(userId);
      const oauthConnected = !!userToken;

      const subscription = await serviceSubscriptionManager.getUserSubscription(
        userId,
        'slack'
      );
      const isSubscribed = subscription?.subscribed || false;

      console.log(
        `✅ [STATUS] Slack status for user ${userId}: subscribed=${isSubscribed}, oauth=${oauthConnected}`
      );

      if (!isSubscribed) {
        return res.status(404).json({
          subscribed: false,
          oauth_connected: oauthConnected,
          can_create_webhooks: false,
          message: 'Not subscribed to Slack events',
        });
      }

      return res.status(200).json({
        subscribed: true,
        oauth_connected: oauthConnected,
        can_create_webhooks: isSubscribed && oauthConnected,
        subscribed_at: subscription?.subscribed_at || null,
        unsubscribed_at: subscription?.unsubscribed_at || null,
        scopes: userToken?.scopes || null,
      });
    } catch (err) {
      console.error(
        `❌ [STATUS] Error fetching Slack subscription status for user ${(req.auth as { id: number }).id}:`,
        err
      );
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/slack/unsubscribe:
 *   post:
 *     summary: Unsubscribe from Slack events
 *     tags:
 *       - Slack Service
 *     description: |
 *       Unsubscribe user from Slack events. OAuth connection remains intact.
 *       NOTE: Slack webhook implementation is not yet complete.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 *       404:
 *         description: Not subscribed
 *       500:
 *         description: Internal Server Error
 */
router.post(
  '/unsubscribe',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      const subscription = await serviceSubscriptionManager.unsubscribeUser(
        userId,
        'slack'
      );

      if (!subscription) {
        return res.status(404).json({
          error: 'No active subscription found',
        });
      }

      console.log(
        `✅ [UNSUBSCRIBE] Slack unsubscription successful for user ${userId}`
      );
      return res.status(200).json({
        message: 'Successfully unsubscribed from Slack events',
        subscription: {
          subscribed: subscription.subscribed,
          unsubscribed_at: subscription.unsubscribed_at,
          service: subscription.service,
        },
        note: 'Slack webhook cleanup will be implemented when webhooks are ready',
      });
    } catch (err) {
      console.error(
        `❌ [UNSUBSCRIBE] Error in Slack unsubscription for user ${(req.auth as { id: number }).id}:`,
        err
      );
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
