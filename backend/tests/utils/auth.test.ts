import { jest } from '@jest/globals';

// Mock jwt module
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  decode: jest.fn(),
}));

// Mock the JWT_SECRET import
jest.mock('../../index', () => ({
  JWT_SECRET: 'test-secret-key',
}));

import jwt from 'jsonwebtoken';
import { getCurrentUser } from '../../src/utils/auth';
import type { Request } from 'express';

describe('auth utils', () => {
  let mockRequest: Partial<Request>;
  let mockJwt: jest.Mocked<typeof jwt>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwt = jwt as jest.Mocked<typeof jwt>;

    mockRequest = {
      header: jest.fn().mockReturnValue(undefined) as any,
      cookies: {},
    };
  });

  describe('getCurrentUser', () => {
    it('should return user from Bearer token', async () => {
      const userData = { id: 123, email: 'test@example.com' };
      const token = 'valid-jwt-token';

      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${token}`);
      mockJwt.verify.mockImplementation(() => userData as any);

      const result = await getCurrentUser(mockRequest as Request);

      expect(mockRequest.header).toHaveBeenCalledWith('Authorization');
      expect(mockJwt.verify).toHaveBeenCalledWith(token, 'test-secret-key');
      expect(result).toEqual(userData);
    });

    it('should return null when no Authorization header', async () => {
      (mockRequest.header as jest.Mock).mockReturnValue(undefined);
      mockRequest.cookies = {};

      const result = await getCurrentUser(mockRequest as Request);

      expect(result).toBeNull();
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('should return null when Authorization header does not start with Bearer', async () => {
      (mockRequest.header as jest.Mock).mockReturnValue('Basic some-token');
      mockRequest.cookies = {};

      const result = await getCurrentUser(mockRequest as Request);

      expect(result).toBeNull();
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('should return user from cookie token', async () => {
      const userData = { id: 456, email: 'cookie@example.com' };
      const cookieToken = 'cookie-jwt-token';

      (mockRequest.header as jest.Mock).mockReturnValue(undefined);
      mockRequest.cookies = { auth_token: cookieToken };
      mockJwt.decode.mockReturnValue({} as any);
      mockJwt.verify.mockImplementation(() => userData as any);

      const result = await getCurrentUser(mockRequest as Request);

      expect(mockJwt.decode).toHaveBeenCalledWith(cookieToken, {
        complete: true,
      });
      expect(mockJwt.verify).toHaveBeenCalledWith(
        cookieToken,
        'test-secret-key'
      );
      expect(result).toEqual(userData);
    });

    it('should handle JWT decode error gracefully', async () => {
      const cookieToken = 'invalid-cookie-token';
      const userData = { id: 789, email: 'decoded@example.com' };

      (mockRequest.header as jest.Mock).mockReturnValue(undefined);
      mockRequest.cookies = { auth_token: cookieToken };
      mockJwt.decode.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      mockJwt.verify.mockImplementation(() => userData as any);

      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const result = await getCurrentUser(mockRequest as Request);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to decode token (unverified):',
        expect.any(Error)
      );
      expect(mockJwt.verify).toHaveBeenCalledWith(
        cookieToken,
        'test-secret-key'
      );
      expect(result).toEqual(userData);

      consoleWarnSpy.mockRestore();
    });

    it('should return null when JWT verification fails', async () => {
      const cookieToken = 'invalid-jwt-token';

      (mockRequest.header as jest.Mock).mockReturnValue(undefined);
      mockRequest.cookies = { auth_token: cookieToken };
      mockJwt.decode.mockReturnValue({} as any);

      const verificationError = new Error('Invalid signature');
      (verificationError as any).name = 'JsonWebTokenError';
      mockJwt.verify.mockImplementation(() => {
        throw verificationError;
      });

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const result = await getCurrentUser(mockRequest as Request);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'JWT verification error:',
        'JsonWebTokenError: Invalid signature'
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Token signature invalid - user needs to re-authenticate'
      );
      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should return null when JWT verification fails with other error', async () => {
      const cookieToken = 'expired-jwt-token';

      (mockRequest.header as jest.Mock).mockReturnValue(undefined);
      mockRequest.cookies = { auth_token: cookieToken };
      mockJwt.decode.mockReturnValue({} as any);

      const verificationError = new Error('Token expired');
      (verificationError as any).name = 'TokenExpiredError';
      mockJwt.verify.mockImplementation(() => {
        throw verificationError;
      });

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await getCurrentUser(mockRequest as Request);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'JWT verification error:',
        'TokenExpiredError: Token expired'
      );
      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should return null when no valid authentication method', async () => {
      (mockRequest.header as jest.Mock).mockReturnValue(undefined);
      mockRequest.cookies = {};

      const result = await getCurrentUser(mockRequest as Request);

      expect(result).toBeNull();
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('should return null when Bearer token JWT verification fails', async () => {
      const token = 'invalid-bearer-token';

      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer ${token}`);
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await getCurrentUser(mockRequest as Request);

      expect(result).toBeNull();
    });

    it('should return null when unexpected error occurs', async () => {
      (mockRequest.header as jest.Mock).mockReturnValue(`Bearer valid-token`);
      mockJwt.verify.mockImplementation(() => {
        throw 'string error';
      });

      const result = await getCurrentUser(mockRequest as Request);

      expect(result).toBeNull();
    });
  });
});
