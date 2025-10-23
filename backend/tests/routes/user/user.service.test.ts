import {
  getAllUsers,
  getUserByID,
  getUserByEmail,
  getUserByName,
  deleteUserById,
  updateUser,
  updateUserPassword,
  updateUserName,
  getNbUser,
  createUser,
  updateUserEmailVerified,
  updateUserLastLogin,
} from '../../../src/routes/user/user.service';
import { AppDataSource } from '../../../src/config/db';
import { User } from '../../../src/config/entity/User';
import { encryption } from '../../../index';

// Mock dependencies
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    manager: {
      find: jest.fn(),
      findOneBy: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
    },
    getRepository: jest.fn(),
  },
}));

jest.mock('../../../index', () => ({
  encryption: {
    encryptToString: jest.fn(str => `encrypted_${str}`),
    decryptFromString: jest.fn(str => str.replace('encrypted_', '')),
  },
}));

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users with decrypted data', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'encrypted_John',
          email: 'encrypted_john@example.com',
          bio: 'encrypted_Developer',
        },
        {
          id: 2,
          name: 'encrypted_Jane',
          email: 'encrypted_jane@example.com',
          bio: null,
        },
      ];

      (AppDataSource.manager.find as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John');
      expect(result[0].email).toBe('john@example.com');
      expect(result[0].bio).toBe('Developer');
      expect(result[1].name).toBe('Jane');
      expect(result[1].email).toBe('jane@example.com');
      expect(encryption.decryptFromString).toHaveBeenCalledTimes(5); // 2 names, 2 emails, 1 bio
    });

    it('should throw error if decryption fails', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'encrypted_John',
          email: 'encrypted_john@example.com',
        },
      ];

      (AppDataSource.manager.find as jest.Mock).mockResolvedValue(mockUsers);
      (encryption.decryptFromString as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(getAllUsers()).rejects.toThrow(
        'Failed to decrypt user data: Decryption failed'
      );
    });

    it('should return empty array when no users exist', async () => {
      (AppDataSource.manager.find as jest.Mock).mockResolvedValue([]);

      const result = await getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getUserByID', () => {
    it('should return user with decrypted data', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: 'encrypted_Developer',
      };

      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(
        mockUser
      );
      // Reset the mock to return proper decrypted values
      (encryption.decryptFromString as jest.Mock).mockImplementation(str =>
        str.replace('encrypted_', '')
      );

      const result = await getUserByID(1);

      expect(result).toBeDefined();
      expect(result?.name).toBe('John');
      expect(result?.email).toBe('john@example.com');
      expect(result?.bio).toBe('Developer');
    });

    it('should return null if user not found', async () => {
      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await getUserByID(999);

      expect(result).toBeNull();
    });

    it('should throw error if decryption fails', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
      };

      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(
        mockUser
      );
      (encryption.decryptFromString as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(getUserByID(1)).rejects.toThrow(
        'Failed to decrypt user data: Decryption failed'
      );
    });
  });

  describe('getUserByEmail', () => {
    it('should return user with matching email', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'encrypted_John',
          email: 'encrypted_john@example.com',
        },
        {
          id: 2,
          name: 'encrypted_Jane',
          email: 'encrypted_jane@example.com',
        },
      ];

      (AppDataSource.manager.find as jest.Mock).mockResolvedValue(mockUsers);
      (encryption.decryptFromString as jest.Mock).mockImplementation(str =>
        str.replace('encrypted_', '')
      );

      const result = await getUserByEmail('john@example.com');

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.email).toBe('john@example.com');
    });

    it('should return null if email not found', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'encrypted_John',
          email: 'encrypted_john@example.com',
        },
      ];

      (AppDataSource.manager.find as jest.Mock).mockResolvedValue(mockUsers);
      (encryption.decryptFromString as jest.Mock).mockImplementation(str =>
        str.replace('encrypted_', '')
      );

      const result = await getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should throw error if getAllUsers fails', async () => {
      (AppDataSource.manager.find as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (encryption.decryptFromString as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption error');
      });

      await expect(getUserByEmail('test@example.com')).rejects.toThrow(
        'Failed to decrypt user data'
      );
    });
  });

  describe('getUserByName', () => {
    it('should return user with matching name', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'encrypted_John',
          email: 'encrypted_john@example.com',
        },
        {
          id: 2,
          name: 'encrypted_Jane',
          email: 'encrypted_jane@example.com',
        },
      ];

      (AppDataSource.manager.find as jest.Mock).mockResolvedValue(mockUsers);
      (encryption.decryptFromString as jest.Mock).mockImplementation(str =>
        str.replace('encrypted_', '')
      );

      const result = await getUserByName('John');

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.name).toBe('John');
    });

    it('should return null if name not found', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'encrypted_John',
          email: 'encrypted_john@example.com',
        },
      ];

      (AppDataSource.manager.find as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getUserByName('NotFound');

      expect(result).toBeNull();
    });
  });

  describe('deleteUserById', () => {
    it('should delete user and return true', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
      };

      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(
        mockUser
      );
      (AppDataSource.manager.delete as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      const result = await deleteUserById(1);

      expect(result).toBe(true);
      expect(AppDataSource.manager.delete).toHaveBeenCalledWith(User, {
        id: 1,
      });
    });

    it('should return false if user not found', async () => {
      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await deleteUserById(999);

      expect(result).toBe(false);
      expect(AppDataSource.manager.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user and return updated user', async () => {
      const mockUser = {
        id: 1,
        name: 'John Updated',
        bio: 'New bio',
      };

      const mockRepository = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockResolvedValue(mockUser),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(
        mockRepository
      );

      const result = await updateUser(1, {
        name: 'John Updated',
        bio: 'New bio',
      });

      expect(result).toEqual(mockUser);
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        name: 'John Updated',
        bio: 'New bio',
      });
    });

    it('should return null if update affects no rows', async () => {
      const mockRepository = {
        update: jest.fn().mockResolvedValue({ affected: 0 }),
        findOne: jest.fn(),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(
        mockRepository
      );

      const result = await updateUser(999, { name: 'Test' });

      expect(result).toBeNull();
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return null if affected is undefined', async () => {
      const mockRepository = {
        update: jest.fn().mockResolvedValue({ affected: undefined }),
        findOne: jest.fn(),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(
        mockRepository
      );

      const result = await updateUser(1, { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('updateUserPassword', () => {
    it('should update password and return true', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
      };

      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(
        mockUser
      );
      (encryption.decryptFromString as jest.Mock).mockImplementation(str =>
        str.replace('encrypted_', '')
      );
      (AppDataSource.manager.update as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      const result = await updateUserPassword(1, 'newHashedPassword');

      expect(result).toBe(true);
      expect(AppDataSource.manager.update).toHaveBeenCalledWith(
        User,
        { id: 1 },
        { password_hash: 'newHashedPassword' }
      );
    });

    it('should still update even if getUserByID returns null (bug in code)', async () => {
      // This test documents the actual behavior of the code
      // The code has a bug: it doesn't check the result of getUserByID
      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(null);
      (AppDataSource.manager.update as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      const result = await updateUserPassword(999, 'newHashedPassword');

      // The function returns true even though user doesn't exist
      expect(result).toBe(true);
    });
  });

  describe('updateUserName', () => {
    it('should update encrypted name and return true', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
      };

      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(
        mockUser
      );
      (encryption.decryptFromString as jest.Mock).mockImplementation(str =>
        str.replace('encrypted_', '')
      );
      (encryption.encryptToString as jest.Mock).mockImplementation(
        str => `encrypted_${str}`
      );
      (AppDataSource.manager.update as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      const result = await updateUserName(1, 'NewName');

      expect(result).toBe(true);
      expect(encryption.encryptToString).toHaveBeenCalledWith('NewName');
      expect(AppDataSource.manager.update).toHaveBeenCalledWith(
        User,
        { id: 1 },
        { name: 'encrypted_NewName' }
      );
    });

    it('should still update even if getUserByID returns null (bug in code)', async () => {
      // This test documents the actual behavior of the code
      // The code has a bug: it doesn't check the result of getUserByID
      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(null);
      (encryption.encryptToString as jest.Mock).mockImplementation(
        str => `encrypted_${str}`
      );
      (AppDataSource.manager.update as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      const result = await updateUserName(999, 'NewName');

      // The function returns true even though user doesn't exist
      expect(result).toBe(true);
    });
  });

  describe('getNbUser', () => {
    it('should return count of users', async () => {
      (AppDataSource.manager.count as jest.Mock).mockResolvedValue(42);

      const result = await getNbUser();

      expect(result).toBe(42);
      expect(AppDataSource.manager.count).toHaveBeenCalledWith(User);
    });

    it('should return 0 when no users exist', async () => {
      (AppDataSource.manager.count as jest.Mock).mockResolvedValue(0);

      const result = await getNbUser();

      expect(result).toBe(0);
    });
  });

  describe('createUser', () => {
    it('should create user with encrypted data', async () => {
      const mockSavedUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        password_hash: 'hashedPassword',
        email_verified: false,
        is_active: true,
      };

      (AppDataSource.manager.save as jest.Mock).mockResolvedValue(
        mockSavedUser
      );

      const result = await createUser({
        name: 'John',
        email: 'john@example.com',
        password_hash: 'hashedPassword',
        email_verified: false,
        is_active: true,
      });

      expect(result).toEqual(mockSavedUser);
      expect(encryption.encryptToString).toHaveBeenCalledWith('John');
      expect(encryption.encryptToString).toHaveBeenCalledWith(
        'john@example.com'
      );
    });

    it('should create user with default values', async () => {
      const mockSavedUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        password_hash: 'hashedPassword',
      };

      (AppDataSource.manager.save as jest.Mock).mockResolvedValue(
        mockSavedUser
      );

      const result = await createUser({
        name: 'John',
        email: 'john@example.com',
        password_hash: 'hashedPassword',
      });

      expect(result).toEqual(mockSavedUser);
    });
  });

  describe('updateUserEmailVerified', () => {
    it('should update email verification status and return true', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
      };

      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(
        mockUser
      );
      (AppDataSource.manager.update as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      const result = await updateUserEmailVerified(1, true);

      expect(result).toBe(true);
      expect(AppDataSource.manager.update).toHaveBeenCalledWith(
        User,
        { id: 1 },
        { email_verified: true }
      );
    });

    it('should return false if user not found', async () => {
      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await updateUserEmailVerified(999, true);

      expect(result).toBe(false);
      expect(AppDataSource.manager.update).not.toHaveBeenCalled();
    });
  });

  describe('updateUserLastLogin', () => {
    it('should update last login timestamp and return true', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
      };

      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(
        mockUser
      );
      (AppDataSource.manager.update as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      const result = await updateUserLastLogin(1);

      expect(result).toBe(true);
      expect(AppDataSource.manager.update).toHaveBeenCalledWith(
        User,
        { id: 1 },
        expect.objectContaining({ last_login_at: expect.any(Date) })
      );
    });

    it('should return false if user not found', async () => {
      (AppDataSource.manager.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await updateUserLastLogin(999);

      expect(result).toBe(false);
      expect(AppDataSource.manager.update).not.toHaveBeenCalled();
    });
  });
});
