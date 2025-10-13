import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { twitchOAuth } from '../../services/services/twitch/oauth';

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

export default router;
