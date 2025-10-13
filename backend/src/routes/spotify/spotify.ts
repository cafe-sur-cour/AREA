import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { spotifyOAuth } from '../../services/services/spotify/oauth';

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

export default router;
