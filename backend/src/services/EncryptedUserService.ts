import { StringEncryption } from '../config/EncryptionService';
import { User } from '../config/entity/User';
import { AppDataSource } from '../config/db';
import { Repository } from 'typeorm';
import crypto from 'crypto';

interface DecryptedUser {
  id: number;
  name: string;
  email: string;
  email_hash: string;
  password_hash: string;
  is_admin: boolean;
  picture: string;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean;
  email_verification_token: string;
  email_verification_expires: Date;
  password_reset_token: string;
  password_reset_expires: Date;
  failed_login_attempts: number;
  locked_until: Date;
  last_login_at: Date;
  last_password_change: Date;
  timezone: string;
  language: string;
  theme: string;
  is_active: boolean;
  deleted_at: Date;
}

interface CreateUserDTO {
  name: string;
  email: string;
  password_hash: string;
  email_verified?: boolean;
  is_active?: boolean;
  bio?: string;
}

interface UpdateUserDTO {
  name?: string;
  bio?: string;
  picture?: string;
}

export class EncryptedUserService {
  private encryption: StringEncryption;
  private userRepository: Repository<User>;

  constructor() {
    this.encryption = new StringEncryption();
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Create a hash for email lookup (deterministic)
   */
  private createEmailHash(email: string): string {
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  }

  /**
   * Encrypt sensitive user data
   */
  private encryptUserData(userData: {
    name: string;
    email: string;
    bio?: string;
  }): {
    encrypted_name: string;
    encrypted_email: string;
    email_hash: string;
    encrypted_bio?: string;
  } {
    const result: {
      encrypted_name: string;
      encrypted_email: string;
      email_hash: string;
      encrypted_bio?: string;
    } = {
      encrypted_name: this.encryption.encryptToString(userData.name),
      encrypted_email: this.encryption.encryptToString(userData.email.toLowerCase()),
      email_hash: this.createEmailHash(userData.email),
    };
    
    if (userData.bio) {
      result.encrypted_bio = this.encryption.encryptToString(userData.bio);
    }
    
    return result;
  }

  /**
   * Decrypt user data for presentation
   */
  private decryptUser(user: User): DecryptedUser {
    try {
      return {
        ...user,
        name: this.encryption.decryptFromString(user.name),
        email: this.encryption.decryptFromString(user.email),
        bio: user.bio ? this.encryption.decryptFromString(user.bio) : null,
      };
    } catch (error) {
      throw new Error(`Failed to decrypt user data: ${(error as Error).message}`);
    }
  }

  /**
   * Get all users with decrypted data
   */
  async getAllUsers(): Promise<DecryptedUser[]> {
    const users = await this.userRepository.find();
    return users.map(user => this.decryptUser(user));
  }

  /**
   * Get user by ID with decrypted data
   */
  async getUserByID(id: number): Promise<DecryptedUser | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;
    return this.decryptUser(user);
  }

  /**
   * Get user by email (using email hash for lookup)
   */
  async getUserByEmail(email: string): Promise<DecryptedUser | null> {
    const emailHash = this.createEmailHash(email);
    const user = await this.userRepository.findOne({
      where: { email_hash: emailHash }
    });
    if (!user) return null;
    return this.decryptUser(user);
  }

  /**
   * Get user by name (requires scanning all users - not efficient for large datasets)
   */
  async getUserByName(name: string): Promise<DecryptedUser | null> {
    const users = await this.userRepository.find();
    for (const user of users) {
      try {
        const decryptedName = this.encryption.decryptFromString(user.name);
        if (decryptedName === name) {
          return this.decryptUser(user);
        }
      } catch {
        // Skip corrupted data
        continue;
      }
    }
    return null;
  }

  /**
   * Create a new user with encrypted data
   */
  async createUser(userData: CreateUserDTO): Promise<DecryptedUser> {
    const encryptedData = this.encryptUserData({
      name: userData.name,
      email: userData.email,
      bio: userData.bio || '',
    });

    const user = new User();
    user.name = encryptedData.encrypted_name;
    user.email = encryptedData.encrypted_email;
    user.email_hash = encryptedData.email_hash;
    user.password_hash = userData.password_hash;
    user.bio = encryptedData.encrypted_bio || '';
    
    if (userData.email_verified !== undefined) {
      user.email_verified = userData.email_verified;
    }
    if (userData.is_active !== undefined) {
      user.is_active = userData.is_active;
    }

    const savedUser = await this.userRepository.save(user);
    return this.decryptUser(savedUser);
  }

  /**
   * Update user with encrypted data
   */
  async updateUser(id: number, userData: UpdateUserDTO): Promise<DecryptedUser | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;

    const updateData: Partial<User> = {};

    if (userData.name !== undefined) {
      updateData.name = this.encryption.encryptToString(userData.name);
    }

    if (userData.bio !== undefined) {
      updateData.bio = userData.bio ? this.encryption.encryptToString(userData.bio) : '';
    }

    if (userData.picture !== undefined) {
      updateData.picture = userData.picture;
    }

    const updateResult = await this.userRepository.update(id, updateData);

    if (updateResult.affected && updateResult.affected > 0) {
      const updatedUser = await this.userRepository.findOne({ where: { id } });
      return updatedUser ? this.decryptUser(updatedUser) : null;
    }

    return null;
  }

  /**
   * Update user password (no encryption needed)
   */
  async updateUserPassword(id: number, new_password: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return false;
    
    await this.userRepository.update({ id }, { password_hash: new_password });
    return true;
  }

  /**
   * Update user name with encryption
   */
  async updateUserName(id: number, new_name: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return false;
    
    const encrypted_name = this.encryption.encryptToString(new_name);
    await this.userRepository.update({ id }, { name: encrypted_name });
    return true;
  }

  /**
   * Delete user by ID
   */
  async deleteUserById(id: number): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return false;
    
    await this.userRepository.delete({ id });
    return true;
  }

  /**
   * Get number of users
   */
  async getNbUser(): Promise<number | null> {
    return this.userRepository.count();
  }

  /**
   * Update user email verification status
   */
  async updateUserEmailVerified(id: number, email_verified: boolean): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return false;
    
    await this.userRepository.update({ id }, { email_verified });
    return true;
  }

  /**
   * Update user last login
   */
  async updateUserLastLogin(id: number): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return false;
    
    await this.userRepository.update({ id }, { last_login_at: new Date() });
    return true;
  }

  /**
   * Get raw user (encrypted) by ID - for internal use only
   */
  async getRawUserByID(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  /**
   * Get raw user (encrypted) by email hash - for internal use only
   */
  async getRawUserByEmailHash(email: string): Promise<User | null> {
    const emailHash = this.createEmailHash(email);
    return this.userRepository.findOne({
      where: { email_hash: emailHash }
    });
  }
}
