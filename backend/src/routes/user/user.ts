import { getAllUsers, getUserByID } from './user.service';
import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import admin from '../../middleware/admin';

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
  admin,
  async (_req: Request, res: Response): Promise<Response | void> => {
    return res.status(500).json({ error: 'Internal Server Error' });
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
    return res.status(500).json({ error: 'Internal Server Error' });
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
);

export default router;
