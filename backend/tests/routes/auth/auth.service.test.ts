import * as authService from '../../../src/routes/auth/auth.service';
import {
  getUserByEmail,
  getUserByID,
  createUser,
  updateUserEmailVerified,
  updateUserLastLogin,
  updateUserPassword,
} from '../../../src/routes/user/user.service';
import {
  getOAuthProviderByUserIdAndProvider,
  getOAuthProviderByProviderAndId,
  createOAuthProvider,
  updateOAuthProviderLastUsed,
  updateOAuthProvider,
} from '../../../src/routes/auth/oauth.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../../src/config/entity/User';

// Mock all dependencies
jest.mock('../../../src/routes/user/user.service');
jest.mock('../../../src/routes/auth/oauth.service');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../index', () => ({
  JWT_SECRET: 'test-secret',
  encryption: {
    decryptFromString: jest.fn(),
  },
}));

const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<
  typeof getUserByEmail
>;
const mockGetUserByID = getUserByID as jest.MockedFunction<typeof getUserByID>;
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockUpdateUserEmailVerified =
  updateUserEmailVerified as jest.MockedFunction<
    typeof updateUserEmailVerified
  >;
const mockUpdateUserLastLogin = updateUserLastLogin as jest.MockedFunction<
  typeof updateUserLastLogin
>;
const mockUpdateUserPassword = updateUserPassword as jest.MockedFunction<
  typeof updateUserPassword
>;
const mockGetOAuthProviderByUserIdAndProvider =
  getOAuthProviderByUserIdAndProvider as jest.MockedFunction<
    typeof getOAuthProviderByUserIdAndProvider
  >;
const mockGetOAuthProviderByProviderAndId =
  getOAuthProviderByProviderAndId as jest.MockedFunction<
    typeof getOAuthProviderByProviderAndId
  >;
const mockCreateOAuthProvider = createOAuthProvider as jest.MockedFunction<
  typeof createOAuthProvider
>;
const mockUpdateOAuthProviderLastUsed =
  updateOAuthProviderLastUsed as jest.MockedFunction<
    typeof updateOAuthProviderLastUsed
  >;
const mockUpdateOAuthProvider = updateOAuthProvider as jest.MockedFunction<
  typeof updateOAuthProvider
