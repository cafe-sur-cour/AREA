import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import passport from 'passport';
import { createLog } from '../logs/logs.service';

const router = express.Router();

/**
 * @swagger
 * /api/auth/github/subscribe:
 *   get:
 *     summary: Subscribe to GitHub service (OAuth + App Installation)
 *     tags:
 *       - OAuth
 *     description: |
 *       Complete subscription to GitHub service including OAuth authorization
 *       and GitHub App installation. This handles the full flow to enable
 *       webhook creation on user repositories.
 *
 *       If user is already subscribed, returns success immediately.
 *       If user has OAuth but not subscribed, redirects to app installation.
 *       If user has no OAuth, starts OAuth flow.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Already subscribed to GitHub
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 already_subscribed:
 *                   type: boolean
 *       302:
 *         description: Redirect to GitHub for OAuth or App installation
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/github/subscribe',
  token,
  async (req: Request, res: Response, next) => {
    if (!req.auth) {
      await createLog(
        401,
        'github',
        `Authentication required to subscribe to GitHub`
      );
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userId = (req.auth as { id: number }).id;

      const { serviceSubscriptionManager } = await import(
        '../../services/ServiceSubscriptionManager'
      );
      const existingSubscription =
        await serviceSubscriptionManager.getUserSubscription(userId, 'github');

      if (existingSubscription?.subscribed) {
        await createLog(
          200,
          'github',
          `User ${userId} already subscribed to GitHub`
        );
        return res.status(200).json({
          message: 'Already subscribed to GitHub service',
          already_subscribed: true,
        });
      }

      const { githubOAuth } = await import(
        '../../services/services/github/oauth'
      );
      const existingToken = await githubOAuth.getUserToken(userId);

      if (existingToken) {
        const appSlug = process.env.GITHUB_APP_SLUG || '';
        const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${userId}`;
        await createLog(
          302,
          'github',
          `Redirecting user ${userId} to GitHub app installation`
        );
        return res.redirect(installUrl);
      }

      const session = req.session as
        | { githubSubscriptionFlow?: boolean }
        | undefined;
      if (session) {
        session.githubSubscriptionFlow = true;
      }

      await createLog(
        302,
        'github',
        `Starting OAuth flow for user ${userId} to subscribe to GitHub`
      );
      passport.authenticate('github-subscribe', { session: false })(
        req,
        res,
        next
      );
    } catch (error) {
      console.error('Error in GitHub subscribe route:', error);
      await createLog(
        500,
        'github',
        `Error in GitHub subscribe route: ${error instanceof Error ? error.message : String(error)}`
      );
      return res
        .status(500)
        .json({ error: 'Internal Server Error in github subscribe' });
    }
  }
);

/**
 * @swagger
 * /api/auth/google/subscribe:
 *   get:
 *     summary: Subscribe to Google service (OAuth + Subscription)
 *     tags:
 *       - OAuth
 *     description: |
 *       Complete subscription to Google service including OAuth authorization.
 *       This handles the full flow to enable Google API access.
 *
 *       If user is already subscribed, returns success immediately.
 *       If user has OAuth but not subscribed, performs subscription.
 *       If user has no OAuth, starts OAuth flow.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully subscribed to Google
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 already_subscribed:
 *                   type: boolean
 *       302:
 *         description: Redirect to Google for OAuth
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/google/subscribe',
  token,
  async (req: Request, res: Response, next) => {
    if (!req.auth) {
      await createLog(
        401,
        'google',
        `Authentication required to subscribe to Google`
      );
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userId = (req.auth as { id: number }).id;

      const { serviceSubscriptionManager } = await import(
        '../../services/ServiceSubscriptionManager'
      );
      const existingSubscription =
        await serviceSubscriptionManager.getUserSubscription(userId, 'google');

      if (existingSubscription?.subscribed) {
        await createLog(
          200,
          'google',
          `User ${userId} already subscribed to Google`
        );
        return res.status(200).json({
          message: 'Already subscribed to Google service',
          already_subscribed: true,
        });
      }

      const { googleOAuth } = await import(
        '../../services/services/google/oauth'
      );
      const existingToken = await googleOAuth.getUserToken(userId);

      if (existingToken) {
        const subscription = await serviceSubscriptionManager.subscribeUser(
          userId,
          'google'
        );
        await createLog(
          200,
          'google',
          `User ${userId} subscribed to Google service`
        );
        return res.status(200).json({
          message: 'Successfully subscribed to Google service',
          subscription: {
            subscribed: subscription.subscribed,
            subscribed_at: subscription.subscribed_at,
            service: subscription.service,
          },
        });
      }

      await createLog(
        302,
        'google',
        `Starting OAuth flow for user ${userId} to subscribe to Google`
      );
      passport.authenticate('google-subscribe', {
        scope: ['openid', 'email', 'profile'],
        session: false,
      })(req, res, next);
    } catch (error) {
      console.error('Error in Google subscribe route:', error);
      await createLog(
        500,
        'google',
        `Error in Google subscribe route: ${error instanceof Error ? error.message : String(error)}`
      );
      return res
        .status(500)
        .json({ error: 'Internal Server Error in google subscribe' });
    }
  }
);

/**
 * @swagger
 * /api/auth/spotify/subscribe:
 *   get:
 *     summary: Subscribe to Spotify service (OAuth + Subscription)
 *     tags:
 *       - OAuth
 *     description: |
 *       Complete subscription to Spotify service including OAuth authorization.
 *       This handles the full flow to enable Spotify API access.
 *
 *       If user is already subscribed, returns success immediately.
 *       If user has OAuth but not subscribed, performs subscription.
 *       If user has no OAuth, starts OAuth flow.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully subscribed to Spotify
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 already_subscribed:
 *                   type: boolean
 *       302:
 *         description: Redirect to Spotify for OAuth
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/spotify/subscribe',
  token,
  async (req: Request, res: Response, next) => {
    if (!req.auth) {
      await createLog(
        401,
        'spotify',
        `Authentication required to subscribe to Spotify`
      );
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userId = (req.auth as { id: number }).id;

      const { serviceSubscriptionManager } = await import(
        '../../services/ServiceSubscriptionManager'
      );
      const existingSubscription =
        await serviceSubscriptionManager.getUserSubscription(userId, 'spotify');

      if (existingSubscription?.subscribed) {
        await createLog(
          200,
          'spotify',
          `User ${userId} already subscribed to Spotify`
        );
        return res.status(200).json({
          message: 'Already subscribed to Spotify service',
          already_subscribed: true,
        });
      }

      const { spotifyOAuth } = await import(
        '../../services/services/spotify/oauth'
      );
      const existingToken = await spotifyOAuth.getUserToken(userId);

      if (existingToken) {
        const subscription = await serviceSubscriptionManager.subscribeUser(
          userId,
          'spotify'
        );
        await createLog(
          200,
          'spotify',
          `User ${userId} subscribed to Spotify service`
        );
        return res.status(200).json({
          message: 'Successfully subscribed to Spotify service',
          subscription: {
            subscribed: subscription.subscribed,
            subscribed_at: subscription.subscribed_at,
            service: subscription.service,
          },
        });
      }

      await createLog(
        302,
        'spotify',
        `Starting OAuth flow for user ${userId} to subscribe to Spotify`
      );
      passport.authenticate('spotify-subscribe', {
        session: false,
      })(req, res, next);
    } catch (error) {
      console.error('Error in Spotify subscribe route:', error);
      await createLog(
        500,
        'spotify',
        `Error in Spotify subscribe route: ${error instanceof Error ? error.message : String(error)}`
      );
      return res
        .status(500)
        .json({ error: 'Internal Server Error in spotify subscribe' });
    }
  }
);

/**
 * @swagger
 * /api/auth/timer/subscribe:
 *   get:
 *     summary: Subscribe to Timer service
 *     tags:
 *       - Services
 *     description: |
 *       Subscribe to Timer service. Timer service doesn't require OAuth
 *       as it provides time-based triggers locally.
 *
 *       If user is already subscribed, returns success immediately.
 *       Otherwise, performs subscription to enable timer-based automations.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully subscribed to Timer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 already_subscribed:
 *                   type: boolean
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Internal Server Error
 */
