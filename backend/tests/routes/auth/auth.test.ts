import request from 'supertest';
import express, { Application, Router } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Mock modules BEFORE importing them
jest.mock('../../../src/routes/auth/auth.service');
jest.mock('../../../src/routes/logs/logs.service');
jest.mock('nodemailer');
jest.mock('../../../src/middleware/token');
jest.mock('../../../src/middleware/mail');
jest.mock('../../../src/routes/services/subscription');
jest.mock('../../../src/routes/auth/oauth.router', () => ({
  createOAuthRouter: () => express.Router(),
}));
jest.mock('index', () => ({
  JWT_SECRET: 'test-secret-key',
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-token'),
  verify: jest.fn(),
}));

// Import after mocking
import * as authService from '../../../src/routes/auth/auth.service';
import { createLog } from '../../../src/routes/logs/logs.service';
import tokenMiddleware from '../../../src/middleware/token';
import mailMiddleware from '../../../src/middleware/mail';

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockCreateLog = createLog as jest.MockedFunction<typeof createLog>;
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;
const mockTokenMiddleware = tokenMiddleware as jest.MockedFunction<
  typeof tokenMiddleware
>;
const mockMailMiddleware = mailMiddleware as jest.MockedFunction<
  typeof mailMiddleware
>;
const mockJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

