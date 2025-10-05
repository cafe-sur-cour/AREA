import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { googleOAuth } from '../../services/services/google/oauth';
import { serviceSubscriptionManager } from '../../services/ServiceSubscriptionManager';

const router = express.Router();

/**
 * @swagger
 * /api/google/login/status:
 *   get:
 *     summary: Check Google OAuth login status
 *     tags:
 *       - Google OAuth
 *     description: |
 *       Checks if user has completed OAuth authentication with Google.
 *       This indicates if the user can access Google API but not necessarily
 *       subscribed to Google events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google OAuth status
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
 *         description: Google not connected
 */
router.get(
  '/login/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const userToken = await googleOAuth.getUserToken(userId);

      if (!userToken) {
        return res.status(404).json({
          connected: false,
          message: 'Google OAuth not completed',
        });
      }

      return res.status(200).json({
        connected: true,
        token_expires_at: userToken.expires_at,
        scopes: userToken.scopes,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error in google login status' });
    }
  }
);

/**
 * @swagger
 * /api/google/subscribe/status:
 *   get:
 *     summary: Check Google service subscription status
 *     tags:
 *       - Google Service
 *     description: |
 *       Checks if user is subscribed to Google events. This is independent
 *       from OAuth login - user can be logged in but not subscribed to events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                   description: True if user is subscribed to Google events
 *                 oauth_connected:
 *                   type: boolean
 *                   description: True if user has Google OAuth token
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
 *         description: Not subscribed to Google service
 */
router.get(
  '/subscribe/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      const userToken = await googleOAuth.getUserToken(userId);
      const oauthConnected = !!userToken;

      const subscription = await serviceSubscriptionManager.getUserSubscription(
        userId,
        'google'
      );
      const isSubscribed = subscription?.subscribed || false;

      if (!isSubscribed) {
        return res.status(404).json({
          subscribed: false,
          oauth_connected: oauthConnected,
          can_create_webhooks: false,
          message: 'Not subscribed to Google events',
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
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error in google subscribe status' });
    }
  }
);

/**
 * @swagger
 * /api/google/subscribe:
 *   post:
 *     summary: Subscribe to Google events
 *     tags:
 *       - Google Service
 *     description: |
 *       Subscribe user to Google events. Requires OAuth to be connected first.
 *       NOTE: Google webhook implementation is not yet complete.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully subscribed
 *       400:
 *         description: OAuth required first
 *       501:
 *         description: Not implemented yet
 *       500:
 *         description: Internal Server Error
 */
router.post(
  '/subscribe',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      const userToken = await googleOAuth.getUserToken(userId);
      if (!userToken) {
        return res.status(400).json({
          error:
            'Google OAuth required first. Please connect your Google account.',
        });
      }

      // TODO: Implement Google subscription logic
      const subscription = await serviceSubscriptionManager.subscribeUser(
        userId,
        'google'
      );

      return res.status(200).json({
        message:
          'Successfully subscribed to Google events (webhook implementation pending)',
        subscription: {
          subscribed: subscription.subscribed,
          subscribed_at: subscription.subscribed_at,
          service: subscription.service,
        },
        note: 'Google webhook integration is not yet implemented',
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error in google subscribe' });
    }
  }
);

/**
 * @swagger
 * /api/google/unsubscribe:
 *   post:
 *     summary: Unsubscribe from Google events
 *     tags:
 *       - Google Service
 *     description: |
 *       Unsubscribe user from Google events. OAuth connection remains intact.
 *       NOTE: Google webhook implementation is not yet complete.
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
        'google'
      );

      if (!subscription) {
        return res.status(404).json({
          error: 'No active subscription found',
        });
      }

      return res.status(200).json({
        message: 'Successfully unsubscribed from Google events',
        subscription: {
          subscribed: subscription.subscribed,
          unsubscribed_at: subscription.unsubscribed_at,
          service: subscription.service,
        },
        note: 'Google webhook cleanup will be implemented when webhooks are ready',
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error in google unsubscribe' });
    }
  }
);

export default router;
