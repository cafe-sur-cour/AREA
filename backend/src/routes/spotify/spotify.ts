import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { spotifyOAuth } from '../../services/services/spotify/oauth';
import { serviceSubscriptionManager } from '../../services/ServiceSubscriptionManager';

const router = express.Router();

/**
 * @swagger
 * /api/spotify/login/status:
 *   get:
 *     summary: Check Spotify OAuth login status
 *     tags:
 *       - Spotify OAuth
 *     description: |
 *       Checks if user has completed OAuth authentication with Spotify.
 *       This indicates if the user can access Spotify API but not necessarily
 *       subscribed to Spotify events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Spotify OAuth status
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
 *         description: Spotify not connected
 */
router.get(
  '/login/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const userToken = await spotifyOAuth.getUserToken(userId);

      if (!userToken) {
        return res.status(404).json({
          connected: false,
          message: 'Spotify OAuth not completed',
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
 * /api/spotify/subscribe/status:
 *   get:
 *     summary: Check Spotify service subscription status
 *     tags:
 *       - Spotify Service
 *     description: |
 *       Checks if user is subscribed to Spotify events. This is independent
 *       from OAuth login - user can be logged in but not subscribed to events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Spotify subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                   description: True if user is subscribed to Spotify events
 *                 oauth_connected:
 *                   type: boolean
 *                   description: True if user has Spotify OAuth token
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
 *         description: Not subscribed to Spotify service
 */
router.get(
  '/subscribe/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      const userToken = await spotifyOAuth.getUserToken(userId);
      const oauthConnected = !!userToken;

      const subscription = await serviceSubscriptionManager.getUserSubscription(
        userId,
        'spotify'
      );
      const isSubscribed = subscription?.subscribed || false;

      if (!isSubscribed) {
        return res.status(404).json({
          subscribed: false,
          oauth_connected: oauthConnected,
          can_create_webhooks: false,
          message: 'Not subscribed to Spotify events',
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
 * /api/spotify/unsubscribe:
 *   post:
 *     summary: Unsubscribe from Spotify events
 *     tags:
 *       - Spotify Service
 *     description: |
 *       Unsubscribe user from Spotify events. OAuth connection remains intact.
 *       NOTE: Spotify webhook implementation is not yet complete.
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
        'spotify'
      );

      if (!subscription) {
        return res.status(404).json({
          error: 'No active subscription found',
        });
      }

      return res.status(200).json({
        message: 'Successfully unsubscribed from Spotify events',
        subscription: {
          subscribed: subscription.subscribed,
          unsubscribed_at: subscription.unsubscribed_at,
          service: subscription.service,
        },
        note: 'Spotify webhook cleanup will be implemented when webhooks are ready',
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
