import jwt from 'jsonwebtoken';

// Mock JWT before importing the middleware
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Set required environment variables before importing anything that might use them
process.env.JWT_SECRET = 'test-secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'testuser';
process.env.DB_PASSWORD = 'testpass';
process.env.DB_NAME = 'testdb';

import { Request, Response, NextFunction } from 'express';
import tokenMiddleware from '../../src/middleware/token';

// Mock environment variables
const originalEnv = process.env;

describe('Token Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset environment
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'testuser',
      DB_PASSWORD: 'testpass',
      DB_NAME: 'testdb',
    };

    mockReq = {
      header: jest.fn(),
      cookies: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn(),
    };
    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
    mockedJwt.verify.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Bearer Token Authentication', () => {
    it('should call next() with valid Bearer token', () => {
      const token = 'valid.jwt.token';
      const decodedPayload = {
        id: 1,
        email: 'test@example.com',
        is_admin: false,
      };

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      mockedJwt.verify.mockImplementation(() => decodedPayload);

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.header).toHaveBeenCalledWith('Authorization');
      expect(mockedJwt.verify).toHaveBeenCalledWith(token, 'test-secret');
      expect(mockReq.auth).toBe(decodedPayload);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid Bearer token', () => {
      const token = 'invalid.jwt.token';
      const error = new Error('Invalid token');

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      mockReq.cookies = { auth_token: 'cookie-token' };
      mockedJwt.verify.mockImplementation(() => {
        throw error;
      });

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(mockedJwt.verify).toHaveBeenCalledWith(token, 'test-secret');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('auth_token', {
        httpOnly: true,
        secure: false, // NODE_ENV is not 'production'
        path: '/',
        domain: undefined, // DOMAIN not set
      });
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Invalid authentication token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not clear cookie if no cookie exists when Bearer token is invalid', () => {
      const token = 'invalid.jwt.token';

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      mockReq.cookies = {};
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.clearCookie).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Invalid authentication token',
      });
    });
  });

  describe('Cookie Authentication', () => {
    it('should authenticate with valid cookie token', () => {
      const cookieToken = 'valid.cookie.token';
      const decodedPayload = {
        id: 2,
        email: 'cookie@example.com',
        is_admin: true,
      };

      mockReq.header.mockReturnValue(null);
      mockReq.cookies = { auth_token: cookieToken };
      mockedJwt.verify.mockImplementation(() => decodedPayload);

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(mockedJwt.verify).toHaveBeenCalledWith(cookieToken, 'test-secret');
      expect(mockReq.auth).toBe(decodedPayload);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should clear cookie and return 401 for expired cookie token', () => {
      const cookieToken = 'expired.cookie.token';
      const expiredError = new Error('Token expired');
      (expiredError as any).name = 'TokenExpiredError';

      mockReq.header.mockReturnValue(null);
      mockReq.cookies = { auth_token: cookieToken };
      mockedJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Clearing invalid auth_token cookie'
      );
      expect(consoleSpy).toHaveBeenCalledWith('Token expired, cookie cleared');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('auth_token', {
        httpOnly: true,
        secure: false,
        path: '/',
        domain: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Invalid authentication token',
      });
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should clear cookie and return 401 for invalid signature cookie token', () => {
      const cookieToken = 'invalid.cookie.token';
      const signatureError = new Error('Invalid signature');
      (signatureError as any).name = 'JsonWebTokenError';

      mockReq.header.mockReturnValue(null);
      mockReq.cookies = { auth_token: cookieToken };
      mockedJwt.verify.mockImplementation(() => {
        throw signatureError;
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Clearing invalid auth_token cookie'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid token signature, cookie cleared'
      );
      expect(mockRes.clearCookie).toHaveBeenCalledWith('auth_token', {
        httpOnly: true,
        secure: false,
        path: '/',
        domain: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Invalid authentication token',
      });
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should clear cookie and return 401 for other JWT errors in cookie', () => {
      const cookieToken = 'other.error.token';
      const otherError = new Error('Other JWT error');
      (otherError as any).name = 'OtherError';

      mockReq.header.mockReturnValue(null);
      mockReq.cookies = { auth_token: cookieToken };
      mockedJwt.verify.mockImplementation(() => {
        throw otherError;
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Clearing invalid auth_token cookie'
      );
      expect(mockRes.clearCookie).toHaveBeenCalledWith('auth_token', {
        httpOnly: true,
        secure: false,
        path: '/',
        domain: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Invalid authentication token',
      });
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('No Authentication', () => {
    it('should return 401 when no authorization header and no cookie', () => {
      mockReq.header.mockReturnValue(null);
      mockReq.cookies = {};

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is not Bearer and no cookie', () => {
      mockReq.header.mockReturnValue('Basic token123');
      mockReq.cookies = {};

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Environment-specific behavior', () => {
    it('should set secure cookie in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DOMAIN = 'example.com';

      const cookieToken = 'expired.cookie.token';
      const expiredError = new Error('Token expired');
      (expiredError as any).name = 'TokenExpiredError';

      mockReq.header.mockReturnValue(null);
      mockReq.cookies = { auth_token: cookieToken };
      mockedJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('auth_token', {
        httpOnly: true,
        secure: true, // Should be true in production
        path: '/',
        domain: 'example.com', // Should use DOMAIN env var
      });
    });

    it('should handle missing JWT_SECRET gracefully', () => {
      delete process.env.JWT_SECRET;

      mockReq.header.mockReturnValue('Bearer token');
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Secret is missing');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'JWT_SECRET environment variable is not set'
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Internal server error',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors with 500 status', () => {
      mockReq.header.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Authentication error:',
        expect.any(Error)
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Internal server error in token middleware',
      });
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle JWT verify throwing non-Error objects', () => {
      mockReq.header.mockReturnValue('Bearer token');
      mockedJwt.verify.mockImplementation(() => {
        throw 'String error';
      });

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Invalid authentication token',
      });
    });
  });

  describe('Priority: Bearer over Cookie', () => {
    it('should prefer Bearer token over cookie when both are present', () => {
      const bearerToken = 'bearer.token';
      const cookieToken = 'cookie.token';
      const decodedPayload = { id: 1, email: 'test@example.com' };

      mockReq.header.mockReturnValue(`Bearer ${bearerToken}`);
      mockReq.cookies = { auth_token: cookieToken };
      mockedJwt.verify.mockImplementation(() => decodedPayload);

      tokenMiddleware(mockReq, mockRes, mockNext);

      expect(mockedJwt.verify).toHaveBeenCalledWith(bearerToken, 'test-secret');
      expect(mockedJwt.verify).not.toHaveBeenCalledWith(
        cookieToken,
        'test-secret'
      );
      expect(mockReq.auth).toBe(decodedPayload);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
