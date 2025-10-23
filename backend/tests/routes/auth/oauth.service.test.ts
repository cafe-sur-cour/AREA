import {
  getOAuthProviderByUserIdAndProvider,
  getOAuthProviderByProviderAndId,
  createOAuthProvider,
  updateOAuthProviderLastUsed,
  updateOAuthProvider,
} from '../../../src/routes/auth/oauth.service';
import { AppDataSource } from '../../../src/config/db';
import { UserOAuthProvider } from '../../../src/config/entity/UserOAuthProvider';

// Mock AppDataSource
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    manager: {
      findOneBy: jest.fn(),
    },
    getRepository: jest.fn(),
  },
}));

describe('OAuth Service', () => {
  let mockRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock repository
    mockRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
  });

  describe('getOAuthProviderByUserIdAndProvider', () => {
    it('should return OAuth provider when found', async () => {
      const mockProvider = {
        id: 1,
        user_id: 123,
        provider: 'github',
        provider_id: 'github123',
        provider_email: 'user@github.com',
        connection_type: 'auth' as const,
      };

      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(
        mockProvider
      );

      const result = await getOAuthProviderByUserIdAndProvider(123, 'github');

      expect(result).toEqual(mockProvider);
      expect(AppDataSource.manager.findOneBy).toHaveBeenCalledWith(
        UserOAuthProvider,
        {
          user_id: 123,
          provider: 'github',
        }
      );
    });

    it('should return null when OAuth provider not found', async () => {
      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await getOAuthProviderByUserIdAndProvider(
        999,
        'nonexistent'
      );

      expect(result).toBeNull();
      expect(AppDataSource.manager.findOneBy).toHaveBeenCalledWith(
        UserOAuthProvider,
        {
          user_id: 999,
          provider: 'nonexistent',
        }
      );
    });

    it('should handle errors when querying database', async () => {
      const dbError = new Error('Database connection error');
      (AppDataSource.manager.findOneBy as jest.Mock).mockRejectedValue(dbError);

      await expect(
        getOAuthProviderByUserIdAndProvider(123, 'github')
      ).rejects.toThrow('Database connection error');
    });
  });

  describe('getOAuthProviderByProviderAndId', () => {
    it('should return OAuth provider with user relation when found', async () => {
      const mockProvider = {
        id: 1,
        user_id: 123,
        provider: 'github',
        provider_id: 'github123',
        provider_email: 'user@github.com',
        connection_type: 'auth' as const,
        user: {
          id: 123,
          email: 'user@example.com',
          name: 'Test User',
        },
      };

      mockRepository.findOne.mockResolvedValue(mockProvider);

      const result = await getOAuthProviderByProviderAndId(
        'github',
        'github123'
      );

      expect(result).toEqual(mockProvider);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          provider: 'github',
          provider_id: 'github123',
        },
        relations: ['user'],
      });
    });

    it('should return null when OAuth provider not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await getOAuthProviderByProviderAndId(
        'github',
        'nonexistent'
      );

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          provider: 'github',
          provider_id: 'nonexistent',
        },
        relations: ['user'],
      });
    });

    it('should handle errors when querying database', async () => {
      const dbError = new Error('Database query failed');
      mockRepository.findOne.mockRejectedValue(dbError);

      await expect(
        getOAuthProviderByProviderAndId('github', 'github123')
      ).rejects.toThrow('Database query failed');
    });
  });

  describe('createOAuthProvider', () => {
    it('should create and save OAuth provider with auth connection type', async () => {
      const oauthData = {
        user_id: 123,
        provider: 'github',
        connection_type: 'auth' as const,
        provider_id: 'github123',
        provider_email: 'user@github.com',
        provider_username: 'testuser',
      };

      const createdProvider = {
        id: 1,
        ...oauthData,
        created_at: new Date(),
        last_used_at: new Date(),
      };

      mockRepository.create.mockReturnValue(createdProvider);
      mockRepository.save.mockResolvedValue(createdProvider);

      const result = await createOAuthProvider(oauthData);

      expect(result).toEqual(createdProvider);
      expect(mockRepository.create).toHaveBeenCalledWith(oauthData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdProvider);
    });

    it('should create OAuth provider with service connection type', async () => {
      const oauthData = {
        user_id: 456,
        provider: 'google',
        connection_type: 'service' as const,
        provider_id: 'google456',
        provider_email: 'user@gmail.com',
      };

      const createdProvider = {
        id: 2,
        ...oauthData,
        created_at: new Date(),
      };

      mockRepository.create.mockReturnValue(createdProvider);
      mockRepository.save.mockResolvedValue(createdProvider);

      const result = await createOAuthProvider(oauthData);

      expect(result).toEqual(createdProvider);
      expect(mockRepository.create).toHaveBeenCalledWith(oauthData);
    });

    it('should create OAuth provider with optional fields', async () => {
      const oauthData = {
        user_id: 789,
        provider: 'spotify',
        connection_type: 'service' as const,
        provider_id: 'spotify789',
        provider_profile_data: JSON.stringify({ display_name: 'Spotify User' }),
      };

      const createdProvider = {
        id: 3,
        ...oauthData,
      };

      mockRepository.create.mockReturnValue(createdProvider);
      mockRepository.save.mockResolvedValue(createdProvider);

      const result = await createOAuthProvider(oauthData);

      expect(result).toEqual(createdProvider);
      expect(mockRepository.create).toHaveBeenCalledWith(oauthData);
    });

    it('should handle errors when creating OAuth provider', async () => {
      const oauthData = {
        user_id: 123,
        provider: 'github',
        connection_type: 'auth' as const,
        provider_id: 'github123',
      };

      const dbError = new Error('Failed to save to database');
      mockRepository.create.mockReturnValue(oauthData);
      mockRepository.save.mockRejectedValue(dbError);

      await expect(createOAuthProvider(oauthData)).rejects.toThrow(
        'Failed to save to database'
      );
    });
  });

  describe('updateOAuthProviderLastUsed', () => {
    it('should update last_used_at and return true when successful', async () => {
      const mockDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await updateOAuthProviderLastUsed(1);

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        last_used_at: mockDate,
      });

      jest.restoreAllMocks();
    });

    it('should return false when no rows affected', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });

      const result = await updateOAuthProviderLastUsed(999);

      expect(result).toBe(false);
      expect(mockRepository.update).toHaveBeenCalledWith(999, {
        last_used_at: expect.any(Date),
      });
    });

    it('should return false when affected is undefined', async () => {
      mockRepository.update.mockResolvedValue({ affected: undefined });

      const result = await updateOAuthProviderLastUsed(1);

      expect(result).toBe(false);
    });

    it('should return false when affected is null', async () => {
      mockRepository.update.mockResolvedValue({ affected: null });

      const result = await updateOAuthProviderLastUsed(1);

      expect(result).toBe(false);
    });

    it('should handle errors when updating', async () => {
      const dbError = new Error('Update failed');
      mockRepository.update.mockRejectedValue(dbError);

      await expect(updateOAuthProviderLastUsed(1)).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('updateOAuthProvider', () => {
    it('should update OAuth provider with partial data and return true', async () => {
      const updateData = {
        provider_email: 'newemail@github.com',
        provider_username: 'newusername',
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await updateOAuthProvider(1, updateData);

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should update OAuth provider with last_used_at', async () => {
      const lastUsedDate = new Date('2024-01-01');
      const updateData = {
        last_used_at: lastUsedDate,
        provider_email: 'updated@example.com',
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await updateOAuthProvider(1, updateData);

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should update with connection_type', async () => {
      const updateData = {
        connection_type: 'service' as const,
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await updateOAuthProvider(1, updateData);

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should return false when no rows affected', async () => {
      const updateData = { provider_email: 'test@example.com' };
      mockRepository.update.mockResolvedValue({ affected: 0 });

      const result = await updateOAuthProvider(999, updateData);

      expect(result).toBe(false);
    });

    it('should return false when affected is undefined', async () => {
      const updateData = { provider_username: 'newuser' };
      mockRepository.update.mockResolvedValue({ affected: undefined });

      const result = await updateOAuthProvider(1, updateData);

      expect(result).toBe(false);
    });

    it('should return false when affected is null', async () => {
      const updateData = { provider_profile_data: '{}' };
      mockRepository.update.mockResolvedValue({ affected: null });

      const result = await updateOAuthProvider(1, updateData);

      expect(result).toBe(false);
    });

    it('should handle multiple fields update', async () => {
      const updateData = {
        provider_email: 'multi@example.com',
        provider_username: 'multiuser',
        provider_profile_data: JSON.stringify({ name: 'Multi User' }),
        last_used_at: new Date(),
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await updateOAuthProvider(1, updateData);

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should handle errors when updating', async () => {
      const updateData = { provider_email: 'error@example.com' };
      const dbError = new Error('Update operation failed');
      mockRepository.update.mockRejectedValue(dbError);

      await expect(updateOAuthProvider(1, updateData)).rejects.toThrow(
        'Update operation failed'
      );
    });
  });
});
