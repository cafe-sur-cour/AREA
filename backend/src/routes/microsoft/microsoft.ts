import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { microsoftOAuth } from '../../services/services/microsoft/oauth';
import { serviceSubscriptionManager } from '../../services/ServiceSubscriptionManager';

const router = express.Router();

/**
 * @swagger
 * /api/microsoft/login/status:
 *   get:
 *     summary: Check Microsoft OAuth login status
 *     tags:
 *       - Microsoft OAuth
 *     description: |
 *       Checks if user has completed OAuth authentication with Microsoft 365.
 *       This indicates if the user can access Microsoft Graph API but not necessarily
 *       subscribed to Microsoft events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Microsoft OAuth status
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
 *         description: Microsoft not connected
 */
router.get(
  '/login/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const userToken = await microsoftOAuth.getUserToken(userId);

      if (!userToken) {
        return res.status(404).json({
          connected: false,
          message: 'Microsoft OAuth not completed',
        });
      }

      return res.status(200).json({
        connected: true,
        token_expires_at: userToken.expires_at,
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
 * /api/microsoft/subscribe/status:
 *   get:
 *     summary: Check Microsoft service subscription status
 *     tags:
 *       - Microsoft Service
 *     description: |
 *       Checks if user is subscribed to Microsoft events. This is independent
 *       from OAuth login - user can be logged in but not subscribed to events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Microsoft subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                   description: True if user is subscribed to Microsoft events
 *                 oauth_connected:
 *                   type: boolean
 *                   description: True if user has Microsoft OAuth token
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
 *         description: Not subscribed to Microsoft service
 */
router.get(
  '/subscribe/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      const userToken = await microsoftOAuth.getUserToken(userId);
      const oauthConnected = !!userToken;

      const subscription = await serviceSubscriptionManager.getUserSubscription(
        userId,
        'microsoft'
      );
      const isSubscribed = subscription?.subscribed || false;

      if (!isSubscribed) {
        return res.status(404).json({
          subscribed: false,
          oauth_connected: oauthConnected,
          can_create_webhooks: false,
          message: 'Not subscribed to Microsoft events',
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
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/microsoft/subscribe:
 *   post:
 *     summary: Subscribe to Microsoft events
 *     tags:
 *       - Microsoft Service
 *     description: |
 *       Subscribe user to Microsoft events. Requires OAuth to be connected first.
 *       NOTE: Microsoft webhook implementation is not yet complete.
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

      const userToken = await microsoftOAuth.getUserToken(userId);
      if (!userToken) {
        return res.status(400).json({
          error:
            'Microsoft OAuth required first. Please connect your Microsoft account.',
        });
      }

      const subscription = await serviceSubscriptionManager.subscribeUser(
        userId,
        'microsoft'
      );

      return res.status(200).json({
        message:
          'Successfully subscribed to Microsoft events (webhook implementation pending)',
        subscription: {
          subscribed: subscription.subscribed,
          subscribed_at: subscription.subscribed_at,
          service: subscription.service,
        },
        note: 'Microsoft webhook integration is not yet implemented',
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
