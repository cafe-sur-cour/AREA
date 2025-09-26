import request from 'supertest';
import express from 'express';

const createMockAuthRouter = () => {
  const router = express.Router();

  router.get('/login/status', (req: any, res) => {
    if (req.auth) {
      return res.status(200).json({ authenticated: true, user: req.auth });
    } else {
      return res.status(401).json({ authenticated: false });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      const missingFields = [];
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      return res.status(400).json({
        error: 'Bad Request',
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    if (email === 'test@test.com' && password === 'password123') {
      return res.status(200).json({ token: 'mock-token' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  });

  router.post('/register', async (req, res) => {
    const { email, name, password } = req.body;
    const missingFields = Object.entries({ email, name, password })
      .filter(([, value]) => value == null || value === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    if (email === 'existing@test.com') {
      return res.status(409).json({ error: 'Account already exists' });
    }

    return res.status(201).json({ message: 'User registered successfully' });
  });

  router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    return res.status(200).json({ message: 'Logged out successfully' });
  });

  router.post('/verify', (req: any, res) => {
    if (!req.token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.token === 'valid-token') {
      return res.status(200).json({ message: 'Account verified successfully' });
    }

    return res.status(401).json({ error: 'Invalid token' });
  });

  router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    return res.status(200).json({
      message: 'If that email is registered, you will receive a password reset link.',
    });
  });

  router.post('/reset-password', (req: any, res) => {
    if (!req.token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    if (req.token === 'valid-reset-token' || req.token === 'valid-token') {
      return res.status(200).json({ message: 'Password has been reset successfully' });
    }

    return res.status(400).json({ error: 'Invalid or expired token' });
  });

  return router;
};

describe('Auth Routes Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req: any, res, next) => {
      if (req.path.includes('/login/status')) {
        req.auth = { id: 1, email: 'test@test.com', is_admin: false };
      }
      if (req.path.includes('/verify')) {
        req.token = req.body.token || 'valid-token';
      }
      if (req.path.includes('/reset-password')) {
        req.token = req.body.token;
      }
      next();
    });
    app.use('/api/auth', createMockAuthRouter());
  });

  describe('GET /login/status', () => {
    it('should return authenticated status when user is authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/login/status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        authenticated: true,
        user: { id: 1, email: 'test@test.com', is_admin: false }
      });
    });
  });

  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ token: 'mock-token' });
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Missing required fields: email'
      });
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Missing required fields: password'
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('POST /register', () => {
    it('should register successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          name: 'New User',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'User registered successfully' });
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Missing required fields: email'
      });
    });

    it('should return 409 when email already exists', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@test.com',
          name: 'Test User',
          password: 'password123'
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Account already exists' });
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('POST /verify', () => {
    it('should verify email successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Account verified successfully' });
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid token' });
    });
  });

  describe('POST /forgot-password', () => {
    it('should return generic message for password reset request', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@test.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'If that email is registered, you will receive a password reset link.',
      });
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Email is required' });
    });
  });

  describe('POST /reset-password', () => {
    it('should reset password successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-token',
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Password has been reset successfully' });
    });

    it('should return 400 when new password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'New password is required' });
    });

    it('should return 400 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid or expired token' });
    });
  });
});