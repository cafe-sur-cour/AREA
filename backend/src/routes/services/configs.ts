import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { UserServiceConfigService } from '../../services/UserServiceConfigService';

const router = express.Router();
const userServiceConfigService = new UserServiceConfigService();

/**
 * @swagger
 * /api/services/configs:
 *   get:
 *     summary: Get all service configurations for the authenticated user
 *     tags:
 *       - Service Configurations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's service configurations
 *       500:
 *         description: Internal server error
 */
router.get(
  '/configs',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const configs =
        await userServiceConfigService.getUserServiceConfigs(userId);

      return res.status(200).json({
        configs: configs.map(config => ({
          id: config.id,
          service: config.service,
          settings: config.settings,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at,
        })),
      });
    } catch (err) {
      console.error('Error fetching service configs:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/services/configs/{service}:
 *   get:
 *     summary: Get a specific service configuration
 *     tags:
 *       - Service Configurations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service configuration details
 *       404:
 *         description: Service configuration not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/configs/:service',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const { service } = req.params;

      if (!service) {
        return res.status(400).json({ error: 'Service parameter is required' });
      }

      const config = await userServiceConfigService.getUserServiceConfig(
        userId,
        service
      );

      if (!config) {
        return res.status(404).json({
          error: 'Service configuration not found',
        });
      }

      return res.status(200).json({
        config: {
          id: config.id,
          service: config.service,
          settings: config.settings,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at,
        },
      });
    } catch (err) {
      console.error('Error fetching service config:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/services/configs:
 *   post:
 *     summary: Create or update a service configuration
 *     tags:
 *       - Service Configurations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service
 *               - credentials
 *             properties:
 *               service:
 *                 type: string
 *               credentials:
 *                 type: object
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Service configuration created/updated
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post(
  '/configs',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const { service, credentials, settings } = req.body;

      if (!service || !credentials) {
        return res.status(400).json({
          error: 'Service and credentials are required',
        });
      }

      const config = await userServiceConfigService.upsertUserServiceConfig(
        userId,
        {
          service,
          credentials,
          settings,
        }
      );

      return res.status(201).json({
        config: {
          id: config.id,
          service: config.service,
          settings: config.settings,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at,
        },
      });
    } catch (err) {
      console.error('Error creating/updating service config:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/services/configs/{service}:
 *   put:
 *     summary: Update a service configuration
 *     tags:
 *       - Service Configurations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credentials:
 *                 type: object
 *               settings:
 *                 type: object
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Service configuration updated
 *       404:
 *         description: Service configuration not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/configs/:service',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const { service } = req.params;

      if (!service) {
        return res.status(400).json({ error: 'Service parameter is required' });
      }

      const { credentials, settings, is_active } = req.body;

      const config = await userServiceConfigService.updateUserServiceConfig(
        userId,
        service,
        {
          credentials,
          settings,
          is_active,
        }
      );

      if (!config) {
        return res.status(404).json({
          error: 'Service configuration not found',
        });
      }

      return res.status(200).json({
        config: {
          id: config.id,
          service: config.service,
          settings: config.settings,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at,
        },
      });
    } catch (err) {
      console.error('Error updating service config:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/services/configs/{service}:
 *   delete:
 *     summary: Delete a service configuration
 *     tags:
 *       - Service Configurations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service configuration deleted
 *       404:
 *         description: Service configuration not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/configs/:service',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const { service } = req.params;

      if (!service) {
        return res.status(400).json({ error: 'Service parameter is required' });
      }

      const deleted = await userServiceConfigService.deleteUserServiceConfig(
        userId,
        service
      );

      if (!deleted) {
        return res.status(404).json({
          error: 'Service configuration not found',
        });
      }

      return res.status(200).json({
        message: 'Service configuration deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting service config:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
