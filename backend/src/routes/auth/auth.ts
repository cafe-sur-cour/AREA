import express, { Request, Response } from 'express';
import * as auth from './auth.service';
import nodemailer from 'nodemailer';
import process from 'process';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from 'index';

interface TokenPayload extends jwt.JwtPayload {
  email: string;
}

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
      const token = await auth.register(email, name, password);
      if (token instanceof Error) {
        res.status(409).json({ error: token.message });
        return;
      }

      const transporter = nodemailer.createTransport({
        service: 'SMTP',
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || '',
        },
      });

      transporter
        .verify()
        .then(() => console.log('SMTP prêt !'))
        .catch(err => console.error('Erreur SMTP :', err));

      const mailOptions = {
        from: '"Your App" <no-reply@yourapp.com>',
        to: email,
        subject: '🔐 Account Verification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #648BA0; border-radius: 10px; background-color: #e4e2dd;">
          <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Open+Sans&display=swap');
          </style>
          <h2 style="color: #000000ff; text-align: center; font-family: 'Montserrat', Arial, sans-serif;">🔐 Verify Your Account</h2>
          <p style="font-size: 16px; font-family: 'Open Sans', Arial, sans-serif; color: #000000ff;">
          Hello ${name},
          </p>
          <p style="font-size: 16px; font-family: 'Open Sans', Arial, sans-serif; color: #000000ff;">
          Thank you for registering! Please verify your email address to complete your registration and access all features.
          </p>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
          <tr>
              <td align="center" bgcolor="#57798B" style="border-radius: 5px;">
              <a href="${process.env.FRONTEND_URL}/verify?token=${token}"
              target="_blank"
              style="font-size: 16px; font-family: 'Open Sans', Arial, sans-serif; color: #FFFFFF; text-decoration: none; padding: 12px 24px; display: inline-block;">
              ✓ Verify My Account
              </a>
              </td>
          </tr>
          </table>

          <p style="font-size: 14px; font-family: 'Open Sans', Arial, sans-serif, color: #000000ff;">
          If you did not create an account, please ignore this email.
          </p>
          <hr style="margin: 20px 0; border-color: #000000ff;">
          <p style="font-size: 12px; font-family: 'Open Sans', Arial, sans-serif; color: #000000ff; text-align: center;">
          © ${new Date().getFullYear()} Café sur Cour - AREA - All rights reserved
          </p>
          </div>
          `,
      };

      await transporter.sendMail(mailOptions);
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

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify an user's email
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: User is verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *      409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Internal Server Error
 */
router.post('/verify', (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  jwt.verify(
    token,
    JWT_SECRET as string,
    async (
      err: jwt.VerifyErrors | null,
      decoded: string | jwt.JwtPayload | undefined
    ) => {
      if (err || !decoded || typeof decoded === 'string') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      const payload = decoded as TokenPayload;
      var result = await auth.verify(payload.email);
      if (result instanceof Error) {
        res.status(409).json({ error: result.message });
        return;
      }
      res.status(200).json({ message: 'Account verified successfully' });
    }
  );
});

export default router;
