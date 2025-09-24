import express, { Request, Response } from 'express';
import * as auth from './auth.service';

const router = express.Router();

/* Auth GET Routes */

/**
 * @swagger
 * /api/auth/login/status:
 *   get:
 *     summary: Check the login status of the current user
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: User is authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: User is not authenticated
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/login/status',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      if (req.auth) {
        return res.status(200).json({ authenticated: true, user: req.auth });
      } else {
        return res.status(401).json({ authenticated: false });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);
/* Auth PUT Routes */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/login',
  async (req: Request, res: Response): Promise<Response | void> => {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        const missingFields = [];
        if (!email) missingFields.push('email');
        if (!password) missingFields.push('password');
        res.status(400).json({
          error: 'Bad Request',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        });
        return;
      }
      const token = await auth.login(email, password);
      res.cookie('auth_token', token, {
        maxAge: 86400000,
        httpOnly: true,
        sameSite: 'strict',
      });
      return res.status(200).json({ token });
    } catch (err) {
      console.error(err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal Server Error
 */
router.post(
  '/register',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const body = req.body || {};
      const { email, name, password } = body;
      console.log('Parsed body: ', { email, name, password });

      const missingFields = Object.entries({ email, name, password })
        .filter(([, value]) => value == null || value === '')
        .map(([key]) => key);

      if (missingFields.length > 0) {
        console.log('Length : ', missingFields.length);
        return res.status(400).json({
          error: 'Bad Request',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        });
      }
      const result = await auth.register(email, name, password);
      if (result instanceof Error) {
        res.status(409).json({ error: result.message });
        return;
      }
      res.status(201).json({ message: 'User registered successfully' });
      return;
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: User is logout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Internal Server Error
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('auth_token');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