router.get('/timer/subscribe', token, async (req: Request, res: Response) => {
  if (!req.auth) {
    await createLog(
      401,
      'other',
      `Authentication required to subscribe to Timer`
    );
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userId = (req.auth as { id: number }).id;

    const { serviceSubscriptionManager } = await import(
      '../../services/ServiceSubscriptionManager'
    );
    const existingSubscription =
      await serviceSubscriptionManager.getUserSubscription(userId, 'timer');

    if (existingSubscription?.subscribed) {
      await createLog(
        200,
        'other',
        `User ${userId} already subscribed to Timer`
      );
      return res.status(200).json({
        message: 'Already subscribed to Timer service',
        already_subscribed: true,
      });
    }

    const subscription = await serviceSubscriptionManager.subscribeUser(
      userId,
      'timer'
    );
    await createLog(200, 'other', `User ${userId} subscribed to Timer service`);
    return res.status(200).json({
      message: 'Successfully subscribed to Timer service',
      subscription: {
        subscribed: subscription.subscribed,
        subscribed_at: subscription.subscribed_at,
        service: subscription.service,
      },
    });
  } catch (error) {
    console.error('Error in Timer subscribe route:', error);
    await createLog(
      500,
      'other',
      `Error in Timer subscribe route: ${error instanceof Error ? error.message : String(error)}`
    );
    return res
      .status(500)
      .json({ error: 'Internal Server Error in timer subscribe' });
  }
});

export default router;
