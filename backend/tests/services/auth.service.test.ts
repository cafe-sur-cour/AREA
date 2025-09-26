const mockSave = jest.fn();

jest.mock('../../src/config/db', () => ({
  AppDataSource: {
    manager: {
      save: mockSave
    }
  }
}));
jest.mock('../../src/routes/user/user.service');
jest.mock('../../src/config/entity/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

jest.mock('../../index', () => ({
  JWT_SECRET: 'test-jwt-secret'
}));

import * as authService from '../../src/routes/auth/auth.service';
import { getUserByEmail } from '../../src/routes/user/user.service';
import { AppDataSource } from '../../src/config/db';
import { User } from '../../src/config/entity/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockUser = User as jest.MockedClass<typeof User>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser.mockImplementation(() => ({
      id: undefined,
      name: '',
      email: '',
      password_hash: '',
      email_verified: false,
      is_admin: false,
      created_at: new Date(),
      updated_at: new Date(),
    } as any));
    mockSave.mockClear();
    mockSave.mockResolvedValue(undefined);
  });

  describe('login', () => {
    const mockFoundUser = {
      id: 1,
      email: 'test@test.com',
      name: 'Test User',
      password_hash: 'hashedpassword',
      email_verified: true,
      is_admin: false,
    } as User;

    it('should login successfully with valid credentials', async () => {
      mockGetUserByEmail.mockResolvedValue(mockFoundUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock-jwt-token' as never);

      const result = await authService.login('test@test.com', 'password123');

      expect(result).toBe('mock-jwt-token');
      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@test.com');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          email: 'test@test.com',
          id: 1,
          is_admin: false
        },
        'test-jwt-secret',
        { expiresIn: '1h' }
      );
    });

    it('should return error when user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await authService.login('nonexistent@test.com', 'password123');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('User not found');
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });

    it('should return error when email not verified', async () => {
      const unverifiedUser = { ...mockFoundUser, email_verified: false };
      mockGetUserByEmail.mockResolvedValue(unverifiedUser);

      const result = await authService.login('test@test.com', 'password123');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Email not verified');
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });

    it('should return error when password is incorrect', async () => {
      mockGetUserByEmail.mockResolvedValue(mockFoundUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.login('test@test.com', 'wrongpassword');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Incorrect Password');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register successfully with valid data', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockJwt.sign.mockReturnValue('verification-token' as never);

      const result = await authService.register('newuser@test.com', 'New User', 'password123');

      expect(result).toBe('verification-token');
      expect(mockGetUserByEmail).toHaveBeenCalledWith('newuser@test.com');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          name: 'New User',
          email: 'newuser@test.com'
        },
        'test-jwt-secret',
        { expiresIn: '1h' }
      );
      expect(mockSave).toHaveBeenCalled();
    });

    it('should return error when user already exists', async () => {
      const existingUser = {
        id: 1,
        email: 'existing@test.com',
        name: 'Existing User'
      } as User;
      mockGetUserByEmail.mockResolvedValue(existingUser);

      const result = await authService.register('existing@test.com', 'New User', 'password123');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Account already exists');
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockJwt.sign).not.toHaveBeenCalled();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should create user with correct properties', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockJwt.sign.mockReturnValue('verification-token' as never);

      const mockUserInstance = {
        name: '',
        email: '',
        password_hash: '',
      };
      mockUser.mockImplementation(() => mockUserInstance as any);

      await authService.register('test@test.com', 'Test User', 'password123');

      expect(mockUserInstance.name).toBe('Test User');
      expect(mockUserInstance.email).toBe('test@test.com');
      expect(mockUserInstance.password_hash).toBe('hashedpassword');
    });
  });

  describe('verify', () => {
    it('should verify user email successfully', async () => {
      const unverifiedUser = {
        id: 1,
        email: 'test@test.com',
        email_verified: false,
      } as User;
      mockGetUserByEmail.mockResolvedValue(unverifiedUser);

      const result = await authService.verify('test@test.com');

      expect(result).toBeUndefined();
      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@test.com');
      expect(unverifiedUser.email_verified).toBe(true);
      expect(mockSave).toHaveBeenCalledWith(unverifiedUser);
    });

    it('should return error when user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await authService.verify('nonexistent@test.com');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('User not found');
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should update email_verified to true', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        email_verified: false,
      } as User;
      mockGetUserByEmail.mockResolvedValue(user);

      await authService.verify('test@test.com');

      expect(user.email_verified).toBe(true);
    });
  });

  describe('requestReset', () => {
    it('should generate reset token for existing user', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
      } as User;
      mockGetUserByEmail.mockResolvedValue(user);
      mockJwt.sign.mockReturnValue('reset-token' as never);

      const result = await authService.requestReset('test@test.com');

      expect(result).toBe('reset-token');
      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@test.com');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { email: 'test@test.com' },
        'test-jwt-secret',
        { expiresIn: '1h' }
      );
    });

    it('should return null for non-existing user', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await authService.requestReset('nonexistent@test.com');

      expect(result).toBeNull();
      expect(mockGetUserByEmail).toHaveBeenCalledWith('nonexistent@test.com');
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });

    it('should generate token with correct payload and options', async () => {
      const user = { email: 'test@test.com' } as User;
      mockGetUserByEmail.mockResolvedValue(user);
      mockJwt.sign.mockReturnValue('reset-token' as never);

      await authService.requestReset('test@test.com');

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { email: 'test@test.com' },
        'test-jwt-secret',
        { expiresIn: '1h' }
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with valid token', async () => {
      const decodedToken = { email: 'test@test.com' };
      const user = {
        id: 1,
        email: 'test@test.com',
        password_hash: 'oldpassword',
      } as User;

      mockJwt.verify.mockReturnValue(decodedToken as never);
      mockGetUserByEmail.mockResolvedValue(user);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('newhashed');

      const result = await authService.resetPassword('valid-token', 'newpassword123');

      expect(result).toBe(true);
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-jwt-secret');
      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@test.com');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(user.password_hash).toBe('newhashed');
      expect(mockSave).toHaveBeenCalledWith(user);
    });

    it('should return error when user not found', async () => {
      const decodedToken = { email: 'nonexistent@test.com' };
      mockJwt.verify.mockReturnValue(decodedToken as never);
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await authService.resetPassword('valid-token', 'newpassword123');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('User not found');
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should return error when token is invalid', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.resetPassword('invalid-token', 'newpassword123');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Invalid or expired token');
      expect(mockGetUserByEmail).not.toHaveBeenCalled();
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should return error when token verification throws', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await authService.resetPassword('expired-token', 'newpassword123');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Invalid or expired token');
    });

    it('should hash password with correct salt rounds', async () => {
      const decodedToken = { email: 'test@test.com' };
      const user = { email: 'test@test.com' } as User;

      mockJwt.verify.mockReturnValue(decodedToken as never);
      mockGetUserByEmail.mockResolvedValue(user);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      await authService.resetPassword('valid-token', 'newpassword123');

      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    });
  });

  describe('error handling', () => {
    it('should handle database errors in login', async () => {
      mockGetUserByEmail.mockRejectedValue(new Error('Database error'));

      await expect(authService.login('test@test.com', 'password123')).rejects.toThrow('Database error');
    });

    it('should handle bcrypt errors in register', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      await expect(authService.register('test@test.com', 'Test User', 'password123')).rejects.toThrow('Bcrypt error');
    });

    it('should handle save errors in verify', async () => {
      const user = { email: 'test@test.com', email_verified: false } as User;
      mockGetUserByEmail.mockResolvedValue(user);
      mockSave.mockRejectedValue(new Error('Save error'));

      await expect(authService.verify('test@test.com')).rejects.toThrow('Save error');
    });

    it('should handle JWT sign errors in requestReset', async () => {
      const user = { email: 'test@test.com' } as User;
      mockGetUserByEmail.mockResolvedValue(user);
      mockJwt.sign.mockImplementation(() => {
        throw new Error('JWT error');
      });

      await expect(authService.requestReset('test@test.com')).rejects.toThrow('JWT error');
    });
  });

  describe('edge cases', () => {
    it('should handle empty email in login', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await authService.login('', 'password123');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('User not found');
    });

    it('should handle empty password in register', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockJwt.sign.mockReturnValue('token' as never);

      await authService.register('test@test.com', 'Test User', '');

      expect(mockBcrypt.hash).toHaveBeenCalledWith('', 10);
    });

    it('should handle special characters in email', async () => {
      const user = { email: 'test+tag@test.com' } as User;
      mockGetUserByEmail.mockResolvedValue(user);
      mockJwt.sign.mockReturnValue('reset-token' as never);

      const result = await authService.requestReset('test+tag@test.com');

      expect(result).toBe('reset-token');
      expect(mockGetUserByEmail).toHaveBeenCalledWith('test+tag@test.com');
    });
  });
});
