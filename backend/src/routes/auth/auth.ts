import express, { Request, Response } from 'express';
import * as auth from './auth.service';
import process from 'process';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from 'index';
import mail from '../../middleware/mail';
import passport from 'passport';
import token from '../../middleware/token';
import nodemailer from 'nodemailer';
import { githubOAuth } from '../../services/services/github/oauth';
import { createLog } from '../logs/logs.service';

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
 *     summary: Authenticate a user and return a JWT token
 *     tags:
 *       - Auth
 *     description: |
 *       Authenticates a user with email and password credentials.
 *       Returns a JWT token that can be used for accessing protected endpoints.
 *       The token is also set as an HTTP-only cookie for enhanced security.
 *
 *       **Requirements:**
 *       - User must be registered
 *       - Email must be verified
 *       - Credentials must be valid
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
 *                 format: email
 *                 description: User's registered email address
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 minLength: 1
 *                 example: "mySecurePassword123"
 *     responses:
 *       200:
 *         description: Login successful - JWT token returned
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only authentication cookie
 *             schema:
 *               type: string
 *               example: "auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; SameSite=Strict; Max-Age=86400"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication (expires in 1 hour)
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpZCI6MSwiaXNfYWRtaW4iOmZhbHNlLCJpYXQiOjE2OTU2NDg4MDAsImV4cCI6MTY5NTY1MjQwMH0.signature"
 *       400:
 *         description: Bad Request - Missing or invalid input fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: email, password"
 *       401:
 *         description: Unauthorized - Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   enum: ["Unauthorized"]
 *                   example: "Unauthorized"
 *               oneOf:
 *                 - description: "User not found, email not verified, or incorrect password"
 *       500:
 *         description: Internal Server Error - Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
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
        await createLog(
          400,
          'login',
          `Failed login attempt: missing fields - ${missingFields.join(', ')}`
        );
        res.status(400).json({
          error: 'Bad Request',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        });
        return;
      }
      const token = await auth.login(email, password);
      if (token instanceof Error) {
        await createLog(401, 'login', `Unauthorized login attempt: ${email}`);
        res.status(401).json({ error: token.message });
        return;
      }

      res.cookie('auth_token', token, {
        maxAge: 86400000,
        httpOnly: true,
        sameSite: 'strict',
      });
      await createLog(200, 'login', `User logged in: ${email}`);
      return res.status(200).json({ token });
    } catch (err) {
      console.error(err);
      await createLog(401, 'login', `Unauthorized login attempt: ${email}`);
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
 *         content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *               message:
 *                  type: string
 *       400:
 *         description: Missing required fields
 *         content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *               error:
 *                  type: string
 *       409:
 *         description: Email already exists
 *         content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *               error:
 *                  type: string
 *       500:
 *         description: Internal Server Error
 *         content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *               error:
 *                  type: string
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
        await createLog(400, 'register', `Failed registration attempt: missing fields - ${missingFields.join(', ')}`);
        return res.status(400).json({
          error: 'Bad Request',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        });
      }
      const token = await auth.register(email, name, password);
      if (token instanceof Error) {
        await createLog(409, 'register', `Failed registration attempt: ${token.message}`);
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
        from: '"AREA dev Team" <no-reply@yourapp.com>',
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
      await createLog(201, 'register', `New user registered: ${email}`);
      return res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error(err);
      await createLog(500, 'register', `Error during registration: ${err instanceof Error ? err.message : String(err)}`);
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
router.post(
  '/logout',
  token,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) {
        await createLog(
          403,
          'logout',
          `Logout attempt with no authenticated user`
        );
        res
          .status(403)
          .json({ message: 'Logout failed: No authenticated user' });
        return;
      }

      const email = (req.auth as { email: string })?.email;
      res.clearCookie('auth_token');
      await createLog(200, 'logout', `User logged out: ${email || 'unknown'}`);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      await createLog(500, 'logout', `Error during logout: ${errorMessage}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify an user's email
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: User is verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal Server Error
 */
router.post('/verify', mail, (req: Request, res: Response) => {
  if (!req.token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(
    req.token,
    JWT_SECRET as string,
    async (
      err: jwt.VerifyErrors | null,
      decoded: string | jwt.JwtPayload | undefined
    ) => {
      if (err || !decoded || typeof decoded === 'string') {
        await createLog(401, 'register', `Failed verification attempt: invalid or expired token`);
        return res.status(401).json({ error: 'Invalid token' });
      }
      const payload = decoded as TokenPayload;
      var result = await auth.verify(payload.email);
      if (result instanceof Error) {
        await createLog(409, 'register', `Failed verification attempt: ${result.message}`);
        res.status(409).json({ error: result.message });
        return;
      }
      await createLog(200, 'register', `User verified: ${payload.email}`);
      res.status(200).json({ message: 'Account verified successfully' });
    }
  );
});

/**
 * @swagger
 * /api/auth/github/login:
 *   get:
 *     summary: Initiate GitHub OAuth authorization for login/register
 *     tags:
 *       - OAuth
 *     description: |
 *       Redirects user to GitHub for OAuth authorization.
 *       This route is used for login/register when user is not authenticated.
 *     responses:
 *       302:
 *         description: Redirect to GitHub authorization page
 *       500:
 *         description: Internal Server Error
 */
router.get('/github/login', passport.authenticate('github-login'));

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: Handle GitHub OAuth callback for both login/register and service connection
 *     tags:
 *       - OAuth
 *     description: |
 *       Exchanges authorization code for access token and handles authentication.
 *       Automatically determines whether to perform login/register or service connection
 *       based on user authentication status.
 *     parameters:
 *       - name: code
 *         in: query
 *         required: true
 *         description: Authorization code from GitHub
 *         schema:
 *           type: string
 *       - name: state
 *         in: query
 *         required: true
 *         description: State parameter for CSRF protection
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OAuth successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               oneOf:
 *                 - description: Login/Register response
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                 - description: Service connection response
 *                   properties:
 *                     message:
 *                       type: string
 *                     user:
 *                       type: object
 *       400:
 *         description: Bad Request - Missing parameters
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/github/callback',
  async (req: Request, res: Response, next) => {
    try {
      const isAuthenticated = !!(req.auth || req.cookies?.auth_token);

      if (isAuthenticated) {
        passport.authenticate('github-subscribe', { session: false })(
          req,
          res,
          next
        );
      } else {
        passport.authenticate('github-login', { session: false })(
          req,
          res,
          next
        );
      }
    } catch (err) {
      console.error('GitHub OAuth callback error:', err);
      res.status(500).json({ error: 'Failed to authenticate with GitHub' });
    }
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as { token: string };
      if (user && user.token) {
        res.cookie('auth_token', user.token, {
          maxAge: 86400000,
          httpOnly: true,
          sameSite: 'strict',
        });

        const isAuthenticated = !!(req.auth || req.cookies?.auth_token);
        if (isAuthenticated) {
          const appSlug = process.env.GITHUB_APP_SLUG || 'area-app';
          const userId = (req.auth as { id: number })?.id || 'unknown';
          const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${userId}`;
          return res.redirect(installUrl);
        }

        res.redirect(`${process.env.FRONTEND_URL || ''}`);
      } else {
        res.status(500).json({ error: 'Authentication failed' });
      }
    } catch (err) {
      console.error('GitHub OAuth callback error:', err);
      res.status(500).json({ error: 'Failed to authenticate with GitHub' });
    }
  }
);
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
 *     security:
 *       - bearerAuth: []
 *     responses:
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
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userId = (req.auth as { id: number }).id;
      const existingToken = await githubOAuth.getUserToken(userId);

      if (existingToken) {
        const appSlug = process.env.GITHUB_APP_SLUG || '';
        const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${userId}`;
        return res.redirect(installUrl);
      }
    } catch {
      console.log('No existing token found, proceeding with OAuth...');
    }

    passport.authenticate('github-subscribe', { session: false })(
      req,
      res,
      next
    );
  }
);
/**
 * @swagger
 * /api/auth/google/login:
 *   get:
 *     summary: Initiate Google OAuth authorization for login/register
 *     tags:
 *       - OAuth
 *     description: |
 *       Redirects user to Google for OAuth authorization.
 *       This route is used for login/register when user is not authenticated.
 *     responses:
 *       302:
 *         description: Redirect to Google authorization page
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/google/login',
  passport.authenticate('google-login', {
    scope: ['openid', 'email', 'profile'],
    session: false,
  })
);

/**
 * @swagger
 * /api/auth/google/subscribe:
 *   get:
 *     summary: Initiate Google OAuth authorization for service connection
 *     tags:
 *       - OAuth
 *     description: |
 *       Redirects user to Google for OAuth authorization.
 *       This route is used to connect Google account for service access when user is already authenticated.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       302:
 *         description: Redirect to Google authorization page
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Internal Server Error
 */
router.get('/google/subscribe', async (req: Request, res: Response, next) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  passport.authenticate('google-subscribe', {
    scope: ['openid', 'email', 'profile'],
    session: false,
  })(req, res, next);
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback for both login/register and service connection
 *     tags:
 *       - OAuth
 *     description: |
 *       Exchanges authorization code for access token and handles authentication.
 *       Automatically determines whether to perform login/register or service connection
 *       based on user authentication status.
 *     parameters:
 *       - name: code
 *         in: query
 *         required: true
 *         description: Authorization code from Google
 *         schema:
 *           type: string
 *       - name: state
 *         in: query
 *         required: true
 *         description: State parameter for CSRF protection
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OAuth successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               oneOf:
 *                 - description: Login/Register response
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                 - description: Service connection response
 *                   properties:
 *                     message:
 *                       type: string
 *                     user:
 *                       type: object
 *       400:
 *         description: Bad Request - Missing parameters
 *       500:
 *         description: Internal Server Error
 */
router.get(
  '/google/callback',
  async (req: Request, res: Response, next) => {
    try {
      const isAuthenticated = !!(req.auth || req.cookies?.auth_token);

      if (isAuthenticated) {
        passport.authenticate('google-subscribe', { session: false })(
          req,
          res,
          next
        );
      } else {
        passport.authenticate('google-login', { session: false })(
          req,
          res,
          next
        );
      }
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as { token: string };
      if (user && user.token) {
        res.cookie('auth_token', user.token, {
          maxAge: 86400000,
          httpOnly: true,
          sameSite: 'strict',
        });
        res.redirect(`${process.env.FRONTEND_URL || ''}`);
      } else {
        res.status(500).json({ error: 'Authentication failed' });
      }
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
  }
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags:
 *       - Auth
 *     description: |
 *       Initiates the password reset process by sending a reset link to the user's email address.
 *       For security reasons, the endpoint always returns a success message whether the email
 *       exists in the system or not, preventing email enumeration attacks.
 *
 *       **Process:**
 *       1. Validates the provided email address
 *       2. If email exists in database, generates a secure reset token
 *       3. Sends password reset email with reset link
 *       4. Returns success message (always, regardless of email existence)
 *
 *       **Security Features:**
 *       - No information disclosure about email existence
 *       - Secure token generation with expiration
 *       - Rate limiting recommended (implement in middleware)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the user requesting password reset
 *                 example: "user@example.com"
 *                 pattern: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
 *     responses:
 *       200:
 *         description: Password reset request processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Generic success message for security
 *                   example: "If that email is registered, you will receive a password reset link."
 *       400:
 *         description: Bad Request - Missing or invalid email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Email is required"
 *       500:
 *         description: Internal Server Error - Email service or database error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *     examples:
 *       successful_request:
 *         summary: Successful password reset request
 *         value:
 *           email: "john.doe@example.com"
 *       invalid_email_format:
 *         summary: Invalid email format
 *         value:
 *           email: "invalid-email"
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      await createLog(400, 'other', 'Failed password reset request: missing email');
      return res.status(400).json({ error: 'Email is required' });
    }

    const token = await auth.requestReset(email);
    if (!token) {
      await createLog(404, 'other', `Email doesn't exist: ${email}`);
      return res.status(200).json({
        message:
          'If that email is registered, you will receive a password reset link.',
      });
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
      from: '"AREA dev Team" <no-reply@yourapp.com>',
      to: email,
      subject: '🔐 Reset Your Password',
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #648BA0; border-radius: 10px; background-color: #e4e2dd;">
          <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Open+Sans&display=swap');
          </style>
          <h2 style="color: #000000ff; text-align: center; font-family: 'Montserrat', Arial, sans-serif;">🔐 Reset Your Password</h2>
          <p style="font-size: 16px; font-family: 'Open Sans', Arial, sans-serif; color: #000000ff;">
          Hello,
          </p>
          <p style="font-size: 16px; font-family: 'Open Sans', Arial, sans-serif; color: #000000ff;">
          We received a request to reset your password. Click the button below to create a new password.
          </p>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
          <tr>
          <td align="center" bgcolor="#57798B" style="border-radius: 5px;">
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}"
          target="_blank"
          style="font-size: 16px; font-family: 'Open Sans', Arial, sans-serif; color: #FFFFFF; text-decoration: none; padding: 12px 24px; display: inline-block;">
          Reset Password
          </a>
          </td>
          </tr>
          </table>

          <p style="font-size: 14px; font-family: 'Open Sans', Arial, sans-serif, color: #000000ff;">
          If you did not request a password reset, please ignore this email or contact support if you have concerns.
          </p>
          <hr style="margin: 20px 0; border-color: #000000ff;">
          <p style="font-size: 12px; font-family: 'Open Sans', Arial, sans-serif; color: #000000ff; text-align: center;">
          © ${new Date().getFullYear()} Café sur Cour - AREA - All rights reserved
          </p>
          </div>
          `,
    };

    await transporter.sendMail(mailOptions);
    await createLog(201, 'other', `Password reset email sent to: ${email}`);
    return res.status(201).json({
      message:
        'If that email is registered, you will receive a password reset link.',
    });
  } catch (error) {
    console.error(error);
    await createLog(500, 'other', `Error during password reset: ${error instanceof Error ? error.message : String(error)}`);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password with a valid reset token
 *     tags:
 *       - Auth
 *     description: |
 *       Completes the password reset process by setting a new password for the user.
 *       This endpoint requires a valid reset token that was sent to the user's email
 *       via the forgot-password endpoint.
 *
 *       **Process:**
 *       1. Validates the reset token from Authorization header
 *       2. Verifies the token hasn't expired
 *       3. Updates the user's password with the new one
 *       4. Invalidates the reset token
 *
 *       **Security Features:**
 *       - Token-based authentication (single-use)
 *       - Password hashing before storage
 *       - Token expiration validation
 *       - Secure token transmission via headers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password for the user account
 *                 minLength: 8
 *                 example: "NewSecurePassword123!"
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
 *     responses:
 *       200:
 *         description: Password reset completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success confirmation message
 *                   example: "Password has been reset successfully"
 *       400:
 *         description: Bad Request - Missing token or password, or invalid/expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   enum:
 *                     - "Token is required"
 *                     - "New password is required"
 *                     - "Invalid or expired token"
 *                   examples:
 *                     missing_token:
 *                       value: "Token is required"
 *                     missing_password:
 *                       value: "New password is required"
 *                     invalid_token:
 *                       value: "Invalid or expired token"
 *       401:
 *         description: Unauthorized - Invalid or missing Authorization header
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal Server Error - Database or system error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *     examples:
 *       successful_reset:
 *         summary: Successful password reset
 *         value:
 *           newPassword: "MyNewSecurePassword123!"
 *       weak_password:
 *         summary: Weak password example
 *         value:
 *           newPassword: "123"
 */
router.post('/reset-password', mail, async (req: Request, res: Response) => {
  if (!req.token) {
    await createLog(400, 'other', 'Token is required to reset password');
    return res.status(400).json({ error: 'Token is required' });
  }

  jwt.verify(
    req.token,
    JWT_SECRET as string,
    async (
      err: jwt.VerifyErrors | null,
      decoded: string | jwt.JwtPayload | undefined
    ) => {
      if (err || !decoded || typeof decoded === 'string') {
        await createLog(400, 'other', 'Invalid or expired token used for password reset');
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      const { newPassword } = req.body;
      if (!newPassword) {
        await createLog(400, 'other', 'New password is required for password reset');
        return res.status(400).json({ error: 'New password is required' });
      }

      const result = await auth.resetPassword(
        decoded.email as string,
        newPassword
      );
      if (!result) {
        await createLog(400, 'other', 'Failed password reset: invalid or expired token');
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      await createLog(200, 'other', `Password reset successfully for: ${decoded.email}`);
      return res
        .status(200)
        .json({ message: 'Password has been reset successfully' });
    }
  );
});

export default router;
