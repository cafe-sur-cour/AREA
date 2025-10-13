import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { microsoftOAuth } from '../../services/services/microsoft/oauth';

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

export default router;
