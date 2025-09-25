import { getAllUsers, getUserByID } from './user.service';
import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import admin from '../../middleware/admin';
import { AppDataSource } from '../../config/db';
import { User } from '../../config/entity/User';

import * as userService from './user.service';

const router = express.Router();

/* User Route GET */

/**
 * @swagger
 * /user:
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
 * /user/me:
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
        return res.status(404).json({ error: 'User not found' });
      }
      const userResponse = {
        ...user,
        password: undefined,
      };
      return res.status(200).json(userResponse);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /user/{data}:
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

      const { is_admin, id, email } = req.auth;
      const { data } = req.params;
      let user = null;

      const isNumeric = /^\d+$/.test(data);

      if (is_admin) {
        // Admin: can access any user
        if (isNumeric) {
          user = await userService.getUserByID(Number(data));
        } else {
          user = await userService.getUserByEmail(data);
        }
      } else {
        // Non-admin: can access only their own data
        if (isNumeric) {
          if (Number(data) !== id) {
            return res.status(403).json({ msg: 'Forbidden' });
          }
          user = await userService.getUserByID(id);
        } else {
          if (data !== email) {
            return res.status(403).json({ msg: 'Forbidden' });
          }
          user = await userService.getUserByEmail(email);
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
 * /user/me:
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
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
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
      const { name, bio, image_url } = req.body;

      // Require at least one field
      if (!name && !bio && !image_url) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'At least one field is required: name, bio, or image_url',
        });
      }

      // Ensure auth exists
      if (!req.auth) {
        return res
          .status(403)
          .json({ error: 'Forbidden', message: 'Authentication required' });
      }

      const userId = Number(req.auth.id);
      if (isNaN(userId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid user ID in authentication token',
        });
      }

      const updatedUser = await userService.updateUser(userId, {
        name,
        bio,
        image_url,
      });

      if (!updatedUser) {
        console.log('updateUser returned null');
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Failed to update user - invalid data provided',
        });
      }

      return res.status(200).json(updatedUser);
    } catch (err: unknown) {
      console.error(err);
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
 * /user/{data}:
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
        return res.status(404).json({ error: 'User not found' });
      }

      await userRepository.delete(userToDelete.id);

      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while deleting the user',
      });
    }
  }
);

export default router;
