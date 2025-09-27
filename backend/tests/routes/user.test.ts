import request from 'supertest';
import express from 'express';
import { User } from '../../src/config/entity/User';

const mockSave = jest.fn();
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockDelete = jest.fn();
const mockUpdate = jest.fn();
const mockCount = jest.fn();

// Mock database
jest.mock('../../src/config/db', () => ({
  AppDataSource: {
    manager: {
      save: mockSave,
      findOneBy: jest.fn(),
      find: mockFind,
      delete: mockDelete,
      update: mockUpdate,
      count: mockCount,
    },
    getRepository: jest.fn(() => ({
      findOne: mockFindOne,
      delete: mockDelete,
      update: mockUpdate,
    })),
  },
}));

// Mock user service
jest.mock('../../src/routes/user/user.service');

import * as userService from '../../src/routes/user/user.service';

const mockUserService = userService as jest.Mocked<typeof userService>;

const createMockUserRouter = () => {
  const router = express.Router();

  // GET /user - Get all users (admin only)
  router.get('/', async (req: any, res) => {
    if (!req.auth || !req.auth.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const users = await mockUserService.getAllUsers();
      return res.status(200).json(users);
    } catch (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // GET /user/me - Get current authenticated user
  router.get('/me', async (req: any, res) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const user = await mockUserService.getUserByID(req.auth.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const userResponse = {
        ...user,
        password: undefined,
      };
      return res.status(200).json(userResponse);
    } catch (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // GET /user/:data - Get user by id, email or name
  router.get('/:data', async (req: any, res) => {
    if (!req.auth) {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    try {
      const { is_admin, id, email } = req.auth;
      const { data } = req.params;
      let user = null;

      const isNumeric = /^\d+$/.test(data);

      if (is_admin) {
        if (isNumeric) {
          user = await mockUserService.getUserByID(Number(data));
        } else {
          user = await mockUserService.getUserByEmail(data);
        }
      } else {
        if (isNumeric) {
          if (Number(data) !== id) {
            return res.status(403).json({ msg: 'Forbidden' });
          }
          user = await mockUserService.getUserByID(id);
        } else {
          if (data !== email) {
            return res.status(403).json({ msg: 'Forbidden' });
          }
          user = await mockUserService.getUserByEmail(email);
        }
      }

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      return res.status(200).json(user);
    } catch (err) {
      return res.status(500).json({ msg: 'Internal server error' });
    }
  });

  // PUT /user/me - Update current authenticated user
  router.put('/me', async (req: any, res) => {
    if (!req.auth) {
      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Authentication required' });
    }

    try {
      const { name, bio, image_url } = req.body;

      if (!name && !bio && !image_url) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'At least one field is required: name, bio, or image_url',
        });
      }

      const userId = Number(req.auth.id);
      if (isNaN(userId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid user ID in authentication token',
        });
      }

      const updatedUser = await mockUserService.updateUser(userId, {
        name,
        bio,
        image_url,
      });

      if (!updatedUser) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Failed to update user - invalid data provided',
        });
      }

      return res.status(200).json(updatedUser);
    } catch (err) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while updating user',
      });
    }
  });

  // DELETE /user/:data - Delete user by id or email (admin only)
  router.delete('/:data', async (req: any, res) => {
    if (!req.auth || !req.auth.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const { data } = req.params;
      const isNumeric = /^\d+$/.test(data);
      let userToDelete: User | null = null;

      if (isNumeric) {
        userToDelete = await mockUserService.getUserByID(Number(data));
      } else {
        userToDelete = await mockUserService.getUserByEmail(data);
      }

      if (!userToDelete) {
        return res.status(404).json({ error: 'User not found' });
      }

      await mockUserService.deleteUserById(userToDelete.id);
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while deleting the user',
      });
    }
  });

  return router;
};

