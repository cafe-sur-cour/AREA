import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { twitchOAuth } from '../../services/services/twitch/oauth';
import { serviceSubscriptionManager } from '../../services/ServiceSubscriptionManager';

const router = express.Router();

/**
 * @swagger
 * /api/twitch/login/status:
 *   get:
 *     summary: Check Twitch OAuth login status
 *     tags:
 *       - Twitch OAuth
 *     description: |
 *       Checks if user has completed OAuth authentication with Twitch.
 *       This indicates if the user can access Twitch API but not necessarily
 *       subscribed to Twitch events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Twitch OAuth status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                 token_expires_at:
 *                   type: string
 *                   nullable: true
 *                 scopes:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Twitch not connected
 */
router.get(
  '/login/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const userToken = await twitchOAuth.getUserToken(userId);

      if (!userToken) {
        return res.status(404).json({
          connected: false,
          message: 'Twitch OAuth not completed',
        });
      }

      return res.status(200).json({
        connected: true,
        token_expires_at: userToken.expires_at,
        scopes: userToken.scopes,
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in twitch login status' });
    }
  }
);

/**
 * @swagger
 * /api/twitch/subscribe/status:
 *   get:
 *     summary: Check Twitch service subscription status
 *     tags:
 *       - Twitch Service
 *     description: |
 *       Checks if user is subscribed to Twitch events. This is independent
 *       from OAuth login - user can be logged in but not subscribed to events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Twitch subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                   description: True if user is subscribed to Twitch events
 *                 oauth_connected:
 *                   type: boolean
 *                   description: True if user has Twitch OAuth token
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
 *         description: Not subscribed to Twitch service
 */
router.get(
  '/subscribe/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      console.log(
        `🔄 [STATUS] Checking Twitch subscription status for user ${userId}`
      );
      const userToken = await twitchOAuth.getUserToken(userId);
      const oauthConnected = !!userToken;

      const subscription = await serviceSubscriptionManager.getUserSubscription(
        userId,
        'twitch'
      );
      const isSubscribed = subscription?.subscribed || false;

      console.log(
        `✅ [STATUS] Twitch status for user ${userId}: subscribed=${isSubscribed}, oauth=${oauthConnected}`
      );

      if (!isSubscribed) {
        return res.status(404).json({
          subscribed: false,
          oauth_connected: oauthConnected,
          can_create_webhooks: false,
          message: 'Not subscribed to Twitch events',
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
        `❌ [STATUS] Error fetching Twitch subscription status for user ${(req.auth as { id: number }).id}:`,
        err
      );
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/twitch/unsubscribe:
 *   post:
 *     summary: Unsubscribe from Twitch events
 *     tags:
 *       - Twitch Service
 *     description: |
 *       Unsubscribe user from Twitch events. OAuth connection remains intact.
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
        'twitch'
      );

      if (!subscription) {
        return res.status(404).json({
          message: 'Not subscribed to Twitch service',
        });
      }

      return res.status(200).json({
        message: 'Successfully unsubscribed from Twitch service',
        subscription: {
          subscribed: subscription.subscribed,
          unsubscribed_at: subscription.unsubscribed_at,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
