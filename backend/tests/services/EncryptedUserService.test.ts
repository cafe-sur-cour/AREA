import { EncryptedUserService } from '../../src/services/EncryptedUserService';
import { AppDataSource } from '../../src/config/db';
import { User } from '../../src/config/entity/User';
import { StringEncryption } from '../../src/config/EncryptionService';
import crypto from 'crypto';

jest.mock('../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../src/config/EncryptionService');

describe('EncryptedUserService', () => {
  let service: EncryptedUserService;
  let mockRepository: any;
  let mockEncryption: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock encryption service
    mockEncryption = {
      encryptToString: jest.fn(str => `encrypted_${str}`),
      decryptFromString: jest.fn(str => str.replace('encrypted_', '')),
    };
    (StringEncryption as any).mockImplementation(() => mockEncryption);

    // Mock repository
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);

    service = new EncryptedUserService();
  });

  describe('getAllUsers', () => {
    it('should return all users with decrypted data', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'encrypted_John',
          email: 'encrypted_john@example.com',
          bio: 'encrypted_Bio1',
          email_hash: 'hash1',
          password_hash: 'hash',
          is_admin: false,
        },
        {
          id: 2,
          name: 'encrypted_Jane',
          email: 'encrypted_jane@example.com',
          bio: null,
          email_hash: 'hash2',
          password_hash: 'hash',
          is_admin: true,
        },
      ];
      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John');
      expect(result[0].email).toBe('john@example.com');
      expect(result[0].bio).toBe('Bio1');
      expect(result[1].name).toBe('Jane');
      expect(result[1].bio).toBeNull();
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no users exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should throw error if decryption fails', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'corrupted_data',
          email: 'encrypted_john@example.com',
          bio: null,
        },
      ];
      mockRepository.find.mockResolvedValue(mockUsers);
      mockEncryption.decryptFromString.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(service.getAllUsers()).rejects.toThrow(
        'Failed to decrypt user data'
      );
    });
  });

  describe('getUserByID', () => {
    it('should return user with decrypted data when user exists', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: 'encrypted_Bio',
        email_hash: 'hash',
        password_hash: 'hash',
      };
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.getUserByID(1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('John');
      expect(result?.email).toBe('john@example.com');
      expect(result?.bio).toBe('Bio');
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null when user does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getUserByID(999);

      expect(result).toBeNull();
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });

    it('should handle user with null bio', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: null,
      };
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.getUserByID(1);

      expect(result?.bio).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user with decrypted data when user exists', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: 'encrypted_Bio',
        email_hash: crypto
          .createHash('sha256')
          .update('john@example.com')
          .digest('hex'),
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('john@example.com');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('John');
      expect(result?.email).toBe('john@example.com');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          email_hash: crypto
            .createHash('sha256')
            .update('john@example.com')
            .digest('hex'),
        },
      });
    });

    it('should handle email case insensitivity', async () => {
      const emailHash = crypto
        .createHash('sha256')
        .update('john@example.com')
        .digest('hex');
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: null,
        email_hash: emailHash,
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('JOHN@EXAMPLE.COM');

      expect(result).not.toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email_hash: emailHash },
      });
    });

    it('should return null when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserByName', () => {
    it('should return user with matching name', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'encrypted_John',
          email: 'encrypted_john@example.com',
          bio: null,
        },
        {
          id: 2,
          name: 'encrypted_Jane',
          email: 'encrypted_jane@example.com',
          bio: null,
        },
      ];
      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await service.getUserByName('Jane');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(2);
      expect(result?.name).toBe('Jane');
    });

    it('should return null when no user matches', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'encrypted_John',
          email: 'encrypted_john@example.com',
          bio: null,
        },
      ];
      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await service.getUserByName('Bob');

      expect(result).toBeNull();
    });

    it('should skip corrupted data and continue searching', async () => {
      const mockUsers = [
        { id: 1, name: 'corrupted_data', email: 'encrypted_email1', bio: null },
        {
          id: 2,
          name: 'encrypted_Jane',
          email: 'encrypted_jane@example.com',
          bio: null,
        },
      ];
      mockRepository.find.mockResolvedValue(mockUsers);
      mockEncryption.decryptFromString.mockImplementation((str: string) => {
        if (str === 'corrupted_data') {
          throw new Error('Decryption error');
        }
        return str.replace('encrypted_', '');
      });

      const result = await service.getUserByName('Jane');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(2);
    });

    it('should return null when all data is corrupted', async () => {
      const mockUsers = [
        { id: 1, name: 'corrupted1', email: 'encrypted_email1', bio: null },
        { id: 2, name: 'corrupted2', email: 'encrypted_email2', bio: null },
      ];
      mockRepository.find.mockResolvedValue(mockUsers);
      mockEncryption.decryptFromString.mockImplementation(() => {
        throw new Error('Decryption error');
      });

      const result = await service.getUserByName('Anyone');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user with encrypted data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'hashed_password',
        bio: 'My bio',
      };

      const savedUser = {
        id: 1,
        name: 'encrypted_John Doe',
        email: 'encrypted_john@example.com',
        email_hash: crypto
          .createHash('sha256')
          .update('john@example.com')
          .digest('hex'),
        password_hash: 'hashed_password',
        bio: 'encrypted_My bio',
      };
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.createUser(userData);

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.bio).toBe('My bio');
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'encrypted_John Doe',
          email: 'encrypted_john@example.com',
          password_hash: 'hashed_password',
          bio: 'encrypted_My bio',
        })
      );
    });

    it('should create user without bio', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'hashed_password',
      };

      const savedUser = {
        id: 1,
        name: 'encrypted_John Doe',
        email: 'encrypted_john@example.com',
        email_hash: crypto
          .createHash('sha256')
          .update('john@example.com')
          .digest('hex'),
        password_hash: 'hashed_password',
        bio: '',
      };
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.createUser(userData);

      expect(result.name).toBe('John Doe');
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          bio: '',
        })
      );
    });

    it('should set email_verified when provided', async () => {
      const userData = {
        name: 'John',
        email: 'john@example.com',
        password_hash: 'hash',
        email_verified: true,
      };

      const savedUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        email_hash: 'hash',
        password_hash: 'hash',
        bio: 'encrypted_',
        email_verified: true,
      };
      mockRepository.save.mockResolvedValue(savedUser);

      await service.createUser(userData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ email_verified: true })
      );
    });

    it('should set is_active when provided', async () => {
      const userData = {
        name: 'John',
        email: 'john@example.com',
        password_hash: 'hash',
        is_active: false,
      };

      const savedUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        email_hash: 'hash',
        password_hash: 'hash',
        bio: 'encrypted_',
        is_active: false,
      };
      mockRepository.save.mockResolvedValue(savedUser);

      await service.createUser(userData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false })
      );
    });
  });

  describe('updateUser', () => {
    it('should update user name with encryption', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_OldName',
        email: 'encrypted_john@example.com',
        bio: null,
      };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({
        ...mockUser,
        name: 'encrypted_NewName',
      });

      const result = await service.updateUser(1, { name: 'NewName' });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('NewName');
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        name: 'encrypted_NewName',
      });
    });

    it('should update user bio with encryption', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: 'encrypted_OldBio',
      };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({
        ...mockUser,
        bio: 'encrypted_NewBio',
      });

      const result = await service.updateUser(1, { bio: 'NewBio' });

      expect(result).not.toBeNull();
      expect(result?.bio).toBe('NewBio');
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        bio: 'encrypted_NewBio',
      });
    });

    it('should update user picture without encryption', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: null,
        picture: 'old.jpg',
      };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({
        ...mockUser,
        picture: 'new.jpg',
      });

      const result = await service.updateUser(1, { picture: 'new.jpg' });

      expect(result).not.toBeNull();
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        picture: 'new.jpg',
      });
    });

    it('should update multiple fields at once', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: 'encrypted_OldBio',
        picture: 'old.jpg',
      };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({
        ...mockUser,
        name: 'encrypted_NewName',
        bio: 'encrypted_NewBio',
        picture: 'new.jpg',
      });

      const result = await service.updateUser(1, {
        name: 'NewName',
        bio: 'NewBio',
        picture: 'new.jpg',
      });

      expect(result).not.toBeNull();
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        name: 'encrypted_NewName',
        bio: 'encrypted_NewBio',
        picture: 'new.jpg',
      });
    });

    it('should set bio to empty string when bio is empty', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: 'encrypted_OldBio',
      };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({
        ...mockUser,
        bio: '',
      });

      const result = await service.updateUser(1, { bio: '' });

      expect(result).not.toBeNull();
      expect(mockRepository.update).toHaveBeenCalledWith(1, { bio: '' });
    });

    it('should return null when user does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.updateUser(999, { name: 'NewName' });

      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should return null when update affects 0 rows', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: null,
      };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.updateUser(1, { name: 'NewName' });

      expect(result).toBeNull();
    });

    it('should return null when updated user cannot be found', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: null,
      };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.updateUser(1, { name: 'NewName' });

      expect(result).toBeNull();
    });
  });

  describe('updateUserPassword', () => {
    it('should update user password', async () => {
      const mockUser = { id: 1, password_hash: 'old_hash' };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUserPassword(1, 'new_hash');

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { password_hash: 'new_hash' }
      );
    });

    it('should return false when user does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.updateUserPassword(999, 'new_hash');

      expect(result).toBe(false);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateUserName', () => {
    it('should update user name with encryption', async () => {
      const mockUser = { id: 1, name: 'encrypted_OldName' };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUserName(1, 'NewName');

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { name: 'encrypted_NewName' }
      );
    });

    it('should return false when user does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.updateUserName(999, 'NewName');

      expect(result).toBe(false);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteUserById', () => {
    it('should delete user when user exists', async () => {
      const mockUser = { id: 1, name: 'encrypted_John' };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteUserById(1);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return false when user does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.deleteUserById(999);

      expect(result).toBe(false);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getNbUser', () => {
    it('should return count of users', async () => {
      mockRepository.count.mockResolvedValue(42);

      const result = await service.getNbUser();

      expect(result).toBe(42);
      expect(mockRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when no users exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.getNbUser();

      expect(result).toBe(0);
    });
  });

  describe('updateUserEmailVerified', () => {
    it('should update email verified status to true', async () => {
      const mockUser = { id: 1, email_verified: false };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUserEmailVerified(1, true);

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { email_verified: true }
      );
    });

    it('should update email verified status to false', async () => {
      const mockUser = { id: 1, email_verified: true };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUserEmailVerified(1, false);

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { email_verified: false }
      );
    });

    it('should return false when user does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.updateUserEmailVerified(999, true);

      expect(result).toBe(false);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateUserLastLogin', () => {
    it('should update last login timestamp', async () => {
      const mockUser = { id: 1, last_login_at: null };
      mockRepository.findOneBy.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUserLastLogin(1);

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { last_login_at: expect.any(Date) }
      );
    });

    it('should return false when user does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.updateUserLastLogin(999);

      expect(result).toBe(false);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getRawUserByID', () => {
    it('should return raw encrypted user', async () => {
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        bio: 'encrypted_Bio',
      };
      mockRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.getRawUserByID(1);

      expect(result).toEqual(mockUser);
      expect(result?.name).toBe('encrypted_John');
      expect(mockEncryption.decryptFromString).not.toHaveBeenCalled();
    });

    it('should return null when user does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getRawUserByID(999);

      expect(result).toBeNull();
    });
  });

  describe('getRawUserByEmailHash', () => {
    it('should return raw encrypted user by email hash', async () => {
      const emailHash = crypto
        .createHash('sha256')
        .update('john@example.com')
        .digest('hex');
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        email_hash: emailHash,
        bio: 'encrypted_Bio',
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getRawUserByEmailHash('john@example.com');

      expect(result).toEqual(mockUser);
      expect(result?.name).toBe('encrypted_John');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email_hash: emailHash },
      });
      expect(mockEncryption.decryptFromString).not.toHaveBeenCalled();
    });

    it('should handle case insensitive email lookup', async () => {
      const emailHash = crypto
        .createHash('sha256')
        .update('john@example.com')
        .digest('hex');
      const mockUser = {
        id: 1,
        name: 'encrypted_John',
        email: 'encrypted_john@example.com',
        email_hash: emailHash,
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getRawUserByEmailHash('JOHN@EXAMPLE.COM');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email_hash: emailHash },
      });
    });

    it('should return null when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getRawUserByEmailHash(
        'notfound@example.com'
      );

      expect(result).toBeNull();
    });
  });
});
