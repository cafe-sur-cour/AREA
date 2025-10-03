import {
  getAllUsers,
  getUserByID,
  getUserByEmail,
  updateUser,
} from './user.service';
import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import admin from '../../middleware/admin';
import { AppDataSource } from '../../config/db';
import { User } from '../../config/entity/User';
import { createLog } from '../logs/logs.service';

const router = express.Router();

/* User Route GET */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     description: Returns a list of all users. Requires admin privileges.
 *     responses:
 *       200:
 *         description: An array of user objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - admin privileges required
 *       500:
 *         description: Internal Server Error
 */

router.get(
  '/',
  token,
  admin,
  async (_req: Request, res: Response): Promise<Response | void> => {
    try {
      const users = await getAllUsers();
      return res.status(200).json(users);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     description: Returns the current authenticated user's information. Token required.
 *     responses:
 *       200:
 *         description: The authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */

router.get(
  '/me',
  token,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const basicUserInfo = req.auth as { id: number; email: string };
      const user = await getUserByID(basicUserInfo.id);
      if (!user) {
        await createLog(404, 'user', `User not found: ${basicUserInfo.id}`);
        return res.status(404).json({ error: 'User not found' });
      }
      const userResponse = {
        ...user,
        password: undefined,
      };
      return res.status(200).json(userResponse);
    } catch (err) {
      console.error(err);
      await createLog(500, 'user', `Internal Server Error: ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/user/{data}:
 *   get:
 *     summary: Get a user by id, email or name
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: data
 *         required: true
 *         description: The user identifier - can be a numeric id, email or username
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */

router.get(
  '/:data',
  token,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      if (!req.auth) {
        return res.status(403).json({ msg: 'Forbidden' });
      }

      const auth = req.auth as { id: number; email: string; is_admin: boolean };
      const { is_admin, id, email } = auth;
      const { data } = req.params;

      if (!data) {
        return res.status(400).json({ msg: 'Data parameter is required' });
      }

      let user = null;

      const isNumeric = /^\d+$/.test(data);

      if (is_admin) {
        // Admin: can access any user
        if (isNumeric) {
          user = await getUserByID(Number(data));
        } else {
          user = await getUserByEmail(data);
        }
      } else {
        // Non-admin: can access only their own data
        if (isNumeric) {
          if (Number(data) !== id) {
            return res.status(403).json({ msg: 'Forbidden' });
          }
          user = await getUserByID(id);
        } else {
          if (data !== email) {
            return res.status(403).json({ msg: 'Forbidden' });
          }
          user = await getUserByEmail(email);
        }
      }

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      return res.status(200).json(user);
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({ msg: 'Internal server error' });
    }
  }
);

/* User Route Put */
/**
 * @swagger
 * /api/user/me:
 *   put:
 *     summary: Update current authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     description: Update fields of the authenticated user. Token required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               picture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad Request - validation error
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal Server Error
 */

router.put(
  '/me',
  token,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { name, bio, picture } = req.body;

      if (!name && !bio && !picture) {
        await createLog(
          400,
          'user',
          'Bad Request: At least one field is required'
        );
        return res.status(400).json({
          error: 'Bad Request',
          message: 'At least one field is required: name, bio, or picture',
        });
      }

      if (!req.auth) {
        await createLog(
          403,
          'user',
          'Forbidden: Authentication required to update profile'
        );
        return res
          .status(403)
          .json({ error: 'Forbidden', message: 'Authentication required' });
      }

      const auth = req.auth as { id: number; email: string; is_admin: boolean };
      const userId = Number(auth.id);
      if (isNaN(userId)) {
        await createLog(400, 'user', 'Bad Request: Invalid user ID in token');
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid user ID in authentication token',
        });
      }

      const updatedUser = await updateUser(userId, {
        name,
        bio,
        picture,
      });

      if (!updatedUser) {
        console.log('updateUser returned null');
        await createLog(
          400,
          'user',
          'Bad Request: Failed to update profile - invalid data provided'
        );
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Failed to update user - invalid data provided',
        });
      }

      await createLog(
        200,
        'user',
        `User updated successfully: ${updatedUser.email}`
      );
      return res.status(200).json(updatedUser);
    } catch (err: unknown) {
      console.error(err);
      await createLog(500, 'user', `Internal Server Error: ${err}`);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while updating user',
      });
    }
  }
);

/* User Route Post */

/* User Route Delete */
/**
 * @swagger
 * /api/user/{data}:
 *   delete:
 *     summary: Delete a user by id, email or name
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: data
 *         required: true
 *         description: The user identifier to delete - id, email or username
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully (no content)
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */

router.delete(
  '/:data',
  token,
  admin,
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { data } = req.params;

      if (!data) {
        await createLog(400, 'user', 'Bad Request: Data parameter is required');
        return res.status(400).json({ error: 'Data parameter is required' });
      }

      const userRepository = AppDataSource.getRepository(User);
      let userToDelete: User | null = null;

      const isNumeric = /^\d+$/.test(data);

      if (isNumeric) {
        const userId = Number(data);
        userToDelete = await userRepository.findOne({ where: { id: userId } });
      } else {
        userToDelete = await userRepository.findOne({ where: { email: data } });
      }

      if (!userToDelete) {
        await createLog(404, 'user', `User not found for deletion: ${data}`);
        return res.status(404).json({ error: 'User not found' });
      }

      await userRepository.delete(userToDelete.id);

      await createLog(200, 'user', `User deleted successfully: ${data}`);
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (err: unknown) {
      console.error(err);
      await createLog(500, 'user', `Internal Server Error: ${err}`);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while deleting the user',
      });
    }
  }
);

export default router;