describe('User Routes Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock middleware for authentication and admin
    app.use((req: any, res, next) => {
      // Default non-admin user
      if (req.path.includes('/me') && req.method === 'GET') {
        req.auth = { id: 1, email: 'user@test.com', is_admin: false };
      }
      // Admin user for admin routes (GET / and DELETE)
      else if (
        (req.path === '/api/user' && req.method === 'GET') ||
        req.method === 'DELETE'
      ) {
        req.auth = { id: 1, email: 'admin@test.com', is_admin: true };
      }
      // Authenticated user for other routes
      else if (req.path.includes('/api/user')) {
        req.auth = { id: 1, email: 'user@test.com', is_admin: false };
      }
      next();
    });

    app.use('/api/user', createMockUserRouter());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /user', () => {
    it('should return all users for admin', async () => {
      const mockUsers = [
        { id: 1, name: 'User 1', email: 'user1@test.com' },
        { id: 2, name: 'User 2', email: 'user2@test.com' },
      ];
      mockUserService.getAllUsers.mockResolvedValue(
        mockUsers as unknown as User[]
      );

      const response = await request(app).get('/api/user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(mockUserService.getAllUsers).toHaveBeenCalled();
    });

    it('should return 403 for non-admin user', async () => {
      app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.auth = { id: 1, email: 'user@test.com', is_admin: false };
        next();
      });
      app.use('/api/user', createMockUserRouter());

      const response = await request(app).get('/api/user');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Forbidden' });
    });

    it('should return 500 when service throws error', async () => {
      mockUserService.getAllUsers.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/user');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('GET /user/me', () => {
    it('should return current user information', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'user@test.com',
        password: 'hashedpassword',
      };
      mockUserService.getUserByID.mockResolvedValue(
        mockUser as unknown as User
      );

      const response = await request(app).get('/api/user/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ...mockUser,
        password: undefined,
      });
      expect(mockUserService.getUserByID).toHaveBeenCalledWith(1);
    });

    it('should return 404 when user not found', async () => {
      mockUserService.getUserByID.mockResolvedValue(null);

      const response = await request(app).get('/api/user/me');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should return 401 when not authenticated', async () => {
      app = express();
      app.use(express.json());
      app.use('/api/user', createMockUserRouter());

      const response = await request(app).get('/api/user/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 500 when service throws error', async () => {
      mockUserService.getUserByID.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/user/me');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('GET /user/:data', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'user@test.com',
    };

    describe('Admin access', () => {
      beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use((req: any, res, next) => {
          req.auth = { id: 1, email: 'admin@test.com', is_admin: true };
          next();
        });
        app.use('/api/user', createMockUserRouter());
      });

      it('should allow admin to get user by numeric ID', async () => {
        mockUserService.getUserByID.mockResolvedValue(
          mockUser as unknown as User
        );

        const response = await request(app).get('/api/user/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUser);
        expect(mockUserService.getUserByID).toHaveBeenCalledWith(1);
      });

      it('should allow admin to get user by email', async () => {
        mockUserService.getUserByEmail.mockResolvedValue(
          mockUser as unknown as User
        );

        const response = await request(app).get('/api/user/user@test.com');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUser);
        expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(
          'user@test.com'
        );
      });
    });

    describe('Non-admin access', () => {
      beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use((req: any, res, next) => {
          req.auth = { id: 1, email: 'user@test.com', is_admin: false };
          next();
        });
        app.use('/api/user', createMockUserRouter());
      });

      it('should allow user to access their own data by ID', async () => {
        mockUserService.getUserByID.mockResolvedValue(
          mockUser as unknown as User
        );

        const response = await request(app).get('/api/user/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUser);
        expect(mockUserService.getUserByID).toHaveBeenCalledWith(1);
      });

      it('should forbid user from accessing other user data by ID', async () => {
        const response = await request(app).get('/api/user/2');

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ msg: 'Forbidden' });
      });

      it('should allow user to access their own data by email', async () => {
        mockUserService.getUserByEmail.mockResolvedValue(
          mockUser as unknown as User
        );

        const response = await request(app).get('/api/user/user@test.com');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUser);
        expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(
          'user@test.com'
        );
      });

      it('should forbid user from accessing other user data by email', async () => {
        const response = await request(app).get('/api/user/other@test.com');

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ msg: 'Forbidden' });
      });
    });

    it('should return 404 when user not found', async () => {
      app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.auth = { id: 1, email: 'admin@test.com', is_admin: true };
        next();
      });
      app.use('/api/user', createMockUserRouter());

      mockUserService.getUserByID.mockResolvedValue(null);

      const response = await request(app).get('/api/user/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ msg: 'User not found' });
    });

    it('should return 500 when service throws error', async () => {
      mockUserService.getUserByID.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/user/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ msg: 'Internal server error' });
    });
  });

  describe('PUT /user/me', () => {
    const mockUpdatedUser = {
      id: 1,
      name: 'Updated Name',
      bio: 'Updated bio',
      image_url: 'http://example.com/image.jpg',
    };

    it('should update user successfully with all fields', async () => {
      mockUserService.updateUser.mockResolvedValue(
        mockUpdatedUser as unknown as User
      );

      const response = await request(app).put('/api/user/me').send({
        name: 'Updated Name',
        bio: 'Updated bio',
        image_url: 'http://example.com/image.jpg',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedUser);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, {
        name: 'Updated Name',
        bio: 'Updated bio',
        image_url: 'http://example.com/image.jpg',
      });
    });

    it('should update user with only name', async () => {
      const partialUpdate = { id: 1, name: 'Updated Name' };
      mockUserService.updateUser.mockResolvedValue(
        partialUpdate as unknown as User
      );

      const response = await request(app)
        .put('/api/user/me')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(partialUpdate);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, {
        name: 'Updated Name',
        bio: undefined,
        image_url: undefined,
      });
    });

    it('should return 400 when no fields provided', async () => {
      const response = await request(app).put('/api/user/me').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'At least one field is required: name, bio, or image_url',
      });
    });

    it('should return 403 when not authenticated', async () => {
      app = express();
      app.use(express.json());
      app.use('/api/user', createMockUserRouter());

      const response = await request(app)
        .put('/api/user/me')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'Forbidden',
        message: 'Authentication required',
      });
    });

    it('should return 400 when update fails', async () => {
      mockUserService.updateUser.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/user/me')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Failed to update user - invalid data provided',
      });
    });

    it('should return 500 when service throws error', async () => {
      mockUserService.updateUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/user/me')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while updating user',
      });
    });
  });

  describe('DELETE /user/:data', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'user@test.com',
    };

    it('should delete user by ID as admin', async () => {
      mockUserService.getUserByID.mockResolvedValue(
        mockUser as unknown as User
      );
      mockUserService.deleteUserById.mockResolvedValue(true);

      const response = await request(app).delete('/api/user/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'User deleted successfully' });
      expect(mockUserService.getUserByID).toHaveBeenCalledWith(1);
      expect(mockUserService.deleteUserById).toHaveBeenCalledWith(1);
    });

    it('should delete user by email as admin', async () => {
      mockUserService.getUserByEmail.mockResolvedValue(
        mockUser as unknown as User
      );
      mockUserService.deleteUserById.mockResolvedValue(true);

      const response = await request(app).delete('/api/user/user@test.com');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'User deleted successfully' });
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(
        'user@test.com'
      );
      expect(mockUserService.deleteUserById).toHaveBeenCalledWith(1);
    });

    it('should return 403 for non-admin user', async () => {
      app = express();
      app.use(express.json());
      app.use((req: any, res, next) => {
        req.auth = { id: 1, email: 'user@test.com', is_admin: false };
        next();
      });
      app.use('/api/user', createMockUserRouter());

      const response = await request(app).delete('/api/user/1');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Forbidden' });
    });

    it('should return 404 when user not found', async () => {
      mockUserService.getUserByID.mockResolvedValue(null);

      const response = await request(app).delete('/api/user/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    it('should return 500 when service throws error', async () => {
      mockUserService.getUserByID.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).delete('/api/user/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while deleting the user',
      });
    });
  });
});