describe('Auth Routes', () => {
  let app: Application;
  let mockTransporter: any;

  beforeAll(() => {
    // Mock nodemailer transporter
    mockTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };
    mockNodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default middleware behavior
    mockTokenMiddleware.mockImplementation((req: any, res: any, next: any) => {
      req.auth = { email: 'test@example.com', id: 1, is_admin: false };
      next();
    });

    mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
      req.token = 'mock_token';
      next();
    });

    // Create Express app
    app = express();
    app.use(express.json());

    // Import and use the auth router
    const authRouter = require('../../../src/routes/auth/auth').default;
    app.use('/api/auth', authRouter);

    mockCreateLog.mockResolvedValue({} as any);
  });
  describe('GET /api/auth/login/status', () => {
    it('should return authenticated status when user is authenticated', async () => {
      mockTokenMiddleware.mockImplementation(
        (req: any, res: any, next: any) => {
          req.auth = { email: 'test@example.com', id: 1, is_admin: false };
          next();
        }
      );

      const response = await request(app).get('/api/auth/login/status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        authenticated: true,
        user: { email: 'test@example.com', id: 1, is_admin: false },
      });
    });

    it('should return unauthenticated status when user is not authenticated', async () => {
      mockTokenMiddleware.mockImplementation(
        (req: any, res: any, next: any) => {
          req.auth = null;
          next();
        }
      );

      const response = await request(app).get('/api/auth/login/status');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ authenticated: false });
    });

    it('should handle errors in login status check', async () => {
      mockTokenMiddleware.mockImplementation(
        (req: any, res: any, next: any) => {
          throw new Error('Token verification failed');
        }
      );

      const response = await request(app).get('/api/auth/login/status');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      mockAuthService.login.mockResolvedValue('valid-jwt-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ token: 'valid-jwt-token' });
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(mockCreateLog).toHaveBeenCalledWith(
        200,
        'login',
        'User logged in: test@example.com'
      );
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('email');
      expect(mockCreateLog).toHaveBeenCalledWith(
        400,
        'login',
        expect.stringContaining('missing fields')
      );
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('password');
    });

    it('should return 400 when both email and password are missing', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email');
      expect(response.body.message).toContain('password');
    });

    it('should return 401 when login fails', async () => {
      mockAuthService.login.mockResolvedValue(new Error('Invalid credentials'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
      expect(mockCreateLog).toHaveBeenCalledWith(
        401,
        'login',
        'Unauthorized login attempt: test@example.com'
      );
    });

    it('should handle unexpected errors during login', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/auth/register', () => {
    beforeEach(() => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
    });

    it('should register successfully with valid data', async () => {
      mockAuthService.register.mockResolvedValue('verification-token');

      const response = await request(app).post('/api/auth/register').send({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(mockAuthService.register).toHaveBeenCalledWith(
        'newuser@example.com',
        'New User',
        'password123'
      );
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(mockCreateLog).toHaveBeenCalledWith(
        201,
        'register',
        'New user registered: newuser@example.com'
      );
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('email');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name');
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', name: 'New User' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('password');
    });

    it('should return 400 when all fields are missing', async () => {
      const response = await request(app).post('/api/auth/register').send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email');
      expect(response.body.message).toContain('name');
      expect(response.body.message).toContain('password');
    });

    it('should return 400 when body is empty or null', async () => {
      const response = await request(app).post('/api/auth/register');

      expect(response.status).toBe(400);
    });

    it('should return 409 when email already exists', async () => {
      mockAuthService.register.mockResolvedValue(
        new Error('Email already exists')
      );

      const response = await request(app).post('/api/auth/register').send({
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already exists');
      expect(mockCreateLog).toHaveBeenCalledWith(
        409,
        'register',
        'Failed registration attempt: Email already exists'
      );
    });

    it('should handle unexpected errors during registration', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal Server Error in Register');
      expect(mockCreateLog).toHaveBeenCalledWith(
        500,
        'register',
        expect.stringContaining('Error during registration')
      );
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      mockTokenMiddleware.mockImplementation(
        (req: any, res: any, next: any) => {
          req.auth = { email: 'test@example.com', id: 1 };
          next();
        }
      );

      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
      expect(mockCreateLog).toHaveBeenCalledWith(
        200,
        'logout',
        'User logged out: test@example.com'
      );
    });

    it('should logout when user email is not available', async () => {
      mockTokenMiddleware.mockImplementation(
        (req: any, res: any, next: any) => {
          req.auth = null;
          next();
        }
      );

      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(mockCreateLog).toHaveBeenCalledWith(
        200,
        'logout',
        'User logged out: unknown'
      );
    });

    it('should handle errors during logout', async () => {
      mockTokenMiddleware.mockImplementation(
        (req: any, res: any, next: any) => {
          throw new Error('Token error');
        }
      );

      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should verify email successfully with valid token', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = 'valid-token';
        next();
      });

      mockJwtVerify.mockImplementation((token, secret, callback: any) => {
        callback(null, { email: 'test@example.com' });
      });

      mockAuthService.verify.mockResolvedValue(undefined);

      const response = await request(app).post('/api/auth/verify');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Account verified successfully');
      expect(mockCreateLog).toHaveBeenCalledWith(
        200,
        'register',
        'User verified: test@example.com'
      );
    });

    it('should return 401 when token is missing', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = null;
        next();
      });

      const response = await request(app).post('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 401 when token is invalid', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = 'invalid-token';
        next();
      });

      mockJwtVerify.mockImplementation((token, secret, callback: any) => {
        callback(new Error('Invalid token'), null);
      });

      const response = await request(app).post('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should return 401 when decoded token is a string', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = 'valid-token';
        next();
      });

      mockJwtVerify.mockImplementation((token, secret, callback: any) => {
        callback(null, 'string-token');
      });

      const response = await request(app).post('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should return 409 when verification fails', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = 'valid-token';
        next();
      });

      mockJwtVerify.mockImplementation((token, secret, callback: any) => {
        callback(null, { email: 'test@example.com' });
      });

      mockAuthService.verify.mockResolvedValue(new Error('Already verified'));

      const response = await request(app).post('/api/auth/verify');

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Already verified');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(() => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
    });

    it('should send password reset email successfully', async () => {
      mockAuthService.requestReset.mockResolvedValue('reset-token');

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('password reset link');
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(mockCreateLog).toHaveBeenCalledWith(
        201,
        'other',
        'Password reset email sent to: test@example.com'
      );
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email is required');
      expect(mockCreateLog).toHaveBeenCalledWith(
        400,
        'other',
        'Failed password reset request: missing email'
      );
    });

    it('should return success message even when email does not exist', async () => {
      mockAuthService.requestReset.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('password reset link');
      expect(mockCreateLog).toHaveBeenCalledWith(
        404,
        'other',
        "Email doesn't exist: nonexistent@example.com"
      );
    });

    it('should handle unexpected errors', async () => {
      mockAuthService.requestReset.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(
        'Internal Server Error in forgot password'
      );
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password successfully with valid token', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = 'valid-reset-token';
        next();
      });

      mockJwtVerify.mockImplementation((token, secret, callback: any) => {
        callback(null, { email: 'test@example.com' });
      });

      mockAuthService.resetPassword.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'newPassword123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        'Password has been reset successfully'
      );
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        'test@example.com',
        'newPassword123'
      );
      expect(mockCreateLog).toHaveBeenCalledWith(
        200,
        'other',
        'Password reset successfully for: test@example.com'
      );
    });

    it('should return 400 when token is missing', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = null;
        next();
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'newPassword123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token is required');
    });

    it('should return 400 when token is invalid', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = 'invalid-token';
        next();
      });

      mockJwtVerify.mockImplementation((token, secret, callback: any) => {
        callback(new Error('Invalid token'), null);
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'newPassword123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should return 400 when decoded is a string', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = 'valid-token';
        next();
      });

      mockJwtVerify.mockImplementation((token, secret, callback: any) => {
        callback(null, 'string-decoded');
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'newPassword123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should return 400 when newPassword is missing', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = 'valid-token';
        next();
      });

      mockJwtVerify.mockImplementation((token, secret, callback: any) => {
        callback(null, { email: 'test@example.com' });
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('New password is required');
    });

    it('should return 400 when reset password fails', async () => {
      mockMailMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.token = 'valid-token';
        next();
      });

      mockJwtVerify.mockImplementation((token, secret, callback: any) => {
        callback(null, { email: 'test@example.com' });
      });

      // Return a falsy value to trigger the error condition
      mockAuthService.resetPassword.mockResolvedValue(null as any);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'newPassword123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('OAuth Routes Initialization', () => {
    it('should initialize OAuth routes', () => {
      const {
        initializeOAuthRoutes,
      } = require('../../../src/routes/auth/auth');

      // Call it once
      initializeOAuthRoutes();

      // Calling again should not re-initialize
      initializeOAuthRoutes();

      // Just verify it doesn't throw errors
      expect(true).toBe(true);
    });
  });
});
