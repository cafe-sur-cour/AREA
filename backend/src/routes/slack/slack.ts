import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { slackOAuth } from '../../services/services/slack/oauth';

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

export default router;
