import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { githubWebhookManager } from '../../services/services/github/webhookManager';
import { githubOAuth } from '../../services/services/github/oauth';

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
