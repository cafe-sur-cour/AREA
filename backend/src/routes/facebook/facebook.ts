import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { facebookOAuth } from '../../services/services/facebook/oauth';

const router = express.Router();

router.get('/login/status', token, async (req: Request, res: Response) => {
  try {
    const userID = (req.auth as { id: number }).id;
    const userToken = await facebookOAuth.getUserToken(userID);

    if (!userToken) {
      return res.status(404).json({
        error: 'No valid Facebook access token found for user',
      });
    }

    return res.status(200).json({
      connected: true,
      token_expires_at: userToken.expires_at,
      scopes: userToken.scopes,
    });
  } catch (error) {
    console.error('Error checking Facebook login status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
