import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { githubWebhookManager } from '../../services/services/github/webhookManager';
import { githubOAuth } from '../../services/services/github/oauth';

const router = express.Router();

/**
 * @swagger
 * /api/github/oauth/status:
 *   get:
 *     summary: Check GitHub OAuth connection status
 *     description: |
 *       Retrieves the current GitHub OAuth connection status for the authenticated user.
 *       Returns whether the user has connected their GitHub account and provides token details if connected.
 *     tags:
 *       - GitHub OAuth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GitHub OAuth connection status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: User is not connected to GitHub
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                       example: false
 *                       description: Indicates if the user has connected GitHub OAuth
 *                     message:
 *                       type: string
 *                       example: "GitHub not connected"
 *                       description: Status message explaining the connection state
 *                   required:
 *                     - connected
 *                     - message
 *                 - type: object
 *                   description: User is connected to GitHub
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                       example: true
 *                       description: Indicates if the user has connected GitHub OAuth
 *                     token_expires_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-29T15:30:00.000Z"
 *                       description: Date and time when the OAuth token expires
 *                     scopes:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "repo"
 *                       description: Array of OAuth scopes granted to the token
 *                       example: ["repo", "user:email", "read:org"]
 *                   required:
 *                     - connected
 *                     - token_expires_at
 *                     - scopes
 *       401:
 *         description: Unauthorized - User must be authenticated to check OAuth status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error occurred while checking OAuth status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.get(
  '/oauth/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const token = await githubOAuth.getUserToken(userId);

      if (!token) {
        return res.status(200).json({
          connected: false,
          message: 'GitHub not connected',
        });
      }

      return res.status(200).json({
        connected: true,
        token_expires_at: token.expires_at,
        scopes: token.scopes,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
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
      return res.status(500).json({ error: 'Internal Server Error' });
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
      return res.status(500).json({ error: 'Internal Server Error' });
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
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
