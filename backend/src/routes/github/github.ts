import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { githubWebhookManager } from '../../services/services/github/webhookManager';
import { githubOAuth } from '../../services/services/github/oauth';
import { serviceSubscriptionManager } from '../../services/ServiceSubscriptionManager';

const router = express.Router();

/**
 * @swagger
 * /api/github/login/status:
 *   get:
 *     summary: Check GitHub OAuth login status
 *     tags:
 *       - GitHub OAuth
 *     description: |
 *       Checks if user has completed OAuth authentication with GitHub.
 *       This indicates if the user can access GitHub API but not necessarily
 *       create webhooks (which requires app installation).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GitHub OAuth status
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
 *         description: GitHub not connected
 */
router.get(
  '/login/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const userToken = await githubOAuth.getUserToken(userId);

      if (!userToken) {
        return res.status(404).json({
          connected: false,
          message: 'GitHub OAuth not completed',
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
        .json({ error: 'Internal Server Error in github login status' });
    }
  }
);

/**
 * @swagger
 * /api/github/subscribe/status:
 *   get:
 *     summary: Check GitHub service subscription status
 *     tags:
 *       - GitHub Service
 *     description: |
 *       Checks if user is subscribed to GitHub events. This is independent
 *       from OAuth login - user can be logged in but not subscribed to events.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GitHub subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                   description: True if user is subscribed to GitHub events
 *                 oauth_connected:
 *                   type: boolean
 *                   description: True if user has GitHub OAuth token
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
 *         description: Not subscribed to GitHub service
 */
router.get(
  '/subscribe/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      const userToken = await githubOAuth.getUserToken(userId);
      const oauthConnected = !!userToken;

      const subscription = await serviceSubscriptionManager.getUserSubscription(
        userId,
        'github'
      );
      const isSubscribed = subscription?.subscribed || false;

      if (!isSubscribed) {
        return res.status(404).json({
          subscribed: false,
          oauth_connected: oauthConnected,
          can_create_webhooks: false,
          message: 'Not subscribed to GitHub events',
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
      return res
        .status(500)
        .json({ error: 'Internal Server Error in github subscribe status' });
    }
  }
);

/**
 * @swagger
 * /api/github/subscribe:
 *   post:
 *     summary: Subscribe to GitHub events
 *     tags:
 *       - GitHub Service
 *     description: |
 *       Subscribe user to GitHub events. Requires OAuth to be connected first.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully subscribed
 *       400:
 *         description: OAuth required first
 *       500:
 *         description: Internal Server Error
 */
router.post(
  '/subscribe',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      const userToken = await githubOAuth.getUserToken(userId);
      if (!userToken) {
        return res.status(400).json({
          error:
            'GitHub OAuth required first. Please connect your GitHub account.',
        });
      }

      const subscription = await serviceSubscriptionManager.subscribeUser(
        userId,
        'github'
      );

      return res.status(200).json({
        message: 'Successfully subscribed to GitHub events',
        subscription: {
          subscribed: subscription.subscribed,
          subscribed_at: subscription.subscribed_at,
          service: subscription.service,
        },
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in github subscribe' });
    }
  }
);

/**
 * @swagger
 * /api/github/unsubscribe:
 *   post:
 *     summary: Unsubscribe from GitHub events
 *     tags:
 *       - GitHub Service
 *     description: |
 *       Unsubscribe user from GitHub events. OAuth connection remains intact.
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
        'github'
      );

      if (!subscription) {
        return res.status(404).json({
          error: 'No active subscription found',
        });
      }

      return res.status(200).json({
        message: 'Successfully unsubscribed from GitHub events',
        subscription: {
          subscribed: subscription.subscribed,
          unsubscribed_at: subscription.unsubscribed_at,
          service: subscription.service,
        },
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in github unsubscribe' });
    }
  }
);

/**
 * @swagger
 * /api/github/webhooks:
 *   get:
 *     summary: Get user's GitHub webhooks
 *     tags:
 *       - GitHub Webhooks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's GitHub webhooks
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/webhooks',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const webhooks = await githubWebhookManager.getUserWebhooks(userId);
      return res.status(200).json(webhooks);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in github webhooks' });
    }
  }
);

/**
 * @swagger
 * /api/github/webhooks:
 *   post:
 *     summary: Create a GitHub webhook
 *     tags:
 *       - GitHub Webhooks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - repository
 *               - events
 *             properties:
 *               repository:
 *                 type: string
 *                 description: Repository in format owner/repo
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of events to subscribe to
 *               secret:
 *                 type: string
 *                 description: Optional webhook secret
 *     responses:
 *       201:
 *         description: Webhook created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/webhooks',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const { repository, events, secret } = req.body;

      if (!repository || !events || !Array.isArray(events)) {
        return res
          .status(400)
          .json({ error: 'Repository and events are required' });
      }

      const webhook = await githubWebhookManager.createWebhook(userId, {
        repository,
        events,
        secret,
      });

      return res.status(201).json(webhook);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in github webhooks' });
    }
  }
);

/**
 * @swagger
 * /api/github/webhooks/{id}:
 *   delete:
 *     summary: Delete a GitHub webhook
 *     tags:
 *       - GitHub Webhooks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Webhook ID
 *     responses:
 *       200:
 *         description: Webhook deleted successfully
 *       404:
 *         description: Webhook not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/webhooks/:id',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const webhookId = Number(req.params.id);

      await githubWebhookManager.deleteWebhook(userId, webhookId);

      return res.status(200).json({ message: 'Webhook deleted successfully' });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in github webhooks' });
    }
  }
);

export default router;
