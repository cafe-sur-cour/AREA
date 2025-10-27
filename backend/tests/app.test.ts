import { saveData } from '../src/app';
import { AppDataSource } from '../src/config/db';
import { User } from '../src/config/entity/User';
import { encryption } from '../index';
import { getUserByEmail } from '../src/routes/user/user.service';

// Mock all dependencies
jest.mock('../src/config/db');
jest.mock('../src/config/entity/User');
jest.mock('../index', () => ({
  encryption: {
    encryptToString: jest.fn(),
  },
}));
jest.mock('../src/routes/user/user.service');

const mockAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;
const mockUser = User as jest.MockedClass<typeof User>;
const mockEncryption = encryption as jest.Mocked<typeof encryption>;
const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<
  typeof getUserByEmail
>;

describe('saveData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockAppDataSource.manager.save as jest.MockedFunction<any>) = jest
      .fn()
      .mockResolvedValue(undefined);
  });

  describe('when user already exists', () => {
    beforeEach(() => {
      mockGetUserByEmail.mockResolvedValue({} as User);
    });

    it('should check for existing user and log message without creating new users', async () => {
      await saveData();

      expect(mockGetUserByEmail).toHaveBeenCalledWith('alice@example.com');
      expect(console.log).toHaveBeenCalledWith('User already exists');
      expect(mockEncryption.encryptToString).not.toHaveBeenCalled();
      expect(mockAppDataSource.manager.save).not.toHaveBeenCalled();
    });
  });

  describe('when user does not exist', () => {
    beforeEach(() => {
      mockGetUserByEmail.mockResolvedValue(null);
      mockEncryption.encryptToString.mockReturnValue('encrypted-value');
      mockUser.mockImplementation(() => ({}) as any);
    });

    it('should create and save two users', async () => {
      await saveData();

      expect(mockUser).toHaveBeenCalledTimes(2);
      expect(mockEncryption.encryptToString).toHaveBeenCalledTimes(4);
      expect(mockAppDataSource.manager.save).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith(
        'Saved a new user:',
        expect.any(Object)
      );
    });

    it('should encrypt user data correctly', async () => {
      await saveData();

      expect(mockEncryption.encryptToString).toHaveBeenCalledWith('Alice');
      expect(mockEncryption.encryptToString).toHaveBeenCalledWith(
        'alice@example.com'
      );
      expect(mockEncryption.encryptToString).toHaveBeenCalledWith('Bob');
      expect(mockEncryption.encryptToString).toHaveBeenCalledWith(
        'bob@example.com'
      );
    });

    it('should handle encryption errors', async () => {
      mockEncryption.encryptToString.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(saveData()).rejects.toThrow('Encryption failed');
      expect(mockAppDataSource.manager.save).not.toHaveBeenCalled();
    });

    it('should handle database save errors', async () => {
      (
        mockAppDataSource.manager.save as jest.MockedFunction<any>
      ).mockRejectedValueOnce(new Error('Database error'));

      await expect(saveData()).rejects.toThrow('Database error');
      expect(mockAppDataSource.manager.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle getUserByEmail rejection', async () => {
      mockGetUserByEmail.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(saveData()).rejects.toThrow('Database connection failed');

      expect(mockEncryption.encryptToString).not.toHaveBeenCalled();
      expect(mockAppDataSource.manager.save).not.toHaveBeenCalled();
    });
  });
});
