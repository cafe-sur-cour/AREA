import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { serviceRegistry } from '../../services/ServiceRegistry';

const router = express.Router();

/**
 * @swagger
 * /api/services/actions:
 *   get:
 *     summary: Get all services that expose actions
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services with actions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       version:
 *                         type: string
 *                       actions:
 *                         type: array
 *                         items:
 *                           type: object
 *       500:
 *         description: Internal server error
 */
router.get(
  '/actions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const allServices = serviceRegistry.getAllServices();
      const servicesWithActions = allServices.filter(
        service => service.actions && service.actions.length > 0
      );

      return res.status(200).json({
        services: servicesWithActions.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          version: service.version,
          actions: service.actions,
        })),
      });
    } catch (err) {
      console.error('Error fetching services with actions:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/services/reactions:
 *   get:
 *     summary: Get all services that expose reactions
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services with reactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       version:
 *                         type: string
 *                       reactions:
 *                         type: array
 *                         items:
 *                           type: object
 *       500:
 *         description: Internal server error
 */
router.get(
  '/reactions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const allServices = serviceRegistry.getAllServices();
      const servicesWithReactions = allServices.filter(
        service => service.reactions && service.reactions.length > 0
      );

      return res.status(200).json({
        services: servicesWithReactions.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          version: service.version,
          reactions: service.reactions,
        })),
      });
    } catch (err) {
      console.error('Error fetching services with reactions:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/services/{id}/actions:
 *   get:
 *     summary: Get all actions of a specific service
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: List of actions for the service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service_id:
 *                   type: string
 *                 service_name:
 *                   type: string
 *                 actions:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/actions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Service ID is required' });
      }

      const service = serviceRegistry.getService(id);

      if (!service) {
        return res.status(404).json({
          error: 'Service not found',
          service_id: id,
        });
      }

      return res.status(200).json({
        service_id: service.id,
        service_name: service.name,
        actions: service.actions,
      });
    } catch (err) {
      console.error('Error fetching service actions:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/services/{id}/reactions:
 *   get:
 *     summary: Get all reactions of a specific service
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: List of reactions for the service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service_id:
 *                   type: string
 *                 service_name:
 *                   type: string
 *                 reactions:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/reactions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Service ID is required' });
      }

      const service = serviceRegistry.getService(id);

      if (!service) {
        return res.status(404).json({
          error: 'Service not found',
          service_id: id,
        });
      }

      return res.status(200).json({
        service_id: service.id,
        service_name: service.name,
        reactions: service.reactions,
      });
    } catch (err) {
      console.error('Error fetching service reactions:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
