import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { googleOAuth } from '../../services/services/google/oauth';

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
      return res
        .status(500)
        .json({ error: 'Internal Server Error in google login status' });
    }
  }
);

export default router;