>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashed_password',
      email_verified: true,
      is_admin: false,
    };

    it('should return JWT token for valid credentials', async () => {
      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('jwt_token' as any);

      const result = await authService.login('test@example.com', 'password');

      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'password',
        'hashed_password'
      );
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { email: 'test@example.com', id: 1, is_admin: false },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe('jwt_token');
    });

    it('should return Error for non-existent user', async () => {
      mockGetUserByEmail.mockResolvedValue(null);

      const result = await authService.login(
        'nonexistent@example.com',
        'password'
      );

      expect(mockGetUserByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com'
      );
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('User not found');
    });

    it('should return Error for unverified email', async () => {
      const unverifiedUser = { ...mockUser, email_verified: false };
      mockGetUserByEmail.mockResolvedValue(unverifiedUser as User);

      const result = await authService.login('test@example.com', 'password');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Email not verified');
    });

    it('should return Error for incorrect password', async () => {
      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.login(
        'test@example.com',
        'wrong_password'
      );

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'wrong_password',
        'hashed_password'
      );
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Incorrect Password');
    });

    it('should handle bcrypt errors', async () => {
      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      (mockBcrypt.compare as jest.Mock).mockRejectedValue(
        new Error('Bcrypt error')
      );

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Bcrypt error');
    });
  });

  describe('register', () => {
    const mockNewUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      password_hash: 'hashed_password',
    };

    it('should return JWT token for successful registration', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(
        'hashed_password' as any
      );
      mockCreateUser.mockResolvedValue(mockNewUser as User);
      (mockJwt.sign as jest.Mock).mockReturnValue('jwt_token' as any);

      const result = await authService.register(
        'test@example.com',
        'Test User',
        'password'
      );

      expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(
        'hashed_password' as any
      );
      expect(mockCreateUser).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password_hash: 'hashed_password',
      });
      (mockJwt.sign as jest.Mock).mockReturnValue('jwt_token' as any);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { name: 'Test User', email: 'test@example.com' },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe('jwt_token');
    });

    it('should return Error for existing user', async () => {
      mockGetUserByEmail.mockResolvedValue(mockNewUser as User);

      const result = await authService.register(
        'existing@example.com',
        'Test User',
        'password'
      );

      expect(mockGetUserByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Account already exists');
    });

    it('should handle bcrypt hash errors', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash error'));

      await expect(
        authService.register('test@example.com', 'Test User', 'password')
      ).rejects.toThrow('Hash error');
    });

    it('should handle user creation errors', async () => {
      mockGetUserByEmail.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(
        'hashed_password' as any
      );
      mockCreateUser.mockRejectedValue(new Error('Database error'));

      await expect(
        authService.register('test@example.com', 'Test User', 'password')
      ).rejects.toThrow('Database error');
    });
  });

  describe('verify', () => {
    it('should verify user email successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      mockUpdateUserEmailVerified.mockResolvedValue(true);

      const result = await authService.verify('encrypted_email');

      expect(encryption.decryptFromString).toHaveBeenCalledWith(
        'encrypted_email'
      );
      expect(mockGetUserByEmail).toHaveBeenCalledWith('decrypted@example.com');
      expect(mockUpdateUserEmailVerified).toHaveBeenCalledWith(1, true);
      expect(result).toBeUndefined();
    });

    it('should return Error for non-existent user', async () => {
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(null);

      const result = await authService.verify('encrypted_email');

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('User not found');
    });

    it('should handle decryption errors', async () => {
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(authService.verify('encrypted_email')).rejects.toThrow(
        'Decryption failed'
      );
    });

    it('should handle update errors', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      mockUpdateUserEmailVerified.mockRejectedValue(new Error('Update failed'));

      await expect(authService.verify('encrypted_email')).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('requestReset', () => {
    const mockUser = { id: 1, email: 'test@example.com' };

    it('should return JWT token for existing user', async () => {
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      (mockJwt.sign as jest.Mock).mockReturnValue('reset_token' as any);

      const result = await authService.requestReset('encrypted_email');

      expect(encryption.decryptFromString).toHaveBeenCalledWith(
        'encrypted_email'
      );
      expect(mockGetUserByEmail).toHaveBeenCalledWith('decrypted@example.com');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe('reset_token');
    });

    it('should return null for non-existent user', async () => {
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(null);

      const result = await authService.requestReset('encrypted_email');

      expect(result).toBeNull();
    });

    it('should handle JWT sign errors', async () => {
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      (mockJwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error('JWT sign failed');
      });

      await expect(authService.requestReset('encrypted_email')).rejects.toThrow(
        'JWT sign failed'
      );
    });
  });

  describe('resetPassword', () => {
    const mockUser = { id: 1, email: 'test@example.com' };

    it('should reset password successfully', async () => {
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(
        'new_hashed_password' as any
      );
      mockUpdateUserPassword.mockResolvedValue(true);

      const result = await authService.resetPassword(
        'encrypted_email',
        'new_password'
      );

      expect(encryption.decryptFromString).toHaveBeenCalledWith(
        'encrypted_email'
      );
      expect(mockGetUserByEmail).toHaveBeenCalledWith('decrypted@example.com');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('new_password', 10);
      expect(mockUpdateUserPassword).toHaveBeenCalledWith(
        1,
        'new_hashed_password'
      );
      expect(result).toBe(true);
    });

    it('should return Error for non-existent user', async () => {
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(null);

      const result = await authService.resetPassword(
        'encrypted_email',
        'new_password'
      );

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('User not found');
    });

    it('should return Error for failed password update', async () => {
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(
        'new_hashed_password' as any
      );
      mockUpdateUserPassword.mockResolvedValue(false);

      const result = await authService.resetPassword(
        'encrypted_email',
        'new_password'
      );

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Failed to update password');
    });

    it('should handle bcrypt hash errors', async () => {
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      (mockBcrypt.hash as jest.Mock).mockRejectedValue(
        new Error('Hash failed')
      );

      const result = await authService.resetPassword(
        'encrypted_email',
        'new_password'
      );

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Invalid or expired token');
    });

    it('should handle update password errors', async () => {
      const { encryption } = require('../../../index');
      encryption.decryptFromString.mockReturnValue('decrypted@example.com');

      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(
        'new_hashed_password' as any
      );
      mockUpdateUserPassword.mockRejectedValue(new Error('Update failed'));

      const result = await authService.resetPassword(
        'encrypted_email',
        'new_password'
      );

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Invalid or expired token');
    });
  });

  describe('connectOAuthProvider', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      is_admin: false,
    };

    const mockOAuthProvider = {
      id: 1,
      user_id: 1,
      provider: 'google',
      provider_id: 'google_id',
    };

    it('should connect existing OAuth provider successfully', async () => {
      mockGetOAuthProviderByUserIdAndProvider.mockResolvedValue(
        mockOAuthProvider as any
      );
      mockUpdateOAuthProvider.mockResolvedValue(true);
      mockGetUserByID.mockResolvedValue(mockUser as User);
      mockUpdateUserLastLogin.mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('jwt_token' as any);

      const result = await authService.connectOAuthProvider(
        1,
        'google',
        'google_id',
        'test@example.com',
        'Test User'
      );

      expect(mockGetOAuthProviderByUserIdAndProvider).toHaveBeenCalledWith(
        1,
        'google'
      );
      expect(mockUpdateOAuthProvider).toHaveBeenCalledWith(1, {
        provider_id: 'google_id',
        provider_email: 'test@example.com',
        provider_username: 'Test User',
        last_used_at: expect.any(Date),
      });
      expect(mockGetUserByID).toHaveBeenCalledWith(1);
      expect(mockUpdateUserLastLogin).toHaveBeenCalledWith(1);
      expect(result).toBe('jwt_token');
    });

    it('should create new OAuth provider successfully', async () => {
      mockGetOAuthProviderByUserIdAndProvider.mockResolvedValue(null);
      mockCreateOAuthProvider.mockResolvedValue(mockOAuthProvider as any);
      mockGetUserByID.mockResolvedValue(mockUser as User);
      mockUpdateUserLastLogin.mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('jwt_token' as any);

      const result = await authService.connectOAuthProvider(
        1,
        'google',
        'google_id',
        'test@example.com',
        'Test User'
      );

      expect(mockGetOAuthProviderByUserIdAndProvider).toHaveBeenCalledWith(
        1,
        'google'
      );
      expect(mockCreateOAuthProvider).toHaveBeenCalledWith({
        user_id: 1,
        provider: 'google',
        connection_type: 'service',
        provider_id: 'google_id',
        provider_email: 'test@example.com',
        provider_username: 'Test User',
      });
      expect(result).toBe('jwt_token');
    });

    it('should return Error for non-existent user', async () => {
      mockGetOAuthProviderByUserIdAndProvider.mockResolvedValue(null);
      mockCreateOAuthProvider.mockResolvedValue(mockOAuthProvider as any);
      mockGetUserByID.mockResolvedValue(null);

      const result = await authService.connectOAuthProvider(
        1,
        'google',
        'google_id',
        'test@example.com',
        'Test User'
      );

      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('User not found');
    });

    it('should handle OAuth provider query errors', async () => {
      mockGetOAuthProviderByUserIdAndProvider.mockRejectedValue(
        new Error('Query failed')
      );

      await expect(
        authService.connectOAuthProvider(
          1,
          'google',
          'google_id',
          'test@example.com',
          'Test User'
        )
      ).rejects.toThrow('Query failed');
    });

    it('should handle OAuth provider creation errors', async () => {
      mockGetOAuthProviderByUserIdAndProvider.mockResolvedValue(null);
      mockCreateOAuthProvider.mockRejectedValue(new Error('Creation failed'));

      await expect(
        authService.connectOAuthProvider(
          1,
          'google',
          'google_id',
          'test@example.com',
          'Test User'
        )
      ).rejects.toThrow('Creation failed');
    });

    it('should handle user lookup errors', async () => {
      mockGetOAuthProviderByUserIdAndProvider.mockResolvedValue(null);
      mockCreateOAuthProvider.mockResolvedValue(mockOAuthProvider as any);
      mockGetUserByID.mockRejectedValue(new Error('User lookup failed'));

      await expect(
        authService.connectOAuthProvider(
          1,
          'google',
          'google_id',
          'test@example.com',
          'Test User'
        )
      ).rejects.toThrow('User lookup failed');
    });
  });

  describe('oauthLogin', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      is_admin: false,
    };

    const mockOAuthProvider = {
      id: 1,
      user_id: 1,
      provider: 'google',
      provider_id: 'google_id',
      user: mockUser,
    };

    it('should login with existing OAuth provider', async () => {
      mockGetOAuthProviderByProviderAndId.mockResolvedValue(
        mockOAuthProvider as any
      );
      mockUpdateUserLastLogin.mockResolvedValue(true);
      mockUpdateOAuthProviderLastUsed.mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('jwt_token' as any);

      const result = await authService.oauthLogin(
        'google',
        'google_id',
        'test@example.com',
        'Test User'
      );

      expect(mockGetOAuthProviderByProviderAndId).toHaveBeenCalledWith(
        'google',
        'google_id'
      );
      expect(mockUpdateUserLastLogin).toHaveBeenCalledWith(1);
      expect(mockUpdateOAuthProviderLastUsed).toHaveBeenCalledWith(1);
      expect(result).toBe('jwt_token');
    });

    it('should create new user and OAuth provider for new email', async () => {
      mockGetOAuthProviderByProviderAndId.mockResolvedValue(null);
      mockGetUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(mockUser as User);
      mockCreateOAuthProvider.mockResolvedValue(mockOAuthProvider as any);
      mockUpdateUserLastLogin.mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('jwt_token' as any);

      const result = await authService.oauthLogin(
        'google',
        'google_id',
        'new@example.com',
        'New User'
      );

      expect(mockGetOAuthProviderByProviderAndId).toHaveBeenCalledWith(
        'google',
        'google_id'
      );
      expect(mockGetUserByEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockCreateUser).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password_hash: '',
        email_verified: true,
        is_active: true,
      });
      expect(result).toBe('jwt_token');
    });

    it('should link OAuth provider to existing user', async () => {
      mockGetOAuthProviderByProviderAndId.mockResolvedValue(null);
      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      mockCreateOAuthProvider.mockResolvedValue(mockOAuthProvider as any);
      mockUpdateUserEmailVerified.mockResolvedValue(true);
      mockUpdateUserLastLogin.mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('jwt_token' as any);

      const result = await authService.oauthLogin(
        'google',
        'google_id',
        'existing@example.com',
        'Existing User'
      );

      expect(mockGetOAuthProviderByProviderAndId).toHaveBeenCalledWith(
        'google',
        'google_id'
      );
      expect(mockGetUserByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(mockCreateOAuthProvider).toHaveBeenCalledWith({
        user_id: 1,
        provider: 'google',
        connection_type: 'auth',
        provider_id: 'google_id',
        provider_email: 'existing@example.com',
        provider_username: 'Existing User',
      });
      expect(mockUpdateUserEmailVerified).toHaveBeenCalledWith(1, true);
      expect(result).toBe('jwt_token');
    });

    it('should create user with OAuth email when no provider email', async () => {
      mockGetOAuthProviderByProviderAndId.mockResolvedValue(null);
      mockGetUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(mockUser as User);
      mockCreateOAuthProvider.mockResolvedValue(mockOAuthProvider as any);
      mockUpdateUserLastLogin.mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('jwt_token' as any);

      const result = await authService.oauthLogin(
        'google',
        'google_id',
        '',
        'Test User'
      );

      expect(mockCreateUser).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'google_id@google.oauth',
        password_hash: '',
        email_verified: true,
        is_active: true,
      });
      expect(result).toBe('jwt_token');
    });

    it('should handle OAuth provider query errors', async () => {
      mockGetOAuthProviderByProviderAndId.mockRejectedValue(
        new Error('Query failed')
      );

      await expect(
        authService.oauthLogin(
          'google',
          'google_id',
          'test@example.com',
          'Test User'
        )
      ).rejects.toThrow('Query failed');
    });

    it('should handle user creation errors', async () => {
      mockGetOAuthProviderByProviderAndId.mockResolvedValue(null);
      mockGetUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockRejectedValue(new Error('User creation failed'));

      await expect(
        authService.oauthLogin(
          'google',
          'google_id',
          'test@example.com',
          'Test User'
        )
      ).rejects.toThrow('User creation failed');
    });

    it('should handle OAuth provider creation errors', async () => {
      mockGetOAuthProviderByProviderAndId.mockResolvedValue(null);
      mockGetUserByEmail.mockResolvedValue(mockUser as User);
      mockCreateOAuthProvider.mockRejectedValue(
        new Error('OAuth creation failed')
      );

      await expect(
        authService.oauthLogin(
          'google',
          'google_id',
          'test@example.com',
          'Test User'
        )
      ).rejects.toThrow('OAuth creation failed');
    });
  });
});
