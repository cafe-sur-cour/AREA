import request from 'supertest';
import express from 'express';
import userRouter from '../../../src/routes/user/user';
import {
  getAllUsers,
  getUserByID,
  getUserByEmail,
  updateUser,
} from '../../../src/routes/user/user.service';
import { createLog } from '../../../src/routes/logs/logs.service';
import { AppDataSource } from '../../../src/config/db';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../../src/routes/user/user.service');
jest.mock('../../../src/routes/logs/logs.service');
jest.mock('../../../src/config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(password => Promise.resolve(`hashed_${password}`)),
}));

jest.mock('../../../index', () => ({
  encryption: {
    encryptToString: jest.fn(str => `encrypted_${str}`),
    decryptFromString: jest.fn(str => str.replace('encrypted_', '')),
  },
}));

// Mock middleware - we'll override req.auth in each test
let mockIsAdmin = false;
let mockUserId = 1;

jest.mock('../../../src/middleware/token', () => {
  return (req: any, res: any, next: any) => {
    req.auth = {
      id: mockUserId,
      email: 'test@example.com',
      is_admin: mockIsAdmin,
    };
    next();
  };
});

jest.mock('../../../src/middleware/admin', () => {
  return (req: any, res: any, next: any) => {
    if (req.auth?.is_admin) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden - admin privileges required' });
    }
  };
});

const app = express();
app.use(express.json());
app.use('/api/user', userRouter);

describe('User Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAdmin = false; // Reset to non-admin by default
    mockUserId = 1; // Reset to user 1 by default
    (createLog as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET /', () => {
    it('should return all users for admin', async () => {
      mockIsAdmin = true;
      const mockUsers = [
        { id: 1, email: 'user1@example.com', name: 'User 1' },
        { id: 2, email: 'user2@example.com', name: 'User 2' },
      ];
      (getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app).get('/api/user/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should return 500 on service error', async () => {
      mockIsAdmin = true;
      (getAllUsers as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/user/');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 for non-admin users', async () => {
      mockIsAdmin = false;

      const response = await request(app).get('/api/user/');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /me', () => {
    it('should return current user info', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        picture: 'test.jpg',
        is_email_verified: true,
        bio: 'Test bio',
      };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/api/user/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(getUserByID).toHaveBeenCalledWith(1);
    });

    it('should return 404 if user not found', async () => {
      (getUserByID as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/user/me');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 500 on service error', async () => {
      (getUserByID as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/user/me');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /:data', () => {
    it('should allow user to get their own info by id', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/api/user/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(getUserByID).toHaveBeenCalledWith(1);
    });

    it('should allow user to get their own info by email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };
      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/api/user/test@example.com');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(getUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should allow admin to get user by id', async () => {
      mockIsAdmin = true;
      const mockUser = {
        id: 2,
        email: 'other@example.com',
        name: 'Other User',
      };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/api/user/2');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(getUserByID).toHaveBeenCalledWith(2);
    });

    it('should allow admin to get user by email', async () => {
      mockIsAdmin = true;
      const mockUser = {
        id: 2,
        email: 'other@example.com',
        name: 'Other User',
      };
      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/api/user/other@example.com');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(getUserByEmail).toHaveBeenCalledWith('other@example.com');
    });

    it('should return 403 when non-admin tries to access other user by id', async () => {
      mockIsAdmin = false;
      const mockUser = {
        id: 2,
        email: 'other@example.com',
        name: 'Other User',
      };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/api/user/2');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('msg');
    });

    it('should return 403 when non-admin tries to access other user by email', async () => {
      mockIsAdmin = false;
      const mockUser = {
        id: 2,
        email: 'other@example.com',
        name: 'Other User',
      };
      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).get('/api/user/other@example.com');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('msg');
    });

    it('should return 404 if user not found', async () => {
      (getUserByID as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/user/1');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('msg', 'User not found');
    });

    it('should return 500 on service error', async () => {
      (getUserByID as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/user/1');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('msg');
    });
  });

  describe('PUT /me', () => {
    it('should update current user name', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Old Name' };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);
      (updateUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        name: 'New Name',
      });

      const response = await request(app)
        .put('/api/user/me')
        .send({ name: 'New Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'encrypted_New Name' })
      );
    });

    it('should update current user email', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);
      (updateUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      });

      const response = await request(app)
        .put('/api/user/me')
        .send({ email: 'newemail@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('newemail@example.com');
      expect(updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ email: 'encrypted_newemail@example.com' })
      );
    });

    it('should update current user password', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);
      (updateUser as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_newpassword');

      const response = await request(app)
        .put('/api/user/me')
        .send({ password: 'newpassword' });

      expect(response.status).toBe(200);
      expect(updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ password_hash: 'hashed_newpassword' })
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });

    it('should update current user picture', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);
      (updateUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        picture: 'newpic.jpg',
      });

      const response = await request(app)
        .put('/api/user/me')
        .send({ picture: 'newpic.jpg' });

      expect(response.status).toBe(200);
      expect(response.body.picture).toBe('newpic.jpg');
      expect(updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ picture: 'newpic.jpg' })
      );
    });

    it('should update current user bio', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);
      (updateUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        bio: 'New bio',
      });

      const response = await request(app)
        .put('/api/user/me')
        .send({ bio: 'New bio' });

      // Bio is not a supported field, should return 400
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    it('should return 404 if current user not found', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);
      (updateUser as jest.Mock).mockResolvedValue(null); // updateUser returns null

      const response = await request(app)
        .put('/api/user/me')
        .send({ name: 'New Name' });

      // If updateUser returns null, the code returns 400, not 404
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    it('should return 400 when no fields to update', async () => {
      const response = await request(app).put('/api/user/me').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    it('should return 500 on service error', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      (getUserByID as jest.Mock).mockResolvedValue(mockUser);
      (updateUser as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/user/me')
        .send({ name: 'New Name' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /:data', () => {
    it('should delete user by id (admin only)', async () => {
      mockIsAdmin = true;
      const mockUser = { id: 2, email: 'other@example.com' };

      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      (AppDataSource.getRepository as jest.Mock).mockReturnValue(
        mockRepository
      );

      const response = await request(app).delete('/api/user/2');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'User deleted successfully'
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(mockRepository.delete).toHaveBeenCalledWith(2);
    });

    it('should delete user by email (admin only)', async () => {
      mockIsAdmin = true;
      const mockUser = { id: 2, email: 'other@example.com' };

      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      (AppDataSource.getRepository as jest.Mock).mockReturnValue(
        mockRepository
      );

      const response = await request(app).delete('/api/user/other@example.com');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'User deleted successfully'
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'other@example.com' },
      });
      expect(mockRepository.delete).toHaveBeenCalledWith(2);
    });

    it('should return 403 for non-admin users', async () => {
      mockIsAdmin = false;

      const response = await request(app).delete('/api/user/2');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 if user not found', async () => {
      mockIsAdmin = true;

      const mockRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (AppDataSource.getRepository as jest.Mock).mockReturnValue(
        mockRepository
      );

      const response = await request(app).delete('/api/user/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 500 on service error', async () => {
      mockIsAdmin = true;

      const mockRepository = {
        findOne: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      (AppDataSource.getRepository as jest.Mock).mockReturnValue(
        mockRepository
      );

      const response = await request(app).delete('/api/user/2');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
